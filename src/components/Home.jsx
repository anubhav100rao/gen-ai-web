import React, { useState, useEffect, useMemo } from "react";
import { navigate } from "../util.jsx";
import { MODULES } from "../data.js";

function Home() {
  return (
    <main>
      <Hero />
      <ModulesGrid />
      <Philosophy />
    </main>
  );
}

// ============================================================
// Hero
// ============================================================
function Hero() {
  // typing prompt animation
  const phrases = useMemo(() => [
    "tokenize this →",
    "embed: 'paris is the capital of'",
    "retrieve top-k from corpus",
    "stream next token, t=0.7",
    "agent.plan(\"book me a flight\")",
  ], []);
  const [pi, setPi] = useState(0);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let timer;
    if (typing) {
      const target = phrases[pi];
      if (text.length < target.length) {
        timer = setTimeout(() => setText(target.slice(0, text.length + 1)), 45);
      } else {
        timer = setTimeout(() => setTyping(false), 1800);
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, -1)), 22);
      } else {
        setPi((pi + 1) % phrases.length);
        setTyping(true);
      }
    }
    return () => clearTimeout(timer);
  }, [text, typing, pi, phrases]);

  return (
    <section className="grid-bg" style={{
      borderBottom: "1px solid var(--border)",
      padding: "96px 0 80px",
    }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 24 }}>
              v0.1 — a visual companion to gen-ai live + course
            </div>
            <h1 className="h-display">
              GenAI,<br/>
              <span style={{ color: "var(--green)" }}>visualized.</span>
            </h1>
            <p className="lead" style={{ marginTop: 24 }}>
              Twelve interactive demos that take the buzzwords —
              {" "}<TokenWord c="green">tokens</TokenWord>,
              {" "}<TokenWord c="pink">embeddings</TokenWord>,
              {" "}<TokenWord c="yellow">attention</TokenWord>,
              {" "}<TokenWord c="green">RAG</TokenWord>,
              {" "}<TokenWord c="pink">agents</TokenWord> —
              {" "}and turn them into something you can poke at, break, and intuit.
            </p>

            <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn btn--primary" onClick={() => navigate("tokenizer")}>
                start with tokens →
              </button>
              <button
                className="btn"
                onClick={() => document.getElementById("modules").scrollIntoView({ behavior: "smooth" })}
              >
                browse all 12
              </button>
            </div>

            <div style={{ marginTop: 48, display: "flex", gap: 32, color: "var(--ink-3)", fontSize: 12 }}>
              <Stat n="12" label="interactive demos" />
              <Stat n="4"  label="modules" />
              <Stat n="0"  label="API keys needed" />
              <Stat n="~2h" label="to skim, longer to play" />
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--bg-1)" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderBottom: "1px solid var(--border)",
              background: "var(--bg-2)",
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#ff5f56" }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#ffbd2e" }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#27c93f" }} />
              <span style={{ marginLeft: 12, fontSize: 11, color: "var(--ink-4)" }}>llm.repl</span>
            </div>
            <div style={{ padding: "22px 22px 26px", fontSize: 14, minHeight: 260 }}>
              <div style={{ color: "var(--ink-4)" }}><span style={{ color: "var(--green)" }}>$</span> claude --interactive</div>
              <div style={{ color: "var(--ink-3)", margin: "6px 0 14px" }}>connected · context 200k · temp 0.7</div>
              <div style={{ color: "var(--green)", marginBottom: 6 }}>{">"} {text}<span className="cursor" /></div>
              <div className="dim" style={{ fontSize: 12, marginTop: 18 }}>
                <div>// what's happening, decoded:</div>
                <div>// 1. text → tokens (subword units)</div>
                <div>// 2. tokens → vectors in ℝ⁴⁰⁹⁶</div>
                <div>// 3. attention layers mix them</div>
                <div>// 4. softmax over vocab → sample</div>
                <div>// 5. repeat for next token</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="num" style={{ color: "var(--ink-1)", fontSize: 20, fontWeight: 600 }}>{n}</div>
      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function TokenWord({ c, children }) {
  const colors = {
    green:  { bg: "rgba(var(--green-rgb), 0.14)",  fg: "var(--green)" },
    pink:   { bg: "rgba(var(--pink-rgb), 0.14)", fg: "var(--pink)" },
    yellow: { bg: "rgba(var(--yellow-rgb), 0.14)",  fg: "var(--yellow)" },
  };
  const s = colors[c];
  return (
    <span style={{
      background: s.bg, color: s.fg,
      padding: "1px 5px", borderRadius: 3,
      fontFamily: "var(--font-mono)",
    }}>{children}</span>
  );
}

// ============================================================
// Modules grid
// ============================================================
function ModulesGrid() {
  return (
    <section id="modules" style={{ padding: "80px 0 32px" }}>
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 16 }}>the syllabus</div>
        <h2 className="h-1" style={{ marginBottom: 8 }}>Four modules. Twelve demos.</h2>
        <p className="lead" style={{ marginBottom: 56 }}>
          Each demo is a single page: a thing you can mess with, a plain-language
          explanation of what's actually happening, and the Python you'd write to do it for real.
        </p>

        {MODULES.map((m, mi) => (
          <ModuleBlock key={m.id} m={m} idx={mi} />
        ))}
      </div>
    </section>
  );
}

function ModuleBlock({ m, idx }) {
  return (
    <div id={"mod-" + m.id} style={{ paddingTop: 48, marginTop: idx === 0 ? 0 : 32 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 48,
        alignItems: "start",
      }}>
        <div style={{ position: "sticky", top: 88 }}>
          <div className="num" style={{
            fontSize: 64, lineHeight: 1, color: "var(--ink-5)",
            fontWeight: 600, letterSpacing: "-0.04em",
          }}>{m.num}</div>
          <h3 className="h-2" style={{ marginTop: 8, color: "var(--ink-1)" }}>{m.title}</h3>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{m.blurb}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {m.concepts.map((c, ci) => (
            <ConceptCard key={c.id} c={c} idx={mi(m, ci)} accent={accentFor(m.id, ci)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function mi(m, ci) {
  const order = ["01","02","03","04"].indexOf(m.num);
  return String(order * 3 + ci + 1).padStart(2, "0");
}

function accentFor(modId, ci) {
  const map = {
    foundations: ["green","green","green"],
    generation:  ["yellow","yellow","yellow"],
    retrieval:   ["pink","pink","pink"],
    agents:      ["blue","blue","blue"],
  };
  return map[modId][ci];
}

function ConceptCard({ c, idx, accent }) {
  const colors = {
    green:  "var(--green)",
    yellow: "var(--yellow)",
    pink:   "var(--pink)",
    blue:   "var(--blue)",
  };
  const ac = colors[accent];

  return (
    <a
      href={"#/" + c.id}
      onClick={(e) => { e.preventDefault(); navigate(c.id); }}
      className="card concept-card"
      style={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s var(--ease)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = ac;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        height: 110,
        background: "var(--bg-1)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        overflow: "hidden",
      }}>
        <ConceptThumb id={c.id} accent={ac} />
      </div>
      <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{
          fontSize: 10,
          color: "var(--ink-4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
        }}>
          <span>demo · {idx}</span>
          <span style={{ color: ac }}>{c.tag}</span>
        </div>
        <h4 className="h-3" style={{ marginBottom: 8 }}>{c.title}</h4>
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, flex: 1 }}>{c.oneline}</p>
        <div style={{ marginTop: 16, fontSize: 11, color: ac, display: "flex", alignItems: "center", gap: 6 }}>
          open demo <span>→</span>
        </div>
      </div>
    </a>
  );
}

// Tiny SVG thumbnails — each gives a hint of what's inside
function ConceptThumb({ id, accent }) {
  const dim = "var(--border-hi)";
  const props = { fill: "none", stroke: accent, strokeWidth: 1.4, strokeLinecap: "round" };
  const dprops = { fill: "none", stroke: dim, strokeWidth: 1.2, strokeLinecap: "round" };

  switch (id) {
    case "tokenizer":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {["the","_quick","_brown","_fox"].map((t, i) => (
            <g key={i}>
              <rect x={20 + i * 50} y={42} width={42} height={26} rx={3}
                fill={i % 2 ? "rgba(var(--green-rgb), 0.12)" : "rgba(var(--pink-rgb), 0.12)"}
                stroke={i % 2 ? accent : "var(--pink)"} strokeWidth={1} />
              <text x={20 + i * 50 + 21} y={59} fontSize={10} textAnchor="middle" fontFamily="JetBrains Mono" fill="var(--ink-2)">{t}</text>
            </g>
          ))}
        </svg>
      );
    case "embeddings":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {[[60,40],[80,60],[70,75],[160,35],[180,55],[150,65],[190,80]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r={3} fill={i < 3 ? accent : "var(--pink)"} />
          ))}
          <text x={60} y={32} fontSize={8} fill="#8a8a8a" fontFamily="JetBrains Mono">king</text>
          <text x={160} y={28} fontSize={8} fill="#8a8a8a" fontFamily="JetBrains Mono">apple</text>
        </svg>
      );
    case "context-window":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          <rect x={20} y={30} width={200} height={50} rx={3} {...dprops} />
          <rect x={20} y={30} width={140} height={50} rx={3} fill="rgba(var(--green-rgb), 0.08)" stroke={accent} />
          {Array.from({length: 14}).map((_, i) => (
            <line key={i} x1={20 + i*14 + 7} y1={30} x2={20 + i*14 + 7} y2={80} stroke={i < 10 ? "var(--ink-5)" : "var(--border-hi)"} strokeWidth={0.5} />
          ))}
          <text x={120} y={98} fontSize={9} textAnchor="middle" fill="#8a8a8a" fontFamily="JetBrains Mono">context · 200k</text>
        </svg>
      );
    case "temperature":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {[60,30,80,20,40,70,15,25].map((h, i) => (
            <rect key={i} x={30 + i*22} y={88 - h} width={16} height={h} fill={i === 0 || i === 2 ? accent : "var(--pink)"} opacity={0.6 + (i === 0 ? 0.4 : 0)} />
          ))}
        </svg>
      );
    case "attention":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {Array.from({length: 6}).map((_, r) =>
            Array.from({length: 8}).map((_, c) => {
              const v = (Math.sin(r*1.3 + c*0.7) + 1) / 2;
              return <rect key={r+'-'+c} x={70 + c*16} y={20 + r*12} width={14} height={10}
                fill={accent} opacity={v * 0.9 + 0.05} />;
            })
          )}
        </svg>
      );
    case "prompt-engineering":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {[0,1,2].map(i => (
            <g key={i}>
              <rect x={20 + i*70} y={25} width={56} height={60} rx={3} fill="rgba(var(--yellow-rgb), 0.06)" stroke={accent} strokeWidth={1} />
              <line x1={28 + i*70} y1={36} x2={68 + i*70} y2={36} stroke="var(--ink-4)" strokeWidth={1} />
              <line x1={28 + i*70} y1={44} x2={62 + i*70} y2={44} stroke="var(--ink-4)" strokeWidth={1} />
              <line x1={28 + i*70} y1={52} x2={66 + i*70} y2={52} stroke="var(--ink-5)" strokeWidth={1} />
              <text x={48 + i*70} y={78} fontSize={8} textAnchor="middle" fill="var(--ink-3)" fontFamily="JetBrains Mono">{["0-shot","few-shot","CoT"][i]}</text>
            </g>
          ))}
        </svg>
      );
    case "vector-db":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {Array.from({length: 24}).map((_, i) => {
            const x = 30 + (i * 73) % 180;
            const y = 20 + ((i * 37) % 70);
            const close = i % 6 === 0;
            return <circle key={i} cx={x} cy={y} r={close ? 3.5 : 2}
              fill={close ? accent : "var(--ink-5)"} opacity={close ? 1 : 0.7} />;
          })}
          <circle cx={120} cy={55} r={10} fill="none" stroke={accent} strokeDasharray="2 2" />
          <circle cx={120} cy={55} r={4} fill={accent} />
        </svg>
      );
    case "search-compare":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          <text x={60} y={28} fontSize={10} textAnchor="middle" fill="var(--pink)" fontFamily="JetBrains Mono">BM25</text>
          <text x={180} y={28} fontSize={10} textAnchor="middle" fill={accent} fontFamily="JetBrains Mono">semantic</text>
          {[0,1,2,3].map(i => (
            <g key={i}>
              <rect x={20} y={36 + i*16} width={80} height={12} rx={2} fill="var(--bg-3)" stroke="var(--border-hi)" />
              <rect x={20} y={36 + i*16} width={70 - i*15} height={12} rx={2} fill="rgba(var(--pink-rgb), 0.4)" />
              <rect x={140} y={36 + i*16} width={80} height={12} rx={2} fill="var(--bg-3)" stroke="var(--border-hi)" />
              <rect x={140} y={36 + i*16} width={55 - i*8} height={12} rx={2} fill="rgba(var(--pink-rgb), 0.4)" />
            </g>
          ))}
        </svg>
      );
    case "rag":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {["query","retrieve","augment","generate"].map((label, i) => (
            <g key={i}>
              <rect x={10 + i*58} y={42} width={50} height={26} rx={3}
                fill={i === 1 ? "rgba(var(--pink-rgb), 0.12)" : "rgba(var(--green-rgb), 0.08)"}
                stroke={i === 1 ? "var(--pink)" : accent} strokeWidth={1} />
              <text x={35 + i*58} y={59} fontSize={8} textAnchor="middle" fill="var(--ink-2)" fontFamily="JetBrains Mono">{label}</text>
              {i < 3 && <path d={`M${60 + i*58},55 L${68 + i*58},55`} stroke="var(--ink-4)" strokeWidth={1} markerEnd="url(#arrow-thumb)" />}
            </g>
          ))}
          <defs><marker id="arrow-thumb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink-4)" /></marker></defs>
        </svg>
      );
    case "tools":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          <rect x={30} y={20} width={80} height={70} rx={3} fill="rgba(var(--blue-rgb), 0.06)" stroke={accent} />
          <text x={70} y={36} fontSize={9} textAnchor="middle" fill="var(--blue)" fontFamily="JetBrains Mono">LLM</text>
          <rect x={130} y={20} width={80} height={28} rx={3} fill="var(--bg-3)" stroke="var(--ink-5)" />
          <text x={170} y={37} fontSize={8} textAnchor="middle" fill="var(--ink-3)" fontFamily="JetBrains Mono">get_weather()</text>
          <rect x={130} y={62} width={80} height={28} rx={3} fill="var(--bg-3)" stroke="var(--ink-5)" />
          <text x={170} y={80} fontSize={8} textAnchor="middle" fill="var(--ink-3)" fontFamily="JetBrains Mono">send_email()</text>
          <path d="M110 34 L130 34" stroke={accent} strokeWidth={1} markerEnd="url(#a)" />
          <defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={accent} /></marker></defs>
        </svg>
      );
    case "mcp":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          <circle cx={60} cy={55} r={22} fill="rgba(var(--blue-rgb), 0.08)" stroke={accent} />
          <text x={60} y={59} fontSize={9} textAnchor="middle" fill="var(--blue)" fontFamily="JetBrains Mono">client</text>
          {[0,1,2].map(i => (
            <g key={i}>
              <circle cx={180} cy={28 + i*28} r={14} fill="var(--bg-3)" stroke="var(--ink-5)" />
              <text x={180} y={32 + i*28} fontSize={8} textAnchor="middle" fill="var(--ink-3)" fontFamily="JetBrains Mono">{["fs","gh","db"][i]}</text>
              <path d={`M82 55 Q 130 ${28+i*28} 165 ${28+i*28}`} stroke={accent} strokeWidth={1} fill="none" opacity={0.6} />
            </g>
          ))}
        </svg>
      );
    case "agents":
      return (
        <svg viewBox="0 0 240 110" style={{ width: "100%", height: "100%" }}>
          {["think","act","obs"].map((label, i) => (
            <g key={i}>
              <circle cx={50 + i*70} cy={55} r={22} fill="rgba(var(--blue-rgb), 0.06)" stroke={accent} />
              <text x={50 + i*70} y={59} fontSize={9} textAnchor="middle" fill="var(--blue)" fontFamily="JetBrains Mono">{label}</text>
              {i < 2 && <path d={`M${72 + i*70} 55 L${98 + i*70} 55`} stroke="var(--ink-4)" strokeWidth={1} />}
            </g>
          ))}
          <path d="M 190 55 Q 220 90 120 90 Q 30 90 30 55" stroke={accent} strokeWidth={1} fill="none" strokeDasharray="3 3" opacity={0.6} />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================
// Philosophy block
// ============================================================
function Philosophy() {
  const items = [
    { n: "01", t: "Run, don't read.", b: "Every concept ships with a thing you can poke. Words about gradient descent are no substitute for moving a slider and seeing the line curve." },
    { n: "02", t: "Small, honest numbers.", b: "We use 64-dim embeddings, 8-token contexts, 3-document corpora. Toy scale, real shape." },
    { n: "03", t: "No magic.", b: "Click an arrow in the RAG diagram, see the literal JSON that moves between stages. Demystification is the whole point." },
  ];
  return (
    <section style={{ padding: "96px 0 32px" }}>
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 24 }}>how to use this</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          {items.map(it => (
            <div key={it.n}>
              <div className="num" style={{ fontSize: 28, color: "var(--green)", marginBottom: 8 }}>{it.n}</div>
              <h4 className="h-3" style={{ marginBottom: 8 }}>{it.t}</h4>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{it.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { Home };
