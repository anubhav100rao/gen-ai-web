import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ============================================================
// Shared utilities (hooks, math, formatting)
// ============================================================



// Hash-based routing: # = home, #/tokenizer = concept page
function useHashRoute() {
  const parse = () => {
    const h = window.location.hash.replace(/^#\/?/, "");
    if (!h) return { name: "home" };
    return { name: "concept", id: h };
  };
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function navigate(to) {
  if (to === "home") window.location.hash = "";
  else window.location.hash = "/" + to;
  window.scrollTo({ top: 0, behavior: "auto" });
}

// Deterministic hash → float in [0,1)
function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Seedable RNG (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cosine similarity
function cos(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

// Euclidean distance
function dist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

// Clamp
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Lerp
const lerp = (a, b, t) => a + (b - a) * t;

// Format number
const fmt = (n, d = 2) => Number(n).toFixed(d);

// Tokenize colors palette (rotated through tokens for visual variety)
const TOKEN_COLORS = [
  { bg: "rgba(var(--green-rgb), 0.18)",  fg: "var(--green)" },
  { bg: "rgba(var(--pink-rgb), 0.18)", fg: "var(--pink)" },
  { bg: "rgba(var(--yellow-rgb), 0.18)",  fg: "var(--yellow)" },
  { bg: "rgba(var(--blue-rgb), 0.18)", fg: "var(--blue)" },
  { bg: "rgba(var(--violet-rgb), 0.18)", fg: "var(--violet)" },
  { bg: "rgba(var(--orange-rgb), 0.18)",  fg: "var(--orange)" },
];

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Tiny syntax highlighter for python-ish code (regex-based, good enough)
function highlight(code) {
  const token =
    /#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:def|class|return|import|from|as|if|else|elif|for|in|while|with|yield|lambda|None|True|False|and|or|not|is|pass|break|continue|raise|try|except|finally|async|await)\b|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_][a-zA-Z0-9_]*(?=\()/g;

  let out = "";
  let last = 0;

  for (const match of code.matchAll(token)) {
    const value = match[0];
    out += escapeHtml(code.slice(last, match.index));

    let cls = "fn";
    if (value.startsWith("#")) cls = "com";
    else if (value.startsWith("\"") || value.startsWith("'")) cls = "str";
    else if (/^\d/.test(value)) cls = "num";
    else if (!/^[a-zA-Z_]/.test(value)) cls = "";
    else if (!code[match.index + value.length]?.startsWith("(")) cls = "kw";

    out += cls
      ? `<span class="${cls}">${escapeHtml(value)}</span>`
      : escapeHtml(value);
    last = match.index + value.length;
  }

  out += escapeHtml(code.slice(last));
  return out;
}

function Code({ children, lang = "python" }) {
  const text = Array.isArray(children) ? children.join("") : String(children);
  return (
    <pre className="code-block" dangerouslySetInnerHTML={{ __html: highlight(text) }} />
  );
}

// SVG arrow head defs (reusable)
function ArrowDefs() {
  return (
    <defs>
      <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--green)" />
      </marker>
      <marker id="arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#3a3a3a" />
      </marker>
    </defs>
  );
}

export {
  useState, useEffect, useRef, useMemo, useCallback,
  useHashRoute, navigate,
  hash01, rng, cos, dist, clamp, lerp, fmt,
  TOKEN_COLORS, highlight, Code, ArrowDefs,
};
