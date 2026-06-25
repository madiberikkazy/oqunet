import usePdfAudioPlayer from "../hooks/usePdfAudioPlayer.js";

const LANG_LABELS = {
  auto: "Auto",
  kk: "Қазақша",
  ru: "Русский",
  en: "English",
};

export default function AudioPlayer({ bookId, title, cleanedPages, onClose }) {
  const player = usePdfAudioPlayer({ bookId, cleanedPages });

  const progressPct = player.pageCount
    ? Math.round(((player.page + 1) / player.pageCount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl p-5 flex flex-col gap-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">{title}</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {player.isReady
                ? `Page ${player.page + 1} / ${player.pageCount} · ${progressPct}%`
                : "Loading…"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="rounded-xl bg-ink-100/40 p-3 max-h-40 overflow-auto text-sm leading-relaxed">
          {player.currentSentence || (
            <span className="text-ink-500">Press play to start reading.</span>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={player.prevSentence}
            className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center"
            aria-label="Previous"
          >
            ⏮
          </button>
          {player.isPlaying ? (
            <button
              onClick={player.pause}
              className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center text-xl"
              aria-label="Pause"
            >
              ⏸
            </button>
          ) : (
            <button
              onClick={player.play}
              disabled={!player.isReady}
              className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center text-xl disabled:opacity-50"
              aria-label="Play"
            >
              ▶
            </button>
          )}
          <button
            onClick={player.nextSentence}
            className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center"
            aria-label="Next"
          >
            ⏭
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-ink-500">Language</span>
            <select
              value={player.lang}
              onChange={(e) => player.setLang(e.target.value)}
              className="bg-ink-100/50 rounded-md px-2 py-1.5"
            >
              {Object.entries(LANG_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            {player.lang === "auto" && (
              <span className="text-[10px] text-ink-500">
                Detected: {LANG_LABELS[player.effectiveLang] || player.effectiveLang}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-ink-500">Speed · {player.rate.toFixed(1)}x</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={player.rate}
              onChange={(e) => player.setRate(parseFloat(e.target.value))}
            />
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => player.jumpToPage(player.page - 1)}
            disabled={player.page === 0}
            className="px-2 py-1 rounded bg-ink-100 disabled:opacity-50"
          >
            ◀ Page
          </button>
          <input
            type="range"
            min="0"
            max={Math.max(0, player.pageCount - 1)}
            value={player.page}
            onChange={(e) => player.jumpToPage(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <button
            onClick={() => player.jumpToPage(player.page + 1)}
            disabled={player.page >= player.pageCount - 1}
            className="px-2 py-1 rounded bg-ink-100 disabled:opacity-50"
          >
            Page ▶
          </button>
        </div>
      </div>
    </div>
  );
}
