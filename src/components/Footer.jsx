import React from "react";
import { Logo } from "./Nav.jsx";

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
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 32,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Logo />
            <strong style={{ color: "var(--ink-1)" }}>GenAI Visualizer</strong>
          </div>
          <p>Interactive demos for understanding generative AI. Built for learners, not production.</p>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 12 }}>Sections</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.9 }}>
            <li><a href="#mod-foundations" style={{ color: "var(--ink-2)" }}>Foundations</a></li>
            <li><a href="#mod-generation" style={{ color: "var(--ink-2)" }}>Generation</a></li>
            <li><a href="#mod-retrieval" style={{ color: "var(--ink-2)" }}>Retrieval</a></li>
            <li><a href="#mod-agents" style={{ color: "var(--ink-2)" }}>Agents</a></li>
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
          <div className="label" style={{ marginBottom: 12 }}>Course</div>
          <p style={{ marginBottom: 8 }}>A companion to the GenAI Live + GenAI Course lectures.</p>
          <p className="dim">© {new Date().getFullYear()} — for learning only.</p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
