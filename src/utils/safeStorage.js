// localStorage can throw in:
//   - private/incognito mode (Safari, especially older versions)
//   - when quota is exceeded
//   - in sandboxed iframes with storage disabled
//
// These helpers never throw — they return sensible defaults instead so the
// app keeps working even when persistence is unavailable.

import { logger } from "./logger.js";

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function safeGet(key, fallback = null) {
  if (!hasStorage()) return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (err) {
    logger.warn("storage", `read ${key} failed`, { err: err?.message });
    return fallback;
  }
}

export function safeSet(key, value) {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    logger.warn("storage", `write ${key} failed`, { err: err?.message });
    return false;
  }
}

export function safeRemove(key) {
  if (!hasStorage()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    logger.warn("storage", `remove ${key} failed`, { err: err?.message });
    return false;
  }
}

export function safeGetJSON(key, fallback = null) {
  const raw = safeGet(key, null);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    logger.warn("storage", `parse ${key} failed`, { err: err?.message });
    return fallback;
  }
}

export function safeSetJSON(key, value) {
  try {
    return safeSet(key, JSON.stringify(value));
  } catch (err) {
    logger.warn("storage", `stringify ${key} failed`, { err: err?.message });
    return false;
  }
}
