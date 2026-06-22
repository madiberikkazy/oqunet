// Auth helpers — email + password + Google.
// Uses Firebase Authentication when configured. Falls back to a localStorage-based
// mock so the UI is fully usable during development without a backend.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config.js";
import {
  createUserDoc,
  getUserByEmail,
  getUserByNickname,
  getUserById,
} from "./firestore.js";
import { isEmail, isNickname, normalizeEmail, normalizeNickname, LIMITS } from "../utils/validators.js";
import { safeGet, safeSet, safeRemove } from "../utils/safeStorage.js";
import { logger } from "../utils/logger.js";
import { t } from "../utils/i18n.js";

const STORE_KEY = "oqunet:auth";

function readMock() {
  const raw = safeGet(STORE_KEY, null);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function writeMock(value) {
  if (value) safeSet(STORE_KEY, JSON.stringify(value));
  else safeRemove(STORE_KEY);
}

/**
 * Register a new user with email + password.
 * Creates a Firebase Auth user and a profile document in Firestore.
 */
export async function registerWithEmail({
  email, password, nickname, firstName, lastName, phone, notificationsEnabled, photoURL,
}) {
  const cleanEmail = normalizeEmail(email);
  const cleanNick = normalizeNickname(nickname);

  // Reject malformed input BEFORE hitting any network — defence in depth.
  if (!isEmail(cleanEmail)) throw new Error(t.emailInvalid);
  if (!isNickname(cleanNick)) throw new Error(t.registerErrNickname);
  if (typeof password !== "string" ||
      password.length < LIMITS.PASSWORD_MIN ||
      password.length > LIMITS.PASSWORD_MAX) {
    throw new Error(t.passwordWeak);
  }

  // Uniqueness checks. NOTE: there's a tiny TOCTOU window between checking
  // and creating; Firebase Auth's own uniqueness on email closes the email
  // race, and createUserWithEmailAndPassword will throw `auth/email-already-in-use`
  // which the caller maps via prettyError().
  const nickTaken = await getUserByNickname(cleanNick);
  if (nickTaken) throw new Error(t.nicknameTaken);
  const emailTaken = await getUserByEmail(cleanEmail);
  if (emailTaken) throw new Error(t.emailAlreadyInUse);

  let uid;
  if (isFirebaseConfigured) {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    uid = cred.user.uid;
  } else {
    uid = "mock-" + cleanEmail;
  }

  const profile = {
    id: uid,
    email: cleanEmail,
    nickname: cleanNick,
    firstName: (firstName || "").toString().trim().slice(0, 60),
    lastName: (lastName || "").toString().trim().slice(0, 60),
    phone: (phone || "").toString().trim().slice(0, 20),
    notificationsEnabled: Boolean(notificationsEnabled),
    photoURL: photoURL || "",
    role: "user",
    communityId: null,
    createdAt: Date.now(),
  };
  // Password is only stored in the local mock layer (so nickname-login can verify).
  // When Firebase is configured we let Firebase Auth handle credentials.
  if (!isFirebaseConfigured) {
    profile.password = password;
  }
  await createUserDoc(profile);
  writeMock({ uid });
  return profile;
}

/**
 * Sign in with either an email or a nickname, plus password.
 * When using Firebase, nickname is resolved to its email before calling signInWithEmailAndPassword.
 */
export async function signInWithIdentifier({ identifier, password }) {
  const idRaw = (identifier || "").toString().trim();
  if (!idRaw) throw new Error(t.registerErrEmail);
  if (typeof password !== "string" || password.length === 0) {
    throw new Error(t.loginErrorGeneric);
  }
  const looksLikeEmail = idRaw.includes("@");
  const user = looksLikeEmail
    ? await getUserByEmail(normalizeEmail(idRaw))
    : await getUserByNickname(normalizeNickname(idRaw));
  if (!user) throw new Error(t.loginErrorUserNotFound);

  if (isFirebaseConfigured) {
    await signInWithEmailAndPassword(auth, user.email, password);
  } else {
    if (user.password !== password) throw new Error(t.loginErrorWrongPassword);
  }
  writeMock({ uid: user.id });
  return user;
}

export async function signOut() {
  if (isFirebaseConfigured) {
    try { await fbSignOut(auth); }
    catch (err) { logger.warn("auth.signOut", err?.message, { code: err?.code }); }
  }
  writeMock(null);
}

export function getMockSession() {
  return readMock();
}

/**
 * Sign in (or register) with Google via popup.
 * - Returning users: loads existing profile from Firestore.
 * - New users: auto-creates a profile with data from the Google account.
 *   Nickname is derived from the email prefix (unique suffix added if needed).
 *   The user can update nickname/photo in Settings afterwards.
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured) {
    throw new Error("Google sign-in requires Firebase. Configure .env first.");
  }
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const fbUser = cred.user;

  // Check if this Google account already has a profile
  let profile = await getUserById(fbUser.uid);

  if (!profile) {
    // New user — build a profile from Google account data
    const nameParts = (fbUser.displayName || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName  = nameParts.slice(1).join(" ") || "";

    // Derive a unique nickname from the email prefix
    const base = (fbUser.email || "user").split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    let nickname = base || "user";
    let suffix = 1;
    while (await getUserByNickname(nickname)) {
      nickname = base + suffix++;
    }

    profile = {
      id: fbUser.uid,
      email: (fbUser.email || "").toLowerCase(),
      nickname,
      firstName,
      lastName,
      photoURL: fbUser.photoURL || "",
      notificationsEnabled: true,
      role: "user",
      communityId: null,
      createdAt: Date.now(),
    };
    await createUserDoc(profile);
  }

  writeMock({ uid: fbUser.uid });
  return profile;
}
