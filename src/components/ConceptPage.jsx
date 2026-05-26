import React from "react";
import { navigate, Code } from "../util.jsx";
import { CONCEPTS, findConcept, nextConcept, prevConcept } from "../data.js";

// Wrapper for individual concept pages. Provides consistent header,
// next/prev navigation, breadcrumbs.

function ConceptPage({ id, children }) {
  const c = findConcept(id);
  if (!c) return <NotFound id={id} />;
  const nx = nextConcept(id);
  const pv = prevConcept(id);

  return (
    <main>
      <ConceptHeader concept={c} />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 32 }}>
        {children}
      </div>
      <ConceptNav prev={pv} next={nx} />
    </main>
  );
}

function ConceptHeader({ concept }) {
  const c = concept;
  const idx = CONCEPTS.findIndex(x => x.id === c.id);
  const total = CONCEPTS.length;

  return (
    <section className="grid-bg" style={{
      borderBottom: "1px solid var(--border)",
      paddingTop: 48, paddingBottom: 48,
    }}>
      <div className="container">
        {/* breadcrumb */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--ink-4)", marginBottom: 32,
        }}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("home"); }}
            style={{ color: "var(--ink-3)" }}>genai visualizer</a>
          <span>/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("home"); setTimeout(() => {
            const el = document.getElementById("mod-" + c.module.id);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 50); }} style={{ color: "var(--ink-3)" }}>{c.module.title.toLowerCase()}</a>
          <span>/</span>
          <span style={{ color: "var(--green)" }}>{c.title.toLowerCase()}</span>
          <span style={{ flex: 1 }} />
          <span className="num">{String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 64, alignItems: "end" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              module {c.module.num} · {c.module.title.toLowerCase()}
            </div>
            <h1 className="h-1">{c.title}</h1>
            <p className="lead" style={{ marginTop: 16 }}>{c.oneline}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <span className="chip chip--green">{c.tag}</span>
              <span className="dim" style={{ fontSize: 11 }}>~5 min · interactive</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConceptNav({ prev, next }) {
  return (
    <section style={{ borderTop: "1px solid var(--border)", marginTop: 48, padding: "32px 0" }}>
      <div className="container" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
      }}>
        {prev ? (
          <a href={"#/" + prev.id}
            onClick={(e) => { e.preventDefault(); navigate(prev.id); }}
            className="card"
            style={{ textAlign: "left", textDecoration: "none", cursor: "pointer" }}>
            <div className="label">← previous</div>
            <div className="h-3" style={{ marginTop: 4 }}>{prev.title}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{prev.oneline}</div>
          </a>
        ) : <div />}
        {next ? (
          <a href={"#/" + next.id}
            onClick={(e) => { e.preventDefault(); navigate(next.id); }}
            className="card"
            style={{ textAlign: "right", textDecoration: "none", cursor: "pointer" }}>
            <div className="label">next →</div>
            <div className="h-3" style={{ marginTop: 4 }}>{next.title}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{next.oneline}</div>
          </a>
        ) : <div />}
      </div>
    </section>
  );
}

// ============================================================
// Building blocks for individual demo pages
// ============================================================

// A labeled section inside a concept page (e.g. "The demo", "How it works", "Code")
function Section({ eyebrow, title, children, right }) {
  return (
    <section style={{ marginTop: 48 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
          {title && <h2 className="h-2">{title}</h2>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

// A "stage" — the box containing an interactive demo
function Stage({ children, padding = 32, height }) {
  return (
    <div className="card grid-bg" style={{
      padding,
      minHeight: height,
      background: "var(--bg-1)",
      position: "relative",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

// Two-column "explain" layout: text on left, optional aside on right
function Explain({ children, aside }) {
  if (!aside) return <div style={{ maxWidth: "70ch", color: "var(--ink-2)", fontSize: 14.5, lineHeight: 1.7 }}>{children}</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 48, alignItems: "start" }}>
      <div style={{ color: "var(--ink-2)", fontSize: 14.5, lineHeight: 1.7 }}>{children}</div>
      <div>{aside}</div>
    </div>
  );
}

// A "try this" experiments block
function Experiments({ items }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it, i) => (
        <li key={i} style={{
          display: "flex", gap: 16,
          padding: 16, border: "1px solid var(--border)", borderRadius: 4,
          background: "var(--bg-1)",
        }}>
          <span style={{
            width: 28, height: 28, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid var(--border-bright)", borderRadius: 999,
            color: "var(--yellow)", fontSize: 12,
          }}>{String(i + 1).padStart(2, "0")}</span>
          <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{it}</div>
        </li>
      ))}
    </ul>
  );
}

function NotFound({ id }) {
  return (
    <div className="container" style={{ padding: "96px 0" }}>
      <div className="eyebrow">404</div>
      <h1 className="h-1" style={{ marginTop: 16 }}>No demo named "{id}"</h1>
      <p className="lead" style={{ marginTop: 16 }}>This page exists in someone's imagination but not in this app yet.</p>
      <button className="btn btn--primary" style={{ marginTop: 24 }} onClick={() => navigate("home")}>← back home</button>
    </div>
  );
}

export { ConceptPage, Section, Stage, Explain, Experiments };
