// Lightweight central logger.
// - Every log entry is timestamped and tagged with a scope.
// - Keeps a ring buffer of the last N entries in memory (handy for the
//   error boundary "Report" button or future diagnostics screens).
// - Mirrors to console with sensible levels.
// - Never throws — logging must NEVER take down the app.

const MAX_ENTRIES = 200;
const buffer = [];
const isProd = typeof import.meta !== "undefined" && import.meta.env?.PROD;

function push(level, scope, message, meta) {
  try {
    const entry = {
      ts: Date.now(),
      level,
      scope: scope || "app",
      message: typeof message === "string" ? message : safeStringify(message),
      meta: meta ? safeClone(meta) : undefined,
    };
    buffer.push(entry);
    if (buffer.length > MAX_ENTRIES) buffer.shift();
    return entry;
  } catch {
    return null;
  }
}

function safeStringify(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

function safeClone(v) {
  // Avoid sending huge objects / DOM nodes / errors with circular refs.
  try {
    if (v instanceof Error) {
      return { name: v.name, message: v.message, code: v.code, stack: v.stack };
    }
    return JSON.parse(JSON.stringify(v));
  } catch {
    return String(v);
  }
}

function emit(level, scope, message, meta) {
  const entry = push(level, scope, message, meta);
  // Always mirror errors to console; mirror everything else in dev only.
  if (level === "error" || level === "warn" || !isProd) {
    const tag = `[${scope || "app"}]`;
    const args = meta !== undefined ? [tag, message, meta] : [tag, message];
    // eslint-disable-next-line no-console
    (console[level] || console.log)(...args);
  }
  return entry;
}

export const logger = {
  debug(scope, message, meta) { return emit("debug", scope, message, meta); },
  info(scope, message, meta)  { return emit("info",  scope, message, meta); },
  warn(scope, message, meta)  { return emit("warn",  scope, message, meta); },
  error(scope, message, meta) { return emit("error", scope, message, meta); },
  recent(n = 50) { return buffer.slice(-n); },
  clear() { buffer.length = 0; },
};

/**
 * Install global handlers so unhandled errors and promise rejections
 * always end up in the logger (and don't silently crash the app).
 * Safe to call multiple times — installation is idempotent.
 */
let installed = false;
export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    logger.error("global.error", event?.message || "Unhandled error", {
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
      stack: event?.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    logger.error(
      "global.unhandledrejection",
      reason?.message || String(reason || "Unhandled promise rejection"),
      { stack: reason?.stack, code: reason?.code }
    );
  });
}
