import React, { useState, useRef, useMemo } from "react";
import { dist, Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Vector database — k-NN over an embedded corpus
// ============================================================

// Simulated 2D embeddings for 30 short document chunks.
// In production these would be 1024+ dim vectors from an embedding model.
const CHUNKS = [
  // Cooking/food chunks (top-left cluster)
  { id: 1,  text: "How to caramelize onions: low heat, 45 minutes, stir occasionally.",  x: 100, y: 120, topic: "cooking" },
  { id: 2,  text: "Sourdough requires a starter, time, and patience — about 24 hours.",  x: 130, y: 95,  topic: "cooking" },
  { id: 3,  text: "Use a cast iron pan for searing. Preheat for 5+ minutes first.",      x: 165, y: 110, topic: "cooking" },
  { id: 4,  text: "Always salt pasta water generously — it should taste like the sea.",  x: 110, y: 155, topic: "cooking" },
  { id: 5,  text: "Resting steak after cooking lets juices redistribute. 5 min minimum.",x: 145, y: 140, topic: "cooking" },
  { id: 6,  text: "Olive oil has a smoke point around 375°F — don't use it for searing.",x: 180, y: 145, topic: "cooking" },

  // Programming chunks (top-right cluster)
  { id: 7,  text: "Python list comprehensions are faster than equivalent for-loops.",    x: 555, y: 105, topic: "code" },
  { id: 8,  text: "Use __slots__ on data classes to save memory for millions of instances.", x: 590, y: 130, topic: "code" },
  { id: 9,  text: "Async functions return coroutines — you must await them.",            x: 620, y: 100, topic: "code" },
  { id:10,  text: "Type hints don't enforce types at runtime. Use pydantic for that.",   x: 575, y: 155, topic: "code" },
  { id:11,  text: "f-strings are faster and clearer than .format() or % formatting.",    x: 610, y: 165, topic: "code" },
  { id:12,  text: "Use enumerate(seq) instead of range(len(seq)) when iterating.",       x: 545, y: 140, topic: "code" },

  // Travel chunks (middle)
  { id:13,  text: "Tokyo's metro is faster than taxis at rush hour. Get a Suica card.",  x: 340, y: 250, topic: "travel" },
  { id:14,  text: "Iceland in winter: pack layers, expect storms, rent a 4x4.",          x: 380, y: 275, topic: "travel" },
  { id:15,  text: "Most European trains require seat reservations in addition to tickets.", x: 310, y: 295, topic: "travel" },
  { id:16,  text: "Carry a power adapter — outlet shapes vary even within Europe.",      x: 370, y: 230, topic: "travel" },

  // Fitness chunks (bottom-left)
  { id:17,  text: "Compound lifts build more strength per minute than isolation work.",   x: 110, y: 360, topic: "fitness" },
  { id:18,  text: "Sleep 7-9 hours for recovery. Without it, muscle growth stalls.",      x: 140, y: 395, topic: "fitness" },
  { id:19,  text: "Walk 8-10k steps a day for baseline cardiovascular health.",           x: 95,  y: 405, topic: "fitness" },
  { id:20,  text: "Protein needs are roughly 1.6g per kg bodyweight for active people.",  x: 165, y: 380, topic: "fitness" },
  { id:21,  text: "Static stretching after workouts. Dynamic mobility work before.",      x: 130, y: 425, topic: "fitness" },

  // ML / AI chunks (bottom-right)
  { id:22,  text: "Embeddings turn text into vectors so you can do nearest-neighbor lookup.", x: 580, y: 365, topic: "ai" },
  { id:23,  text: "Fine-tuning needs ~10k high-quality examples to noticeably move a model.", x: 605, y: 395, topic: "ai" },
  { id:24,  text: "RAG retrieves context at query time instead of baking it into weights.",  x: 555, y: 410, topic: "ai" },
  { id:25,  text: "Temperature controls how greedy the model is when sampling tokens.",      x: 625, y: 380, topic: "ai" },
  { id:26,  text: "Vector databases use ANN indexes like HNSW for sub-linear search.",       x: 590, y: 425, topic: "ai" },

  // Misc / edge cases
  { id:27,  text: "Bears can run 35 mph. Do not try to outrun a bear.",                       x: 380, y: 100, topic: "nature" },
  { id:28,  text: "The Pacific Ocean covers more area than all land combined.",               x: 410, y: 165, topic: "nature" },
];

const TOPIC_COLORS = {
  cooking: "var(--yellow)",
  code:    "var(--blue)",
  travel:  "var(--violet)",
  fitness: "var(--orange)",
  ai:      "var(--green)",
  nature:  "var(--pink)",
};

// Pre-baked semantic queries with hand-tuned "embedding" positions
// (so demo feels real even without a real embedding model)
const QUERIES = [
  { text: "What's the best way to cook a steak?",         x: 140, y: 130 },
  { text: "How do I make my Python code faster?",         x: 590, y: 125 },
  { text: "Tips for visiting Japan",                       x: 330, y: 240 },
  { text: "Best exercises for getting stronger",           x: 115, y: 375 },
  { text: "How do language models retrieve information?",  x: 580, y: 395 },
  { text: "Wild animal safety",                            x: 380, y: 105 },
];

const PLOT_W = 720;
const PLOT_H = 520;

function VectorDBDemo() {
  const [query, setQuery] = useState(QUERIES[0]);
  const [k, setK] = useState(3);
  const [customQuery, setCustomQuery] = useState(null);
  const svgRef = useRef(null);

  const activeQ = customQuery || query;

  // k-nearest
  const ranked = useMemo(() => {
    return CHUNKS
      .map(c => ({ ...c, d: dist([c.x, c.y], [activeQ.x, activeQ.y]) }))
      .sort((a, b) => a.d - b.d);
  }, [activeQ]);

  const topK = ranked.slice(0, k);
  const topKIds = new Set(topK.map(c => c.id));

  function handleSvgClick(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * PLOT_W;
    const y = ((e.clientY - rect.top) / rect.height) * PLOT_H;
    setCustomQuery({ text: "custom query @ (" + x.toFixed(0) + ", " + y.toFixed(0) + ")", x, y });
  }

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Drop a query. Find the nearest neighbors.">
        <Stage padding={0}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px" }}>
            <div style={{ padding: 16, position: "relative" }}>
              <svg ref={svgRef} viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
                onClick={handleSvgClick}
                style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair", userSelect: "none" }}>
                {/* grid */}
                {Array.from({length: 8}).map((_, i) => (
                  <line key={"v"+i} x1={i*100} y1={0} x2={i*100} y2={PLOT_H} stroke="var(--bg-3)" strokeWidth={1} />
                ))}
                {Array.from({length: 6}).map((_, i) => (
                  <line key={"h"+i} x1={0} y1={i*100} x2={PLOT_W} y2={i*100} stroke="var(--bg-3)" strokeWidth={1} />
                ))}

                {/* circle radius of k-th neighbor */}
                {topK.length > 0 && (
                  <circle cx={activeQ.x} cy={activeQ.y} r={topK[topK.length - 1].d}
                    fill="rgba(var(--green-rgb), 0.06)" stroke="var(--green)" strokeWidth={1} strokeDasharray="4 4" />
                )}

                {/* lines to top-k */}
                {topK.map((c, i) => (
                  <line key={c.id} x1={activeQ.x} y1={activeQ.y} x2={c.x} y2={c.y}
                    stroke="var(--green)" strokeWidth={1.2} opacity={1 - i * 0.15} strokeDasharray="3 3" />
                ))}

                {/* chunks */}
                {CHUNKS.map(c => {
                  const inTop = topKIds.has(c.id);
                  const color = TOPIC_COLORS[c.topic];
                  return (
                    <g key={c.id} style={{ pointerEvents: "none" }}>
                      <circle cx={c.x} cy={c.y} r={inTop ? 6 : 4}
                        fill={color}
                        opacity={inTop ? 1 : 0.55}
                        stroke={inTop ? "var(--ink-1)" : "none"}
                        strokeWidth={inTop ? 1 : 0}
                      />
                      {inTop && (
                        <text x={c.x + 10} y={c.y + 4} fontSize={10}
                          fontFamily="JetBrains Mono" fill={color}>#{c.id}</text>
                      )}
                    </g>
                  );
                })}

                {/* query marker */}
                <g style={{ pointerEvents: "none" }}>
                  <circle cx={activeQ.x} cy={activeQ.y} r={9} fill="none" stroke="var(--ink-1)" strokeWidth={2} />
                  <circle cx={activeQ.x} cy={activeQ.y} r={3} fill="var(--ink-1)" />
                  <text x={activeQ.x + 14} y={activeQ.y - 12} fontSize={11}
                    fontFamily="JetBrains Mono" fill="var(--ink-1)" fontWeight={600}>QUERY</text>
                </g>
              </svg>

              <div style={{
                position: "absolute", bottom: 24, left: 24,
                fontSize: 11, color: "var(--ink-4)",
                background: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
                borderRadius: 3,
              }}>↻ click anywhere to drop a query</div>
            </div>

            <div style={{ padding: 24, borderLeft: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <div className="label">query</div>
              <div style={{
                padding: "10px 12px",
                background: "var(--bg-1)",
                border: "1px solid var(--border-bright)",
                borderRadius: 4,
                fontSize: 12.5,
                color: "var(--ink-1)",
                fontStyle: customQuery ? "normal" : "italic",
                minHeight: 56,
              }}>{activeQ.text}</div>

              <div className="label" style={{ marginTop: 16 }}>preset queries</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {QUERIES.map((q, i) => (
                  <button key={i}
                    className="btn btn--sm btn--ghost"
                    onClick={() => { setQuery(q); setCustomQuery(null); }}
                    style={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      textTransform: "none",
                      letterSpacing: 0,
                      fontSize: 11.5,
                      color: q === query && !customQuery ? "var(--green)" : "var(--ink-2)",
                      borderColor: q === query && !customQuery ? "var(--green)" : "var(--border)",
                    }}
                  >{q.text}</button>
                ))}
              </div>

              <div className="label" style={{ marginTop: 24 }}>k · {k}</div>
              <input type="range" min={1} max={10} value={k} onChange={(e) => setK(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--green)" }} />

              <div className="label" style={{ marginTop: 24 }}>top {k} results</div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {topK.map((c, i) => {
                  const sim = 1 - c.d / 700;
                  return (
                    <div key={c.id} style={{
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
                          #{c.id} · <span style={{ color: TOPIC_COLORS[c.topic] }}>{c.topic}</span>
                        </span>
                        <span className="num" style={{ fontSize: 10, color: "var(--green)" }}>
                          sim {sim.toFixed(3)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.4 }}>
                        {c.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Find similar, fast">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">vector DBs in the wild</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.9 }}>
              <li>Pinecone · managed, fast, expensive</li>
              <li>Weaviate · self-host, hybrid search</li>
              <li>pgvector · just Postgres</li>
              <li>Qdrant · Rust, open source</li>
              <li>Chroma · easiest local dev</li>
              <li>FAISS · library, not a service</li>
            </ul>
          </div>
        }>
          <p>
            A <strong style={{ color: "var(--green)" }}>vector database</strong> stores embeddings and
            lets you find the k closest ones to any query vector — fast. Without one, you'd compute
            cosine similarity against every stored vector at query time (O(n) per search).
          </p>
          <p style={{ marginTop: 16 }}>
            Real vector DBs use <strong>approximate nearest neighbor (ANN)</strong> indexes — HNSW,
            IVF, ScaNN — which trade exact correctness for sub-linear lookup time. Searching 100M
            vectors in &lt;50ms is normal.
          </p>
          <p style={{ marginTop: 16 }}>
            The flow: embed the query the same way you embedded the corpus, then ask the DB for the
            top-k. The result is your "retrieval" step — what you'd hand to the LLM as context.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("docs")

# Index a batch of chunks
collection.add(
    ids=[f"chunk-{i}" for i in range(len(chunks))],
    documents=[c.text for c in chunks],
    metadatas=[{"topic": c.topic} for c in chunks],
    # Chroma can embed for you, or you pass embeddings in:
    # embeddings=[embed(c.text) for c in chunks],
)

# Query
results = collection.query(
    query_texts=["how do I make Python faster?"],
    n_results=3,
    where={"topic": "code"},   # optional metadata filter
)
for doc, score in zip(results["documents"][0], results["distances"][0]):
    print(round(score, 3), doc)`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Click anywhere on the plot. The system finds the nearest documents — even in the gaps between topic clusters.",
          "Try the 'wild animal safety' query. Two distant chunks (bears, ocean) get retrieved because they're in the same loose 'nature' region.",
          "Click in the dead center of the plot. The results are weak (low similarity) — that's a query where retrieval should fall back to 'I don't know'.",
          "Increase k from 3 to 8. Notice irrelevant topics start sneaking in — that's why most systems also use a reranker.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default VectorDBDemo;
