// Core TTS + progress hook for the OquNet audio reader.
// Owns the SpeechSynthesis lifecycle, current page/sentence pointer, and
// auto-persists progress to Firestore (with LS fallback).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { splitIntoSentences } from "../utils/pdfCleaner.js";
import { loadProgress, saveProgress } from "../utils/audioProgress.js";

const LOCALES = {
  kk: ["kk-KZ", "kk"],
  ru: ["ru-RU", "ru"],
  en: ["en-US", "en-GB", "en"],
};

function pickVoice(voices, lang) {
  const codes = LOCALES[lang] || LOCALES.en;
  for (const code of codes) {
    const exact = voices.find((v) => v.lang?.toLowerCase() === code.toLowerCase());
    if (exact) return exact;
  }
  for (const code of codes) {
    const partial = voices.find((v) => v.lang?.toLowerCase().startsWith(code.toLowerCase().slice(0, 2)));
    if (partial) return partial;
  }
  return voices[0] || null;
}

// Cheap script-based language autodetect — good enough to choose Kazakh vs
// Russian vs English on a per-page basis.
export function detectPageLang(text) {
  if (!text) return "en";
  const sample = text.slice(0, 600);
  const kkSpecific = /[әғқңөұүһі]/i;
  const cyrillic = /[а-яА-ЯёЁ]/;
  if (kkSpecific.test(sample)) return "kk";
  if (cyrillic.test(sample)) return "ru";
  return "en";
}

export default function usePdfAudioPlayer({ bookId, cleanedPages, initialLang = "auto" }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [voices, setVoices] = useState([]);
  const [lang, setLang] = useState(initialLang);
  const [rate, setRate] = useState(1);
  const [page, setPage] = useState(0);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const utterRef = useRef(null);
  const stoppedManuallyRef = useRef(false);

  // Load voices (some browsers populate them async).
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.addEventListener?.("voiceschanged", update);
    return () => synth.removeEventListener?.("voiceschanged", update);
  }, []);

  // Restore saved progress whenever the bookId changes.
  useEffect(() => {
    let cancelled = false;
    if (!userId || !bookId || !cleanedPages?.length) {
      setIsReady(!!cleanedPages?.length);
      return;
    }
    (async () => {
      const saved = await loadProgress(userId, bookId);
      if (cancelled) return;
      const safePage = Math.min(saved.page || 0, cleanedPages.length - 1);
      setPage(safePage);
      setSentenceIdx(saved.sentence || 0);
      setIsReady(true);
    })();
    return () => { cancelled = true; };
  }, [userId, bookId, cleanedPages]);

  const sentences = useMemo(
    () => splitIntoSentences(cleanedPages?.[page] || ""),
    [cleanedPages, page]
  );

  const effectiveLang = useMemo(() => {
    if (lang !== "auto") return lang;
    return detectPageLang(cleanedPages?.[page] || "");
  }, [lang, cleanedPages, page]);

  const persist = useCallback(
    (p, s) => {
      if (!userId || !bookId) return;
      saveProgress(userId, bookId, { page: p, sentence: s });
    },
    [userId, bookId]
  );

  const stop = useCallback(() => {
    stoppedManuallyRef.current = true;
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }, []);

  const speakFrom = useCallback(
    (startPage, startSentence) => {
      const synth = window.speechSynthesis;
      if (!synth || !cleanedPages?.length) return;

      stoppedManuallyRef.current = false;
      synth.cancel();

      let curPage = startPage;
      let curIdx = startSentence;

      const speakNext = () => {
        if (stoppedManuallyRef.current) return;

        if (curPage >= cleanedPages.length) {
          setIsPlaying(false);
          return;
        }

        const pageSentences = splitIntoSentences(cleanedPages[curPage]);
        if (curIdx >= pageSentences.length) {
          curPage += 1;
          curIdx = 0;
          setPage(curPage);
          setSentenceIdx(0);
          persist(curPage, 0);
          speakNext();
          return;
        }

        const text = pageSentences[curIdx];
        const utt = new SpeechSynthesisUtterance(text);
        const pageLang =
          lang === "auto" ? detectPageLang(cleanedPages[curPage]) : lang;
        const voice = pickVoice(synth.getVoices(), pageLang);
        if (voice) utt.voice = voice;
        utt.lang = voice?.lang || (LOCALES[pageLang] || LOCALES.en)[0];
        utt.rate = rate;

        utt.onend = () => {
          if (stoppedManuallyRef.current) return;
          curIdx += 1;
          setSentenceIdx(curIdx);
          persist(curPage, curIdx);
          speakNext();
        };
        utt.onerror = () => {
          // skip the broken utterance instead of stalling the queue
          curIdx += 1;
          setSentenceIdx(curIdx);
          speakNext();
        };

        utterRef.current = utt;
        synth.speak(utt);
      };

      setPage(curPage);
      setSentenceIdx(curIdx);
      setIsPlaying(true);
      speakNext();
    },
    [cleanedPages, lang, rate, persist]
  );

  const play = useCallback(() => {
    if (!cleanedPages?.length) return;
    speakFrom(page, sentenceIdx);
  }, [cleanedPages, page, sentenceIdx, speakFrom]);

  const pause = useCallback(() => {
    stop();
    persist(page, sentenceIdx);
  }, [stop, persist, page, sentenceIdx]);

  const nextSentence = useCallback(() => {
    stop();
    const total = sentences.length;
    if (sentenceIdx + 1 < total) {
      const ni = sentenceIdx + 1;
      setSentenceIdx(ni);
      persist(page, ni);
    } else if (page + 1 < cleanedPages.length) {
      setPage(page + 1);
      setSentenceIdx(0);
      persist(page + 1, 0);
    }
  }, [stop, sentences.length, sentenceIdx, page, cleanedPages, persist]);

  const prevSentence = useCallback(() => {
    stop();
    if (sentenceIdx > 0) {
      const ni = sentenceIdx - 1;
      setSentenceIdx(ni);
      persist(page, ni);
    } else if (page > 0) {
      const prevPageSentences = splitIntoSentences(cleanedPages[page - 1]);
      const ni = Math.max(0, prevPageSentences.length - 1);
      setPage(page - 1);
      setSentenceIdx(ni);
      persist(page - 1, ni);
    }
  }, [stop, sentenceIdx, page, cleanedPages, persist]);

  const jumpToPage = useCallback(
    (target) => {
      stop();
      const safe = Math.max(0, Math.min(target, (cleanedPages?.length || 1) - 1));
      setPage(safe);
      setSentenceIdx(0);
      persist(safe, 0);
    },
    [stop, cleanedPages, persist]
  );

  // Persist + stop when the tab closes / hides.
  useEffect(() => {
    const onHide = () => {
      persist(page, sentenceIdx);
      window.speechSynthesis?.cancel();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [persist, page, sentenceIdx]);

  // Cleanup on unmount — don't leave a running utterance behind.
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return {
    voices,
    lang,
    effectiveLang,
    setLang,
    rate,
    setRate,
    page,
    pageCount: cleanedPages?.length || 0,
    sentenceIdx,
    sentences,
    currentSentence: sentences[sentenceIdx] || "",
    isPlaying,
    isReady,
    play,
    pause,
    stop,
    nextSentence,
    prevSentence,
    jumpToPage,
  };
}
