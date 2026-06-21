// Firestore data layer with a transparent localStorage fallback.
// Collections: users, communities, books, posts, notifications, requests, borrowings, ratings, reviews

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config.js";

// ---------- localStorage fallback ----------
const LS_KEY = "oqunet:db";
function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || emptyDb(); }
  catch { return emptyDb(); }
}
function emptyDb() {
  return {
    users: [], communities: [], books: [], posts: [],
    notifications: [], requests: [], borrowings: [], ratings: [], reviews: [],
  };
}
function writeLS(data) { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// ---------- Generic helpers ----------
async function getCollection(name, { where: wheres = [], orderByField, descending = false, pageSize, cursor } = {}) {
  if (isFirebaseConfigured) {
    const constraints = wheres.map(([f, op, v]) => where(f, op, v));
    if (orderByField) constraints.push(orderBy(orderByField, descending ? "desc" : "asc"));
    if (cursor) constraints.push(startAfter(cursor));
    if (pageSize) constraints.push(limit(pageSize));
    const q = query(collection(db, name), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const data = readLS();
  let rows = data[name] || [];
  wheres.forEach(([f, op, v]) => {
    rows = rows.filter((r) => {
      if (op === "==") return r[f] === v;
      if (op === "!=") return r[f] !== v;
      if (op === ">=") return r[f] >= v;
      if (op === "<=") return r[f] <= v;
      if (op === "in") return v.includes(r[f]);
      if (op === "array-contains") return Array.isArray(r[f]) && r[f].includes(v);
      return true;
    });
  });
  if (orderByField) {
    rows = [...rows].sort((a, b) => {
      const av = a[orderByField] ?? 0;
      const bv = b[orderByField] ?? 0;
      return descending ? bv - av : av - bv;
    });
  }
  if (pageSize) rows = rows.slice(0, pageSize);
  return rows;
}

async function getOne(name, id) {
  if (!id) return null;
  if (isFirebaseConfigured) {
    const snap = await getDoc(doc(db, name, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  }
  const data = readLS();
  return (data[name] || []).find((r) => r.id === id) || null;
}

async function createOne(name, payload) {
  if (isFirebaseConfigured) {
    if (payload.id) {
      await setDoc(doc(db, name, payload.id), { ...payload, createdAt: serverTimestamp() });
      return payload;
    }
    const ref = await addDoc(collection(db, name), { ...payload, createdAt: serverTimestamp() });
    return { id: ref.id, ...payload };
  }
  const data = readLS();
  const record = { id: payload.id || uid(), createdAt: Date.now(), ...payload };
  data[name] = data[name] || [];
  data[name].push(record);
  writeLS(data);
  return record;
}

async function updateOne(name, id, patch) {
  if (isFirebaseConfigured) {
    await updateDoc(doc(db, name, id), patch);
    return { id, ...patch };
  }
  const data = readLS();
  const idx = (data[name] || []).findIndex((r) => r.id === id);
  if (idx >= 0) {
    data[name][idx] = { ...data[name][idx], ...patch };
    writeLS(data);
    return data[name][idx];
  }
  return null;
}

async function deleteOne(name, id) {
  if (isFirebaseConfigured) { await deleteDoc(doc(db, name, id)); return; }
  const data = readLS();
  data[name] = (data[name] || []).filter((r) => r.id !== id);
  writeLS(data);
}

// ---------- Users ----------
export async function createUserDoc(profile) { return createOne("users", profile); }
export async function getUserById(id) { return getOne("users", id); }
export async function getUserByNickname(nickname) {
  const rows = await getCollection("users", { where: [["nickname", "==", nickname]] });
  return rows[0] || null;
}
export async function getUserByEmail(email) {
  const rows = await getCollection("users", { where: [["email", "==", email.toLowerCase()]] });
  return rows[0] || null;
}
export async function updateUser(id, patch) { return updateOne("users", id, patch); }
export async function listUsersByCommunity(communityId) {
  return getCollection("users", { where: [["communityId", "==", communityId]] });
}
export async function searchUsers(qStr) {
  const rows = await getCollection("users");
  const s = qStr.toLowerCase();
  return rows.filter(
    (u) =>
      u.nickname?.toLowerCase().includes(s) ||
      u.firstName?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s)
  );
}

// ---------- Communities ----------
export async function getCommunityByNickname(nickname) {
  const rows = await getCollection("communities", { where: [["nickname", "==", nickname]] });
  return rows[0] || null;
}
export async function createCommunity(payload) { return createOne("communities", payload); }
export async function getCommunity(id) { return getOne("communities", id); }
export async function updateCommunity(id, patch) { return updateOne("communities", id, patch); }
export async function searchCommunities(qStr) {
  const rows = await getCollection("communities");
  const s = qStr.toLowerCase();
  return rows.filter((c) => c.nickname?.toLowerCase().includes(s) || c.name?.toLowerCase().includes(s));
}
export async function listCommunities() { return getCollection("communities"); }

// ---------- Books ----------
export async function createBook(payload) { return createOne("books", payload); }
export async function listBooks({ communityId, search, status, genres, pageSize = 30, cursor = null } = {}) {
  const wheres = [];
  if (communityId) wheres.push(["communityId", "==", communityId]);
  if (status) wheres.push(["status", "==", status]);
  let rows = await getCollection("books", { where: wheres, pageSize: pageSize + 1, cursor }); // +1 to detect if there are more
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((b) => b.name?.toLowerCase().includes(s) || b.author?.toLowerCase().includes(s));
  }
  // Genre filtering is client-side (multi-select, no Firestore compound index needed)
  if (genres && genres.length > 0) {
    rows = rows.filter((b) => genres.includes(b.genre));
  }
  
  // Check if there are more results
  let hasMore = false;
  let nextCursor = null;
  if (rows.length > pageSize) {
    hasMore = true;
    rows = rows.slice(0, pageSize);
    nextCursor = rows[rows.length - 1] || null;
  }
  
  return { items: rows, nextCursor, hasMore };
}

/**
 * Batch fetch ratings for multiple books with concurrency control
 */
export async function listRatingsForBooks(bookIds, concurrency = 5) {
  if (!bookIds || bookIds.length === 0) return {};
  
  // Return map of bookId -> { count, average }
  const ratingMap = {};
  
  // Initialize all books with empty ratings
  bookIds.forEach((bookId) => {
    ratingMap[bookId] = { count: 0, average: 0 };
  });

  // Fetch ratings in batches
  for (let i = 0; i < bookIds.length; i += concurrency) {
    const batch = bookIds.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((id) => listRatingsForBook(id))
    );
    
    // Map results back to book IDs
    batchResults.forEach((ratings, idx) => {
      const bookId = batch[idx];
      if (ratings && ratings.length > 0) {
        ratingMap[bookId] = {
          count: ratings.length,
          average: ratings.reduce((s, r) => s + (r.value || 0), 0) / ratings.length,
        };
      }
    });
  }
  
  return ratingMap;
}

export async function getBook(id) { return getOne("books", id); }
export async function updateBook(id, patch) { return updateOne("books", id, patch); }
export async function deleteBook(id) { return deleteOne("books", id); }

// ---------- Posts ----------
export async function createPost(payload) { return createOne("posts", payload); }
export async function listPostsByCommunity(communityId, pageSize = 30) {
  // No orderBy here — avoids the Firestore composite index requirement.
  // Sort client-side instead.
  const rows = await getCollection("posts", {
    where: [["communityId", "==", communityId]],
    pageSize,
  });
  return rows.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
    return bt - at;
  });
}

// Fetch all posts across all communities (for global feed)
export async function listAllPosts(pageSize = 100) {
  const rows = await getCollection("posts", { pageSize });
  return rows.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
    const bt = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
    return bt - at;
  });
}

// ---------- Notifications ----------
export async function createNotification(payload) {
  return createOne("notifications", payload);
}

export async function getNotificationById(id) {
  return getOne("notifications", id);
}

// Fetch without orderBy to avoid Firestore silently skipping docs
// whose serverTimestamp() hasn't resolved yet; sort client-side instead.
export async function listNotifications(userId) {
  if (isFirebaseConfigured) {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId)
    );
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => {
      const at = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
      const bt = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
      return bt - at;
    });
    return rows;
  }
  const data = readLS();
  const rows = (data.notifications || []).filter((n) => n.recipientId === userId);
  rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return rows;
}

export async function markNotificationRead(id) {
  return updateOne("notifications", id, { read: true });
}
export async function updateNotification(id, patch) {
  return updateOne("notifications", id, patch);
}
export async function deleteNotification(id) {
  return deleteOne("notifications", id);
}

// ---------- Join requests ----------
export async function createJoinRequest(payload) {
  return createOne("requests", { type: "join", status: "pending", ...payload });
}
export async function listJoinRequests(communityId) {
  return getCollection("requests", {
    where: [["communityId", "==", communityId], ["type", "==", "join"]],
  });
}
export async function updateJoinRequest(id, patch) { return updateOne("requests", id, patch); }
export async function cancelJoinRequest(id) { return updateOne("requests", id, { status: "cancelled" }); }

// ---------- Leave requests ----------
export async function createLeaveRequest(payload) {
  return createOne("requests", { type: "leave", status: "pending", ...payload });
}
export async function listLeaveRequests(communityId) {
  return getCollection("requests", {
    where: [["communityId", "==", communityId], ["type", "==", "leave"], ["status", "==", "pending"]],
  });
}
export async function getPendingLeaveRequest(userId) {
  const rows = await getCollection("requests", {
    where: [["userId", "==", userId], ["type", "==", "leave"], ["status", "==", "pending"]],
  });
  return rows[0] || null;
}
export async function updateLeaveRequest(id, patch) { return updateOne("requests", id, patch); }

// ---------- Pickup requests ----------
// Stored in the same "requests" collection with type:"pickup".
// One pending request per user per book at a time.

export async function createPickupRequest(payload) {
  return createOne("requests", { type: "pickup", status: "pending", ...payload });
}

/** Return the pending pickup request for a given user + book, or null. */
export async function getPickupRequest(bookId, requesterId) {
  // Query by requesterId + type; filter bookId in JS to minimise index requirements.
  const rows = await getCollection("requests", {
    where: [["requesterId", "==", requesterId], ["type", "==", "pickup"], ["status", "==", "pending"]],
  });
  return rows.find((r) => r.bookId === bookId) || null;
}

/** Update any field on a pickup request (e.g. refresh the pickupCode). */
export async function updatePickupRequest(id, patch) {
  return updateOne("requests", id, patch);
}

/** Mark a pickup request as cancelled. */
export async function cancelPickupRequest(id) {
  return updateOne("requests", id, { status: "cancelled" });
}

/** Mark a pickup request as fulfilled (book successfully received). */
export async function fulfillPickupRequest(id) {
  return updateOne("requests", id, { status: "fulfilled" });
}

// ---------- Borrowings ----------
export async function createBorrowing(payload) {
  return createOne("borrowings", { status: "active", ...payload });
}
export async function getActiveBorrowingForUser(userId) {
  const rows = await getCollection("borrowings", {
    where: [["borrowerId", "==", userId], ["status", "==", "active"]],
  });
  return rows[0] || null;
}
// Get the active borrowing for a specific book (to find current holder + pickup code)
export async function getActiveBorrowingByBook(bookId) {
  const rows = await getCollection("borrowings", {
    where: [["bookId", "==", bookId], ["status", "==", "active"]],
  });
  return rows[0] || null;
}

// Get the most recent completed borrowing for a book (to show the last holder)
export async function getLastCompletedBorrowingByBook(bookId) {
  const rows = await getCollection("borrowings", {
    where: [["bookId", "==", bookId], ["status", "==", "completed"]],
    orderByField: "createdAt",
    descending: true,
    pageSize: 1,
  });
  return rows[0] || null;
}
export async function listBorrowingsForUser(userId, status) {
  const wheres = [["borrowerId", "==", userId]];
  if (status) wheres.push(["status", "==", status]);
  return getCollection("borrowings", { where: wheres });
}
export async function listBorrowingsByOwner(ownerId) {
  return getCollection("borrowings", { where: [["ownerId", "==", ownerId]] });
}
export async function updateBorrowing(id, patch) { return updateOne("borrowings", id, patch); }

// ---------- Ratings & reviews ----------
export async function addRating(payload) { return createOne("ratings", payload); }
export async function listRatingsForBook(bookId) { return getCollection("ratings", { where: [["bookId", "==", bookId]] }); }

/**
 * Batch fetch books by IDs with concurrency control
 */
export async function getBooksByIds(bookIds, concurrency = 5) {
  if (!bookIds || bookIds.length === 0) return [];
  
  const results = [];
  for (let i = 0; i < bookIds.length; i += concurrency) {
    const batch = bookIds.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((id) => getBook(id))
    );
    results.push(...batchResults.filter(Boolean));
  }
  
  return results;
}

export async function addReview(payload) { return createOne("reviews", payload); }
export async function listReviewsForBook(bookId) { return getCollection("reviews", { where: [["bookId", "==", bookId]] }); }