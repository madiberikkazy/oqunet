import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANG, getCurrentLang, isSupportedLang } from "../utils/i18n.js";

const LanguageContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => getCurrentLang());

  // Keep the <html lang="…"> attribute in sync — improves accessibility &
  // browser hints (spell-check, hyphenation, etc.) and matches the picked lang.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  function setLang(newLang) {
    if (!isSupportedLang(newLang)) return;
    try {
      localStorage.setItem("lang", newLang);
    } catch {
      /* localStorage may be blocked in private mode */
    }
    setLangState(newLang);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
