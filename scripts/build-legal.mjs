/**
 * Generate public/terms.html from src/content/terms.js.
 *
 *   npm run legal
 *
 * The terms are shown in two places — a dialog inside the app during
 * registration, and a page on the web that the stores link to. Two hand-kept
 * copies of a legal document is two documents, and the day they disagree is
 * the day somebody agreed to wording we cannot produce. So the app renders the
 * source directly and this writes the page from the same source.
 *
 * public/privacy.html is *not* generated: it is never shown inside the app, so
 * it has only one copy and nothing to drift against.
 */

import { writeFileSync } from "node:fs";
import { TERMS_SECTIONS, TERMS_UPDATED, TERMS_VERSION } from "../src/content/terms.js";

/** Text going into markup. The content is ours, but escaping it is free. */
function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `@oqunetapp` becomes a link; everything else is left alone. */
function linkify(text) {
  return esc(text).replace(/@oqunetapp/g, '<a href="https://t.me/oqunetapp">@oqunetapp</a>');
}

function renderBlock(block) {
  if (block.p) return `<p>${linkify(block.p)}</p>`;
  if (block.list) {
    return `<ul>\n${block.list.map((item) => `  <li>${esc(item)}</li>`).join("\n")}\n</ul>`;
  }
  if (block.callout) {
    return `<div class="callout">\n  <strong>${esc(block.callout)}</strong>\n  ${esc(block.body)}\n</div>`;
  }
  return "";
}

const body = TERMS_SECTIONS
  .map((section) => [
    section.heading ? `<h2>${esc(section.heading)}</h2>` : "",
    ...section.body.map(renderBlock),
  ].filter(Boolean).join("\n"))
  .join("\n\n");

const html = `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<style>
  :root { color-scheme: light dark; --ink:#0F1724; --muted:#5B6573; --bg:#fff; --line:#EEF0F3; --brand:#2853AF; }
  @media (prefers-color-scheme: dark) {
    :root { --ink:#E8EAED; --muted:#A7ADB7; --bg:#0D1420; --line:#232B39; --brand:#8FA8DC; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:16px/1.65 -apple-system,BlinkMacSystemFont,"Inter",Segoe UI,Roboto,sans-serif;
         padding: max(24px, env(safe-area-inset-top)) 20px max(40px, env(safe-area-inset-bottom)); }
  main { max-width: 44rem; margin: 0 auto; }
  h1 { font-size:1.6rem; line-height:1.25; margin:0 0 .25rem; }
  h2 { font-size:1.05rem; margin:2rem 0 .5rem; }
  .meta { color:var(--muted); font-size:.85rem; margin:0 0 2rem; }
  ul { padding-left:1.15rem; }
  li { margin:.35rem 0; }
  a { color:var(--brand); }
  .callout { border:1px solid var(--line); border-radius:14px; padding:1rem 1.15rem; margin:1.25rem 0; }
  .callout strong { display:block; margin-bottom:.35rem; }
  footer { margin-top:2.5rem; padding-top:1.25rem; border-top:1px solid var(--line);
           color:var(--muted); font-size:.85rem; }
</style>
<title>Пайдалану шарттары — OquNet</title>
</head><body><main>
<h1>Пайдалану шарттары</h1>
<p class="meta">OquNet · Условия использования · редакция ${esc(TERMS_VERSION)} · обновлено ${esc(TERMS_UPDATED)}</p>

${body}

<footer>
  <p>См. также <a href="/privacy.html">Политику конфиденциальности</a>.</p>
  <p>Эта страница собрана из src/content/terms.js — того же текста, который приложение
     показывает при регистрации.</p>
</footer>
</main></body></html>
`;

writeFileSync(new URL("../public/terms.html", import.meta.url), html);
console.log(`public/terms.html — редакция ${TERMS_VERSION}, ${html.length} байт`);
