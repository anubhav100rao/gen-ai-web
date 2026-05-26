import React from "react";
import { Logo, GitHubIcon, REPO_URL } from "./Nav.jsx";
import { navigate } from "../util.jsx";

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
    <footer style={{
      borderTop: "1px solid var(--border)",
      marginTop: 96,
      padding: "48px 0 64px",
      color: "var(--ink-3)",
      fontSize: 12,
    }}>
      <div className="container" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 32,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Logo />
            <strong style={{ color: "var(--ink-1)" }}>GenAI Visualizer</strong>
          </div>
          <p>Interactive demos for understanding generative AI. Built for learners, not production.</p>
          <p className="dim" style={{ marginTop: 12 }}>© {new Date().getFullYear()} — for learning only.</p>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 12 }}>Sections</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.9 }}>
            <li><a href="#" onClick={sectionLink("foundations")} style={{ color: "var(--ink-2)" }}>Foundations</a></li>
            <li><a href="#" onClick={sectionLink("generation")} style={{ color: "var(--ink-2)" }}>Generation</a></li>
            <li><a href="#" onClick={sectionLink("retrieval")} style={{ color: "var(--ink-2)" }}>Retrieval</a></li>
            <li><a href="#" onClick={sectionLink("agents")} style={{ color: "var(--ink-2)" }}>Agents</a></li>
          </ul>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 12 }}>Notes</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.9 }}>
            <li>All demos run client-side</li>
            <li>No API keys, no network</li>
            <li>Numbers are illustrative</li>
          </ul>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 12 }}>Source</div>
          <p style={{ marginBottom: 12, color: "var(--ink-2)" }}>
            Open source. Found a bug or want to add a demo? PRs welcome.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: "var(--ink-1)",
              padding: "6px 10px",
              border: "1px solid var(--border-hi)",
              borderRadius: 999,
              fontSize: 12,
              transition: "border-color 0.15s var(--ease), color 0.15s var(--ease)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--green)";
              e.currentTarget.style.color = "var(--green)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hi)";
              e.currentTarget.style.color = "var(--ink-1)";
            }}
          >
            <GitHubIcon />
            <span>github</span>
            <span style={{ color: "var(--ink-4)" }}>↗</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
