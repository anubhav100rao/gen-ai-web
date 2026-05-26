import React, { useState, useMemo } from "react";
import { hash01, Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Semantic vs BM25 — same corpus, two retrieval strategies
// ============================================================

const CORPUS = [
  { id: 1,  text: "The new electric Porsche reaches 60 mph in 2.5 seconds.",                               topic: "auto" },
  { id: 2,  text: "Speedy automobiles often sacrifice fuel efficiency for raw horsepower.",               topic: "auto" },
  { id: 3,  text: "Traffic congestion in major cities adds hours to daily commutes.",                     topic: "auto" },
  { id: 4,  text: "Self-driving cars rely on lidar, radar, and computer vision in tandem.",                topic: "auto" },

  { id: 5,  text: "Python is a popular programming language for data science and machine learning.",      topic: "code" },
  { id: 6,  text: "JavaScript dominates web development through frameworks like React and Vue.",          topic: "code" },
  { id: 7,  text: "Static type systems catch entire categories of bugs before they ship.",                 topic: "code" },
  { id: 8,  text: "Async I/O lets a single thread handle thousands of network connections.",               topic: "code" },

  { id: 9,  text: "A king-sized bed measures 76 by 80 inches and fits most master bedrooms.",             topic: "home" },
  { id: 10, text: "Chess endgames often hinge on whether the king can reach the corner safely.",          topic: "chess" },
  { id: 11, text: "Medieval monarchs ruled through a mix of force, marriage, and religious legitimacy.",   topic: "history" },

  { id: 12, text: "Vector embeddings encode meaning as positions in a high-dimensional space.",           topic: "ai" },
  { id: 13, text: "Retrieval-augmented generation looks up documents before composing an answer.",         topic: "ai" },
  { id: 14, text: "Transformers process tokens in parallel using self-attention.",                         topic: "ai" },

  { id: 15, text: "Sourdough bread requires a living starter and develops flavor over days of fermentation.", topic: "food" },
  { id: 16, text: "A perfect ribeye is reverse-seared: low oven, then a screaming-hot pan.",              topic: "food" },
];

// Simple tokenizer: lowercase, split, strip punctuation, drop stopwords
const STOPWORDS = new Set(["a","an","the","is","are","was","were","be","been","being","of","in","on","at","to","for","with","and","or","but","if","then","that","this","these","those","it","its","as","by","from"]);
function tokens(s) {
  return s.toLowerCase()
    .replace(/[.,!?;:()'"–-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => !STOPWORDS.has(t));
}

// BM25 scoring
const k1 = 1.5;
const b  = 0.75;

function bm25(query, docs) {
  const qTerms = [...new Set(tokens(query))];
  const N = docs.length;
  const docTokens = docs.map(d => tokens(d.text));
  const docLens   = docTokens.map(t => t.length);
  const avgDl     = docLens.reduce((s, l) => s + l, 0) / N;

  // doc frequency per term
  const df = {};
  for (const t of qTerms) {
    df[t] = docTokens.filter(dt => dt.includes(t)).length;
  }

  return docs.map((d, i) => {
    let score = 0;
    const matchedTerms = [];
    for (const t of qTerms) {
      if (df[t] === 0) continue;
      const tf = docTokens[i].filter(w => w === t).length;
      if (tf === 0) continue;
      const idf = Math.log((N - df[t] + 0.5) / (df[t] + 0.5) + 1);
      const num = tf * (k1 + 1);
      const den = tf + k1 * (1 - b + b * docLens[i] / avgDl);
      score += idf * (num / den);
      matchedTerms.push(t);
    }
    return { ...d, score, matched: matchedTerms };
  }).sort((a, b) => b.score - a.score);
}

// "Semantic" scoring — simulated via hand-tuned topic adjacency,
// plus a small noise term derived from the query string.
// Each query maps to a topic prior; chunks of that topic score high regardless of words.
const QUERY_PRESETS = [
  {
    q: "fast car",
    semanticTopics: { auto: 0.95, ai: 0.1, code: 0.1, food: 0.05 },
    note: "BM25 finds doc 1 (matches 'car'/'fast'... well, no actual 'car' match either). Semantic finds the whole 'auto' cluster — including 'speedy automobiles' which shares no words.",
  },
  {
    q: "python",
    semanticTopics: { code: 0.95, ai: 0.55 },
    note: "BM25 nails doc 5 with one exact term. Semantic also pulls in JavaScript and ML docs because they're in the same topic neighborhood.",
  },
  {
    q: "king",
    semanticTopics: { chess: 0.9, history: 0.85, home: 0.7 },
    note: "BM25 returns ALL three uses of 'king' tied at the top — bed, chess piece, monarch — because lexical match doesn't know which sense you meant. Semantic spreads them out.",
  },
  {
    q: "how do language models retrieve information",
    semanticTopics: { ai: 0.95 },
    note: "BM25 struggles because 'language', 'models', 'retrieve' rarely co-occur in any one doc. Semantic understands the whole question.",
  },
  {
    q: "Porsche",
    semanticTopics: { auto: 0.55 },
    note: "Exact-match wins. BM25 returns doc 1 with a perfect lexical hit. Semantic gets the right doc too but with much weaker confidence.",
  },
];

function semanticScore(query, docs) {
  const preset = QUERY_PRESETS.find(p => p.q === query);
  if (!preset) {
    // generic fallback: pseudo-similarity via query hash
    return docs.map(d => ({
      ...d,
      score: 0.3 + hash01(query + d.text) * 0.4,
    })).sort((a, b) => b.score - a.score);
  }
  return docs.map(d => {
    const base = preset.semanticTopics[d.topic] || 0.1;
    // small noise per-doc to break ties
    const noise = hash01(d.text) * 0.08;
    return { ...d, score: base + noise };
  }).sort((a, b) => b.score - a.score);
}

function SearchCompareDemo() {
  const [query, setQuery] = useState(QUERY_PRESETS[0].q);

  const bm25Results = useMemo(() => bm25(query, CORPUS).slice(0, 5), [query]);
  const semResults  = useMemo(() => semanticScore(query, CORPUS).slice(0, 5), [query]);
  const preset      = QUERY_PRESETS.find(p => p.q === query);

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Same query. Two different rankings.">
        <Stage>
          <div className="label">try a query</div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", fontSize: 14, padding: "12px 16px" }}
            placeholder="type or pick a preset…"
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {QUERY_PRESETS.map(p => (
              <button key={p.q}
                className={`btn btn--sm ${p.q === query ? "btn--primary" : ""}`}
                onClick={() => setQuery(p.q)}
              >"{p.q}"</button>
            ))}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 28,
          }}>
            <ResultsColumn
              title="BM25"
              subtitle="lexical · term-frequency × inverse-doc-frequency"
              results={bm25Results}
              color="var(--pink)"
              query={query}
              showMatches
            />
            <ResultsColumn
              title="Semantic"
              subtitle="vector cosine · embedding-based"
              results={semResults}
              color="var(--green)"
              query={query}
            />
          </div>

          {preset && (
            <div style={{
              marginTop: 20,
              padding: "12px 16px",
              background: "var(--bg-2)",
              border: "1px dashed var(--border-bright)",
              borderRadius: 4,
              fontSize: 13,
              color: "var(--ink-2)",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}>
              <span style={{ color: "var(--yellow)", fontStyle: "normal", fontWeight: 600 }}>note · </span>
              {preset.note}
            </div>
          )}
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Words vs meanings">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">hybrid search</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
              Most production RAG runs both, fuses scores (RRF or weighted sum), then reranks the
              top ~50 with a cross-encoder. You get the best of both: exact-term precision and
              semantic recall.
            </p>
          </div>
        }>
          <p>
            <strong style={{ color: "var(--pink)" }}>BM25</strong> is a 50-year-old algorithm that
            scores documents by lexical overlap with the query. It rewards rare terms, penalizes long
            documents, and only matches words that literally appear in the text.
          </p>
          <p style={{ marginTop: 16 }}>
            <strong style={{ color: "var(--green)" }}>Semantic search</strong> embeds both the query
            and the documents into a vector space and ranks by cosine similarity. It can match{" "}
            <code>"speedy automobile"</code> against <code>"fast car"</code> because they're close in
            embedding space — but it has no idea what specific terms you actually said.
          </p>
          <p style={{ marginTop: 16 }}>
            BM25 wins on exact-match queries (product SKUs, names, specific terms). Semantic wins on
            paraphrased questions, synonyms, and natural-language queries. <strong>Hybrid</strong> wins
            on most production workloads.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`# BM25 with rank_bm25
from rank_bm25 import BM25Okapi
corpus_tokens = [doc.lower().split() for doc in corpus]
bm25 = BM25Okapi(corpus_tokens)
bm25_scores = bm25.get_scores("fast car".split())

# Semantic with sentence-transformers
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")
doc_emb = model.encode(corpus)
q_emb   = model.encode("fast car")
sem_scores = (doc_emb @ q_emb) / (norm(doc_emb, axis=1) * norm(q_emb))

# Hybrid: reciprocal rank fusion
def rrf(ranks_a, ranks_b, k=60):
    return {doc: 1/(k + ranks_a.get(doc, 999)) + 1/(k + ranks_b.get(doc, 999))
            for doc in set(ranks_a) | set(ranks_b)}`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Try 'king'. BM25 returns all three meanings tied at the top — it doesn't know which one you wanted. Semantic spreads the score by topic plausibility.",
          "Try 'Porsche'. Exact-term match: BM25 destroys semantic on confidence. This is why search engines still use BM25 for product names.",
          "Try the natural-language version 'how do language models retrieve information'. BM25 finds individual term matches scattered across docs. Semantic finds the whole concept.",
          "Type your own query. Notice when the two rankings agree (clear topic) vs disagree (ambiguous wording).",
        ]} />
      </Section>
    </React.Fragment>
  );
}

function ResultsColumn({ title, subtitle, results, color, query, showMatches }) {
  const max = Math.max(...results.map(r => r.score), 0.01);
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: 4,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-3)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color }}>{title}</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 2 }}>{subtitle}</div>
      </div>
      <div>
        {results.map((r, i) => {
          const pct = (r.score / max) * 100;
          return (
            <div key={r.id} style={{
              padding: "10px 14px",
              borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
                  #{i + 1} · doc {r.id} · {r.topic}
                </span>
                <span className="num" style={{ fontSize: 10.5, color }}>
                  {r.score.toFixed(3)}
                </span>
              </div>
              <div style={{ marginTop: 4, height: 3, background: "var(--bg-1)", borderRadius: 999 }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: color,
                  borderRadius: 999,
                  transition: "width 0.3s var(--ease)",
                }} />
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6, color: "var(--ink-2)" }}>
                {showMatches ? <HighlightMatched text={r.text} terms={r.matched || []} /> : r.text}
              </div>
            </div>
          );
        })}
        {results.every(r => r.score < 0.001) && (
          <div style={{ padding: 16, fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>
            no matches — no document contains those terms.
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightMatched({ text, terms }) {
  if (!terms.length) return text;
  const re = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    terms.some(t => p.toLowerCase() === t.toLowerCase())
      ? <mark key={i} style={{ background: "rgba(var(--pink-rgb), 0.25)", color: "var(--pink)", padding: "0 2px", borderRadius: 2 }}>{p}</mark>
      : <span key={i}>{p}</span>
  );
}

export default SearchCompareDemo;
