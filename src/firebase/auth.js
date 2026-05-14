// Auth helpers — email + password.
// Uses Firebase Authentication when configured. Falls back to a localStorage-based
// mock so the UI is fully usable during development without a backend.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config.js";
import {
  createUserDoc,
  getUserByEmail,
  getUserByNickname,
} from "./firestore.js";

const STORE_KEY = "oqunet:auth";

function readMock() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; }
}
function writeMock(value) {
  if (value) localStorage.setItem(STORE_KEY, JSON.stringify(value));
  else localStorage.removeItem(STORE_KEY);
}

/**
 * Register a new user with email + password.
 * Creates a Firebase Auth user and a profile document in Firestore.
 */
export async function registerWithEmail({
  email, password, nickname, firstName, lastName, notificationsEnabled, photoURL,
}) {
  const cleanEmail = email.trim().toLowerCase();

  // Uniqueness checks
  const nickTaken = await getUserByNickname(nickname);
  if (nickTaken) throw new Error("Этот никнейм уже занят");
  const emailTaken = await getUserByEmail(cleanEmail);
  if (emailTaken) throw new Error("Этот email уже зарегистрирован");

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
    nickname,
    firstName,
    lastName,
    // Password is only stored in the local mock layer (so nickname-login can verify).
    // When Firebase is configured we let Firebase Auth handle credentials.
    password: isFirebaseConfigured ? undefined : password,
    notificationsEnabled: Boolean(notificationsEnabled),
    photoURL: photoURL || "",
    role: "user",
    communityId: null,
    createdAt: Date.now(),
  };
  await createUserDoc(profile);
  writeMock({ uid });
  return profile;
}

/**
 * Sign in with either an email or a nickname, plus password.
 * When using Firebase, nickname is resolved to its email before calling signInWithEmailAndPassword.
 */
export async function signInWithIdentifier({ identifier, password }) {
  const id = identifier.trim();
  const isEmail = id.includes("@");
  const user = isEmail
    ? await getUserByEmail(id)
    : await getUserByNickname(id);
  if (!user) throw new Error("Пользователь не найден");

  if (isFirebaseConfigured) {
    await signInWithEmailAndPassword(auth, user.email, password);
  } else {
    if (user.password !== password) throw new Error("Неверный пароль");
  }
  writeMock({ uid: user.id });
  return user;
}

export async function signOut() {
  if (isFirebaseConfigured) {
    try { await fbSignOut(auth); } catch { /* ignore */ }
  }
  writeMock(null);
}

export function getMockSession() {
  return readMock();
}
