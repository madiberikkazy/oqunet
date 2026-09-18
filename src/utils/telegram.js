// Public bot username, shared by the website and locally built native apps.
// A Vercel environment variable is not available when Xcode/Android builds
// bundle the web app locally. Keep an explicit override for other deployments.
export function telegramBotUsername(configured) {
  return (configured || "").trim().replace(/^@/, "") || "oqunet_telegram_bot";
}
