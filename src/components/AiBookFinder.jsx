import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { askBookFinder } from "../utils/aiBooks.js";
import { t } from "../utils/i18n.js";

const THINKING = ["Looking through the shelf", "Understanding your request", "Choosing the best matches"];

function localMatches(question, books) {
  const tokens = String(question).toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return [...books].map((book) => {
    const haystack = [book.name, book.author, book.description, ...(book.genres || book.genre || [])]
      .join(" ").toLowerCase();
    const score = tokens.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
    return { book, score };
  }).sort((a, b) => b.score - a.score).filter((item) => item.score > 0).slice(0, 3).map((item) => item.book);
}

export default function AiBookFinder({ books, open, onClose }) {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState(-1);
  const [answer, setAnswer] = useState("");
  const [resultIds, setResultIds] = useState([]);

  useEffect(() => {
    if (phase < 0 || phase >= THINKING.length - 1) return undefined;
    const timer = setTimeout(() => setPhase((value) => value + 1), 650);
    return () => clearTimeout(timer);
  }, [phase]);

  const resultBooks = useMemo(() => resultIds.map((id) => books.find((book) => book.id === id)).filter(Boolean), [books, resultIds]);
  const thinking = phase >= 0;

  async function ask(event) {
    event.preventDefault();
    if (!question.trim() || thinking) return;
    setAnswer("");
    setResultIds([]);
    setPhase(0);
    try {
      const response = await askBookFinder(question, books);
      setResultIds(response.bookIds || []);
      setAnswer(response.answer || t.aiFinderFound((response.bookIds || []).length));
    } catch {
      // A local ranking keeps discovery helpful when the server is temporarily
      // unavailable. It is intentionally only a fallback; configured installs
      // receive the semantic answer from the model above.
      const fallback = localMatches(question, books);
      setResultIds(fallback.map((book) => book.id));
      setAnswer(fallback.length ? t.aiFinderFound(fallback.length) : t.aiFinderNoMatch);
    } finally {
      setPhase(-1);
    }
  }

  if (!open) return null;
  return (
    <section className="ai-finder mx-4 mt-2 mb-3" aria-live="polite">
      <div className="flex gap-3 items-start">
        <span className="ai-orb ai-orb-small shrink-0" aria-hidden="true"><span /></span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-brand-600">OquNet AI</p>
          <h2 className="text-[17px] font-bold text-ink-900">{t.aiFinderTitle}</h2>
          <p className="text-[13px] mt-0.5 leading-5 text-ink-500">{t.aiFinderHint}</p>
        </div>
        <button type="button" onClick={onClose} className="icon-btn -mr-1" aria-label={t.close}>×</button>
      </div>

      <form onSubmit={ask} className="relative mt-3">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} className="ai-question-input" placeholder={t.aiFinderPlaceholder} />
        <button type="submit" disabled={!question.trim() || thinking} className="ai-send" aria-label={t.aiAsk}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m5 12 14-7-4.2 14-3.1-5-6.7-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        </button>
      </form>

      {thinking ? (
        <div className="ai-finder-thinking mt-3">
          {THINKING.map((label, index) => (
            <span key={label} className={index === phase ? "active" : index < phase ? "complete" : ""}>
              <i>{index < phase ? "✓" : ""}</i>{label}
            </span>
          ))}
        </div>
      ) : null}

      {answer ? <p className="mt-3 text-[13px] font-medium text-ink-700">{answer}</p> : null}
      {resultBooks.length ? (
        <div className="ai-finder-results mt-2">
          {resultBooks.map((book) => (
            <Link key={book.id} to={`/books/${book.id}`} className="ai-book-match">
              <span className="ai-book-spark">✦</span>
              <span className="min-w-0 flex-1"><strong>{book.name}</strong><small>{book.author}</small></span>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
