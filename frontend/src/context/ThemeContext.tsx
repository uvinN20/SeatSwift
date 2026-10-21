import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext({ mode: "light" as Theme, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Theme>(() => {
    const saved = localStorage.getItem("sb:theme:photo-light");
    return saved === "dark" ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = mode;

  }, [mode]);
  const toggle = () => { const next = mode === "dark" ? "light" : "dark"; localStorage.setItem("sb:theme:photo-light", next); setMode(next); };
  return <ThemeContext.Provider value={{ mode, toggle }}>{children}</ThemeContext.Provider>;
}
