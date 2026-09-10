// App-level constants shown on the settings screens.
//
// Kept here rather than read from package.json so the bundle doesn't carry the
// whole manifest, and so the support address has exactly one place to change.

export const APP_NAME = "OquNet";
export const APP_VERSION = "1.0";

/**
 * Support runs through Telegram, not email — it is where the community already
 * is, and it works the same on a phone with no mail client configured.
 *
 * `?direct` is carried through from the channel's own link; Telegram ignores
 * query parameters it doesn't recognise, so the link opens the channel either
 * way — in the installed app if there is one, in the web client otherwise.
 */
export const SUPPORT_TELEGRAM = "@oqunetapp";
export const SUPPORT_TELEGRAM_URL = "https://t.me/oqunetapp?direct";

/**
 * The two documents the stores require, as real pages rather than the old PDF.
 *
 * A PDF was fine while this was only a website. It is not fine now: App Store
 * Connect wants a privacy-policy *URL* it can open, review reads the terms
 * looking for specific clauses, and a phone opening a .docx.pdf gets whatever
 * viewer it happens to have. These are plain HTML, they follow the system's
 * light/dark setting, and they read the same on every device.
 *
 * `terms.html` carries the zero-tolerance clause App Store guideline 1.2
 * requires of an app with user-generated content — the counterpart to the
 * report and block controls in the app itself.
 */
export const TERMS_URL = "/terms.html";
export const PRIVACY_URL = "/privacy.html";
