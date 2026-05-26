import React from "react";
import { Logo, GitHubIcon, REPO_URL } from "./Nav.jsx";
import { navigate } from "../util.jsx";
import { MODULES } from "../data.js";

function sectionLink(modId) {
  return (e) => {
    e.preventDefault();
    if (window.location.hash) navigate("home");
    setTimeout(() => {
      const el = document.getElementById("mod-" + modId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo />
            <strong style={{ color: "var(--ink-1)" }}>GenAI Visualizer</strong>
          </div>
          <span>Demos run locally. No API keys.</span>
        </div>

        <nav className="site-footer__links" aria-label="Footer">
          {MODULES.map((module) => (
            <a key={module.id} href="#" onClick={sectionLink(module.id)}>
              {module.title}
            </a>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__source"
          >
            <GitHubIcon />
            <span>Source</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}

export { Footer };
