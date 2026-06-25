// Progress + book metadata storage for the audio reader.
// Firestore when available, localStorage fallback so the feature works offline.

import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config.js";

const LS_KEY = "oqunet:audioBooks";

function readLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLS(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // quota / private mode — silently ignore
  }
}

function userScope(userId) {
  const all = readLS();
  if (!all[userId]) all[userId] = {};
  return { all, scope: all[userId] };
}

export async function saveAudioBookMeta(userId, book) {
  if (!userId || !book?.id) return;
  const meta = {
    id: book.id,
    title: book.title,
    pageCount: book.pageCount,
    lang: book.lang || "en",
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, "users", userId, "audioBooks", book.id), meta, { merge: true });
    } catch {
      // fall through to LS
    }
  }

  const { all, scope } = userScope(userId);
  scope[book.id] = { ...(scope[book.id] || {}), ...meta };
  writeLS(all);
}

export async function saveProgress(userId, bookId, progress) {
  if (!userId || !bookId) return;
  const payload = {
    page: progress.page ?? 0,
    sentence: progress.sentence ?? 0,
    updatedAt: Date.now(),
  };

  if (isFirebaseConfigured) {
    try {
      await setDoc(
        doc(db, "users", userId, "audioBooks", bookId),
        { progress: payload },
        { merge: true }
      );
    } catch {
      // fall through to LS
    }
  }

  const { all, scope } = userScope(userId);
  scope[bookId] = { ...(scope[bookId] || {}), progress: payload };
  writeLS(all);
}

export async function loadProgress(userId, bookId) {
  if (!userId || !bookId) return { page: 0, sentence: 0 };

  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(db, "users", userId, "audioBooks", bookId));
      if (snap.exists() && snap.data()?.progress) return snap.data().progress;
    } catch {
      // fall through to LS
    }
  }

  const { scope } = userScope(userId);
  return scope[bookId]?.progress || { page: 0, sentence: 0 };
}

export async function listAudioBooks(userId) {
  if (!userId) return [];

  if (isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, "users", userId, "audioBooks"));
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch {
      // fall through
    }
  }

  const { scope } = userScope(userId);
  return Object.values(scope).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function deleteAudioBook(userId, bookId) {
  if (!userId || !bookId) return;
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, "users", userId, "audioBooks", bookId));
    } catch {
      // ignore — LS still cleans
    }
  }
  const { all, scope } = userScope(userId);
  delete scope[bookId];
  writeLS(all);
}

// PDFs themselves are too large for Firestore. We keep the extracted/cleaned
// page array in IndexedDB (via simple key-value blob in localStorage as
// fallback). Real apps should swap this for IDB or Firebase Storage.
const PAGES_LS = "oqunet:audioPages";

export function savePages(userId, bookId, pages) {
  try {
    const key = `${PAGES_LS}:${userId}:${bookId}`;
    localStorage.setItem(key, JSON.stringify(pages));
  } catch {
    // quota — caller can retry / chunk
  }
}

export function loadPages(userId, bookId) {
  try {
    const key = `${PAGES_LS}:${userId}:${bookId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deletePages(userId, bookId) {
  try {
    localStorage.removeItem(`${PAGES_LS}:${userId}:${bookId}`);
  } catch {
    // ignore
  }
}
