import React, { useState, useEffect } from "react";
import { useHashRoute, navigate } from "../util.jsx";
import { MODULES } from "../data.js";

// ---- Theme hook ----
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("gv-theme", theme); } catch (e) {}
  }, [theme]);

  return [theme, setTheme];
}

function Nav() {
  const route = useHashRoute();
  const isHome = route.name === "home";
  const [theme, setTheme] = useTheme();

  const headerBg = theme === "dark"
    ? "rgba(11,13,18,0.78)"
    : "rgba(250,250,249,0.82)";

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: headerBg,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
      }}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("home"); }}
          style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
            GenAI Visualizer
          </span>
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {MODULES.map(m => (
            <button
              key={m.id}
              className="btn btn--ghost btn--sm"
              onClick={() => {
                if (!isHome) navigate("home");
                setTimeout(() => {
                  const el = document.getElementById("mod-" + m.id);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              style={{ border: "none", color: "var(--ink-3)" }}
            >
              <span style={{ color: "var(--ink-4)" }}>{m.num}</span>&nbsp;{m.title.toLowerCase()}
            </button>
          ))}
          <span style={{ width: 1, height: 18, background: "var(--border-hi)", margin: "0 8px" }} />
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </nav>
      </div>
    </header>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button
        aria-pressed={theme === "light"}
        aria-label="Light theme"
        onClick={() => setTheme("light")}
      >
        <SunIcon />
      </button>
      <button
        aria-pressed={theme === "dark"}
        aria-label="Dark theme"
        onClick={() => setTheme("dark")}
      >
        <MoonIcon />
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="22" height="22" rx="4" stroke="var(--green)" strokeWidth="1.5" />
      <path d="M6 9 L6 15 M6 12 L10 12 M10 9 L10 15" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 9 L14 15 M14 9 L18 9 L18 12 L14 12 L18 15" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { Nav, Logo, ThemeToggle };
