import { useTheme } from "../../context/ThemeContext";
export default function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${mode === "light" ? "dark" : "light"} theme`} title="Change colour theme">{mode === "light" ? "☾" : "☀"}</button>;
}
