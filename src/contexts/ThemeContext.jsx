import { createContext, useContext, useEffect, useState } from "react";
import { safeGet, safeSet } from "../utils/safeStorage.js";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {}, setTheme: () => {} });

const VALID = new Set(["light", "dark"]);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const v = safeGet("theme", "light");
    return VALID.has(v) ? v : "light";
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    } catch { /* document may not exist during SSR */ }
    safeSet("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  function setThemeDirect(val) {
    if (!VALID.has(val)) return;
    setTheme(val);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeDirect }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
