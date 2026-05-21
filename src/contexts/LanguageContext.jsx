import { createContext, useContext, useState } from "react";

const LanguageContext = createContext({ lang: "kz", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem("lang") || "kz"
  );

  function setLang(newLang) {
    localStorage.setItem("lang", newLang);
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
