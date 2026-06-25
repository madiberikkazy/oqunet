// Smart PDF text cleaning utilities.
// Removes repeated headers/footers (book title, author), page numbers, and footnotes
// so the TTS reader doesn't break flow with junk text.

const PAGE_NUMBER_RE = /^\s*(?:page\s*)?[-–—]?\s*\d{1,4}\s*(?:\/\s*\d{1,4})?\s*[-–—]?\s*$/i;
const ROMAN_RE = /^\s*[ivxlcdm]{1,6}\s*$/i;
const FOOTNOTE_MARKER_RE = /^\s*(?:[\*†‡§¶]|\d{1,3})\s+\S/;

// Finds short lines that repeat across many pages — almost certainly running
// headers or footers (book title / author / chapter name). Returns a Set of
// normalized lines to strip.
export function detectRepeatedLines(pages, { minRepeatRatio = 0.4, maxLen = 80 } = {}) {
  if (!pages || pages.length < 3) return new Set();

  const counts = new Map();
  for (const text of pages) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const candidates = [...lines.slice(0, 2), ...lines.slice(-2)];
    const seen = new Set();
    for (const raw of candidates) {
      if (raw.length === 0 || raw.length > maxLen) continue;
      const norm = raw.toLowerCase().replace(/\s+/g, " ").replace(/\d+/g, "#");
      if (seen.has(norm)) continue;
      seen.add(norm);
      counts.set(norm, (counts.get(norm) || 0) + 1);
    }
  }

  const threshold = Math.max(3, Math.floor(pages.length * minRepeatRatio));
  const repeats = new Set();
  for (const [norm, count] of counts) {
    if (count >= threshold) repeats.add(norm);
  }
  return repeats;
}

function normalizeForCompare(line) {
  return line.toLowerCase().replace(/\s+/g, " ").replace(/\d+/g, "#").trim();
}

// Heuristic: a footnote block starts with a marker (digit / *) followed by text,
// is set apart at the bottom, and uses smaller body. Without font metrics we
// approximate: cut everything after a horizontal-rule-like line or the first
// numbered marker that appears in the last 30% of the page.
function stripFootnotes(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length < 8) return text;

  const cutZone = Math.floor(lines.length * 0.7);
  let cutAt = -1;

  for (let i = cutZone; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^[_\-—–]{5,}$/.test(line)) { cutAt = i; break; }
    if (FOOTNOTE_MARKER_RE.test(line) && line.length < 200) { cutAt = i; break; }
  }

  if (cutAt === -1) return text;
  return lines.slice(0, cutAt).join("\n");
}

export function cleanPageText(rawText, repeatedLines) {
  if (!rawText) return "";
  const withoutFootnotes = stripFootnotes(rawText);

  const cleaned = withoutFootnotes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((line) => {
      if (!line) return false;
      if (PAGE_NUMBER_RE.test(line)) return false;
      if (ROMAN_RE.test(line) && line.length <= 6) return false;
      if (repeatedLines && repeatedLines.has(normalizeForCompare(line))) return false;
      return true;
    })
    .join(" ")
    .replace(/-\s+/g, "")          // join words split by hyphenation across lines
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

// Splits cleaned text into sentence-sized chunks for progressive TTS playback.
// TTS engines choke on very long utterances, so we cap at ~280 chars.
export function splitIntoSentences(text, maxLen = 280) {
  if (!text) return [];
  const rough = text.match(/[^.!?…]+[.!?…]+["'»)\]]?|\S+$/g) || [text];

  const result = [];
  for (const piece of rough) {
    const s = piece.trim();
    if (!s) continue;
    if (s.length <= maxLen) {
      result.push(s);
      continue;
    }
    // Fall back to comma / space splitting for very long runs.
    const parts = s.split(/(?<=,)\s+/);
    let buf = "";
    for (const p of parts) {
      if ((buf + " " + p).trim().length > maxLen) {
        if (buf) result.push(buf.trim());
        buf = p;
      } else {
        buf = buf ? buf + " " + p : p;
      }
    }
    if (buf) result.push(buf.trim());
  }
  return result;
}

// Optional Gemini polish — call only if an API key is configured. Network
// failures fall through silently to the regex-cleaned text, so the reader
// keeps working offline.
export async function polishWithGemini(text, apiKey, lang = "en") {
  if (!apiKey || !text || text.length < 40) return text;

  const prompt =
    `You are cleaning a single PDF page for text-to-speech in ${lang}. ` +
    `Remove repeated running headers/footers, page numbers, and footnotes. ` +
    `Keep the body prose intact. Return only the cleaned text, no commentary.\n\n` +
    text;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        }),
      }
    );
    if (!res.ok) return text;
    const data = await res.json();
    const out = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return out || text;
  } catch {
    return text;
  }
}
