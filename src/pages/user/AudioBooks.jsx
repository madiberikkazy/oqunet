import { useCallback, useEffect, useState } from "react";
import MobileShell from "../../components/MobileShell.jsx";
import AudioPlayer from "../../components/AudioPlayer.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { extractPdfPages } from "../../utils/pdfReader.js";
import {
  cleanPageText, detectRepeatedLines, polishWithGemini,
} from "../../utils/pdfCleaner.js";
import {
  listAudioBooks, saveAudioBookMeta, savePages, loadPages,
  deleteAudioBook, deletePages,
} from "../../utils/audioProgress.js";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AudioBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [active, setActive] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setBooks(await listAudioBooks(user.id));
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;

    setError("");
    const bookId = `${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, "_")}`;
    setProgress({ stage: "extract", current: 0, total: 0 });

    try {
      const rawPages = await extractPdfPages(file, (cur, tot) =>
        setProgress({ stage: "extract", current: cur, total: tot })
      );

      setProgress({ stage: "clean", current: 0, total: rawPages.length });
      const repeated = detectRepeatedLines(rawPages);
      const cleaned = [];
      for (let i = 0; i < rawPages.length; i++) {
        let text = cleanPageText(rawPages[i], repeated);
        if (GEMINI_KEY && text.length > 200) {
          text = await polishWithGemini(text, GEMINI_KEY);
        }
        cleaned.push(text);
        setProgress({ stage: "clean", current: i + 1, total: rawPages.length });
      }

      savePages(user.id, bookId, cleaned);
      await saveAudioBookMeta(user.id, {
        id: bookId,
        title: file.name.replace(/\.pdf$/i, ""),
        pageCount: cleaned.length,
      });
      setProgress(null);
      await refresh();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to process PDF");
      setProgress(null);
    }
  };

  const openBook = (book) => {
    const pages = loadPages(user.id, book.id);
    if (!pages) {
      setError("This book's pages aren't cached locally anymore. Re-upload to continue.");
      return;
    }
    setActive({ ...book, cleanedPages: pages });
  };

  const removeBook = async (book) => {
    if (!confirm(`Remove "${book.title}"?`)) return;
    await deleteAudioBook(user.id, book.id);
    deletePages(user.id, book.id);
    refresh();
  };

  return (
    <MobileShell title="Audio books">
      <div className="p-4 flex flex-col gap-4">
        <label className="block">
          <span className="block text-sm font-medium mb-2">Upload PDF</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={!!progress}
            className="block w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-brand-500 file:text-white"
          />
        </label>

        {progress && (
          <div className="text-xs text-ink-500">
            {progress.stage === "extract" ? "Reading PDF" : "Cleaning text"}: {progress.current}/{progress.total}
          </div>
        )}
        {error && <div className="text-xs text-red-600">{error}</div>}

        <ul className="flex flex-col gap-2">
          {books.length === 0 && (
            <li className="text-sm text-ink-500">
              No audio books yet. Upload a PDF to get started.
            </li>
          )}
          {books.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-ink-100/40"
            >
              <button
                onClick={() => openBook(b)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-sm font-medium truncate">{b.title}</div>
                <div className="text-[11px] text-ink-500">
                  {b.pageCount} pages
                  {b.progress?.page != null && b.pageCount
                    ? ` · ${Math.round(((b.progress.page + 1) / b.pageCount) * 100)}% read`
                    : ""}
                </div>
              </button>
              <button
                onClick={() => removeBook(b)}
                className="text-xs text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {active && (
        <AudioPlayer
          bookId={active.id}
          title={active.title}
          cleanedPages={active.cleanedPages}
          onClose={() => { setActive(null); refresh(); }}
        />
      )}
    </MobileShell>
  );
}
