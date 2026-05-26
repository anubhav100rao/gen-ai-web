import React, { useState, useEffect } from "react";
import { useHashRoute, navigate } from "../util.jsx";
import { MODULES } from "../data.js";

export const REPO_URL = "https://github.com/anubhav100rao/gen-ai-web";

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
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            className="nav-icon-link"
          >
            <GitHubIcon />
          </a>
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

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.79.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
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

export { Nav, Logo, ThemeToggle, GitHubIcon };
