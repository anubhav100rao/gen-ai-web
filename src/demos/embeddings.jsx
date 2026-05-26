import React, { useState, useMemo } from "react";
import { cos, dist, Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Embeddings — 2D vector-space playground
// ============================================================

// Hand-placed 2D coordinates simulating what a real embedding looks like
// after dimensionality reduction (UMAP/t-SNE). Words near each other are
// semantically related.
const EMB_WORDS = [
  // Animals cluster
  { w: "cat",      x: 90,  y: 110, cat: "animal" },
  { w: "dog",      x: 115, y: 130, cat: "animal" },
  { w: "horse",    x: 130, y: 95,  cat: "animal" },
  { w: "lion",     x: 75,  y: 85,  cat: "animal" },
  { w: "tiger",    x: 95,  y: 75,  cat: "animal" },
  { w: "bird",     x: 145, y: 150, cat: "animal" },
  { w: "fish",     x: 170, y: 175, cat: "animal" },
  { w: "cow",      x: 165, y: 115, cat: "animal" },

  // Food cluster
  { w: "apple",    x: 580, y: 90,  cat: "food" },
  { w: "banana",   x: 615, y: 110, cat: "food" },
  { w: "bread",    x: 590, y: 145, cat: "food" },
  { w: "cheese",   x: 640, y: 95,  cat: "food" },
  { w: "pizza",    x: 605, y: 175, cat: "food" },
  { w: "coffee",   x: 555, y: 135, cat: "food" },
  { w: "tea",      x: 650, y: 145, cat: "food" },
  { w: "rice",     x: 620, y: 65,  cat: "food" },

  // Colors cluster
  { w: "red",      x: 85,  y: 360, cat: "color" },
  { w: "blue",     x: 120, y: 380, cat: "color" },
  { w: "green",    x: 145, y: 355, cat: "color" },
  { w: "yellow",   x: 95,  y: 395, cat: "color" },
  { w: "orange",   x: 65,  y: 380, cat: "color" },
  { w: "purple",   x: 130, y: 415, cat: "color" },
  { w: "black",    x: 160, y: 395, cat: "color" },

  // Tech cluster
  { w: "computer", x: 565, y: 355, cat: "tech" },
  { w: "python",   x: 600, y: 385, cat: "tech" },
  { w: "code",     x: 540, y: 400, cat: "tech" },
  { w: "algorithm",x: 635, y: 370, cat: "tech" },
  { w: "model",    x: 620, y: 410, cat: "tech" },
  { w: "data",     x: 570, y: 420, cat: "tech" },
  { w: "neural",   x: 605, y: 340, cat: "tech" },

  // Royalty / gender — the king–man+woman≈queen analogy
  { w: "king",     x: 320, y: 215, cat: "person" },
  { w: "queen",    x: 335, y: 240, cat: "person" },
  { w: "man",      x: 295, y: 290, cat: "person" },
  { w: "woman",    x: 310, y: 315, cat: "person" },
  { w: "boy",      x: 340, y: 305, cat: "person" },
  { w: "girl",     x: 355, y: 330, cat: "person" },

  // Cities
  { w: "paris",    x: 410, y: 100, cat: "city" },
  { w: "london",   x: 440, y: 130, cat: "city" },
  { w: "tokyo",    x: 380, y: 150, cat: "city" },
  { w: "berlin",   x: 420, y: 165, cat: "city" },

  // Verbs / abstract
  { w: "learn",    x: 450, y: 280, cat: "verb" },
  { w: "think",    x: 470, y: 250, cat: "verb" },
  { w: "create",   x: 400, y: 270, cat: "verb" },
];

const CAT_COLORS = {
  animal: "var(--green)",
  food:   "var(--yellow)",
  color:  "var(--pink)",
  tech:   "var(--blue)",
  person: "var(--violet)",
  city:   "var(--orange)",
  verb:   "var(--ink-2)",
};

const VIEW_W = 720;
const VIEW_H = 480;

function EmbeddingsDemo() {
  const [selected, setSelected]   = useState("king");
  const [hidden, setHidden]       = useState(new Set());
  const [showArithmetic, setShowArithmetic] = useState(false);

  const sel = EMB_WORDS.find(w => w.w === selected);

  // k-nearest neighbors of selected word (excluding hidden categories)
  const neighbors = useMemo(() => {
    if (!sel) return [];
    return EMB_WORDS
      .filter(w => w.w !== selected && !hidden.has(w.cat))
      .map(w => ({ ...w, d: dist([w.x, w.y], [sel.x, sel.y]) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
  }, [selected, hidden, sel]);

  // king − man + woman ≈ queen
  const arithmetic = useMemo(() => {
    const k = EMB_WORDS.find(w => w.w === "king");
    const m = EMB_WORDS.find(w => w.w === "man");
    const wo = EMB_WORDS.find(w => w.w === "woman");
    const target = { x: k.x - m.x + wo.x, y: k.y - m.y + wo.y };
    // Find closest word to target
    const closest = EMB_WORDS
      .filter(w => !["king","man","woman"].includes(w.w))
      .map(w => ({ ...w, d: dist([w.x, w.y], [target.x, target.y]) }))
      .sort((a, b) => a.d - b.d)[0];
    return { k, m, wo, target, closest };
  }, []);

  function toggleCat(cat) {
    const n = new Set(hidden);
    if (n.has(cat)) n.delete(cat); else n.add(cat);
    setHidden(n);
  }

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Words become coordinates">
        <Stage padding={0}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", minHeight: 540 }}>
            {/* Plot */}
            <div style={{ padding: 16, position: "relative" }}>
              <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: "100%", height: "auto", display: "block" }}>
                {/* faint grid */}
                {Array.from({length: 8}).map((_, i) => (
                  <line key={"v"+i} x1={i*100} y1={0} x2={i*100} y2={VIEW_H} stroke="var(--bg-3)" strokeWidth={1} />
                ))}
                {Array.from({length: 6}).map((_, i) => (
                  <line key={"h"+i} x1={0} y1={i*100} x2={VIEW_W} y2={i*100} stroke="var(--bg-3)" strokeWidth={1} />
                ))}
                {/* axes labels */}
                <text x={10} y={VIEW_H - 8} fontSize={10} fill="#3a3a3a" fontFamily="JetBrains Mono">dim-1 →</text>
                <text x={10} y={14} fontSize={10} fill="#3a3a3a" fontFamily="JetBrains Mono">↑ dim-2</text>

                {/* Arithmetic mode: show vector arrows */}
                {showArithmetic && (
                  <g>
                    <line x1={arithmetic.m.x} y1={arithmetic.m.y} x2={arithmetic.wo.x} y2={arithmetic.wo.y}
                      stroke="var(--yellow)" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#emb-arrow-y)" />
                    <line x1={arithmetic.k.x} y1={arithmetic.k.y} x2={arithmetic.target.x} y2={arithmetic.target.y}
                      stroke="var(--green)" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#emb-arrow-g)" />
                    <circle cx={arithmetic.target.x} cy={arithmetic.target.y} r={14} fill="none"
                      stroke="var(--green)" strokeWidth={1.5} strokeDasharray="2 2" />
                    <text x={arithmetic.target.x + 18} y={arithmetic.target.y + 4} fontSize={11}
                      fill="var(--green)" fontFamily="JetBrains Mono">→ {arithmetic.closest.w}?</text>
                    <defs>
                      <marker id="emb-arrow-y" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--yellow)" />
                      </marker>
                      <marker id="emb-arrow-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--green)" />
                      </marker>
                    </defs>
                  </g>
                )}

                {/* neighbor lines */}
                {sel && !showArithmetic && neighbors.map((n, i) => (
                  <line key={"l"+i} x1={sel.x} y1={sel.y} x2={n.x} y2={n.y}
                    stroke="var(--green)" strokeWidth={1} strokeDasharray="3 3" opacity={1 - i * 0.15} />
                ))}

                {/* words */}
                {EMB_WORDS.map((w) => {
                  if (hidden.has(w.cat)) return null;
                  const isSel = w.w === selected;
                  const isNeighbor = neighbors.find(n => n.w === w.w);
                  const c = CAT_COLORS[w.cat];
                  const r = isSel ? 5 : (isNeighbor ? 4 : 3);
                  return (
                    <g key={w.w} style={{ cursor: "pointer" }} onClick={() => setSelected(w.w)}>
                      <circle cx={w.x} cy={w.y} r={r}
                        fill={isSel ? c : (isNeighbor ? c : c)}
                        opacity={isSel ? 1 : (isNeighbor ? 1 : 0.55)}
                      />
                      {isSel && <circle cx={w.x} cy={w.y} r={11} fill="none" stroke={c} strokeWidth={1.5} />}
                      <text x={w.x + 8} y={w.y + 4}
                        fontSize={isSel ? 13 : 11}
                        fontWeight={isSel ? 600 : 400}
                        fontFamily="JetBrains Mono"
                        fill={isSel ? "var(--ink-1)" : (isNeighbor ? "var(--ink-2)" : "var(--ink-4)")}
                      >{w.w}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sidebar */}
            <div style={{ padding: 24, borderLeft: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <div className="label">selected</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: sel ? CAT_COLORS[sel.cat] : "var(--ink-1)" }}>
                {selected}
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                ({sel.x.toFixed(0)}, {sel.y.toFixed(0)}) · {sel.cat}
              </div>

              <div className="label" style={{ marginTop: 24 }}>5 nearest neighbors</div>
              {neighbors.map((n, i) => {
                const sim = 1 - n.d / 500;
                return (
                  <div key={n.w}
                    onClick={() => setSelected(n.w)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "6px 0", borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
                      <span style={{ color: "var(--ink-5)" }}>{i + 1}.</span>{" "}
                      <span style={{ color: CAT_COLORS[n.cat] }}>{n.w}</span>
                    </span>
                    <span className="num" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      cos {sim.toFixed(3)}
                    </span>
                  </div>
                );
              })}

              <div className="label" style={{ marginTop: 24 }}>categories</div>
              {Object.entries(CAT_COLORS).map(([k, c]) => (
                <label key={k} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "4px 0", cursor: "pointer", fontSize: 12,
                  opacity: hidden.has(k) ? 0.4 : 1,
                }}>
                  <input type="checkbox" checked={!hidden.has(k)} onChange={() => toggleCat(k)}
                    style={{ accentColor: c }} />
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: c }} />
                  <span>{k}</span>
                </label>
              ))}

              <hr className="divider" style={{ margin: "20px 0" }} />

              <button
                className={`btn btn--sm ${showArithmetic ? "btn--primary" : ""}`}
                onClick={() => setShowArithmetic(!showArithmetic)}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {showArithmetic ? "✓ " : ""}king − man + woman = ?
              </button>
              {showArithmetic && (
                <p className="muted" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
                  Subtract the "man" vector from "king", add the "woman" vector. Land near{" "}
                  <strong style={{ color: "var(--green)" }}>{arithmetic.closest.w}</strong>. Gender is
                  encoded as a direction in this space.
                </p>
              )}
            </div>
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Meaning becomes geometry">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">real dimensionality</div>
            <div className="num h-2" style={{ marginTop: 4 }}>1,024 — 4,096</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              This demo is 2D for your eyes. Real embedding vectors live in 1024- or 4096-dimensional
              space. We project down with UMAP or t-SNE just to look at them.
            </p>
          </div>
        }>
          <p>
            An embedding is a vector — a list of numbers — that represents a piece of text in a way
            that makes <strong style={{ color: "var(--green)" }}>geometric closeness</strong> match{" "}
            <strong style={{ color: "var(--green)" }}>semantic closeness</strong>.
          </p>
          <p style={{ marginTop: 16 }}>
            Click "cat" and "dog" land near each other because they appeared in similar sentences
            during training. "apple" sits with foods. "python" sits with tech. The model learned this
            without anyone labeling categories — it just had to predict missing words from context.
          </p>
          <p style={{ marginTop: 16 }}>
            Once meaning is geometric, you can do arithmetic on it. Subtract directions. Add directions.
            The famous result <code>king − man + woman ≈ queen</code> works because the gender vector
            is roughly the same wherever you measure it.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`from openai import OpenAI
client = OpenAI()

# Embed a batch of texts
texts = ["cat", "dog", "apple", "python"]
resp = client.embeddings.create(
    model="text-embedding-3-small",
    input=texts,
)
vectors = [d.embedding for d in resp.data]  # list of 1536-dim floats

# Cosine similarity = dot(a, b) / (|a| * |b|)
import numpy as np
def cos(a, b):
    a, b = np.array(a), np.array(b)
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

print(cos(vectors[0], vectors[1]))  # cat vs dog   ≈ 0.72
print(cos(vectors[0], vectors[2]))  # cat vs apple ≈ 0.31`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Toggle off 'animal' and 'food'. The remaining clusters get easier to see — categories really are separated regions of space.",
          "Click 'paris', then 'tokyo'. Both are cities, but cities are a much looser cluster than animals — geography ≠ semantics.",
          "Flip on the king/man/woman arithmetic. Notice the 'gender vector' is approximately parallel between (king→queen) and (man→woman).",
          "Click a 'tech' word, then a 'verb'. Cosine similarity drops — different regions of space, different topics.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default EmbeddingsDemo;
