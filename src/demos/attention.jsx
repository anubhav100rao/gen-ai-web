import React, { useState } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Attention — heatmap of who-attends-to-whom
// ============================================================

const ATTENTION_EXAMPLES = {
  "the cat sat on the mat because it was tired": {
    tokens: ["The", "cat", "sat", "on", "the", "mat", "because", "it", "was", "tired"],
    // Hand-tuned attention weights to show meaningful patterns.
    // weights[query][key] = how much query attends to key
    weights: [
      //       The   cat   sat   on    the   mat   bec.  it    was   tired
      /* The */[0.8, 0.1,  0.05, 0.0,  0.0,  0.05, 0.0,  0.0,  0.0,  0.0],
      /* cat */[0.4, 0.5,  0.05, 0.0,  0.0,  0.05, 0.0,  0.0,  0.0,  0.0],
      /* sat */[0.05,0.55, 0.3,  0.05, 0.0,  0.05, 0.0,  0.0,  0.0,  0.0],
      /* on  */[0.05,0.15, 0.5,  0.2,  0.0,  0.1,  0.0,  0.0,  0.0,  0.0],
      /* the */[0.1, 0.05, 0.05, 0.15, 0.55, 0.1,  0.0,  0.0,  0.0,  0.0],
      /* mat */[0.05,0.15, 0.05, 0.15, 0.25, 0.35, 0.0,  0.0,  0.0,  0.0],
      /* bec.*/[0.0, 0.3,  0.1,  0.05, 0.05, 0.15, 0.3,  0.05, 0.0,  0.0],
      /* it  */[0.0, 0.65, 0.05, 0.0,  0.0,  0.1,  0.05, 0.1,  0.0,  0.05],   // 'it' → 'cat'
      /* was */[0.0, 0.4,  0.05, 0.0,  0.0,  0.05, 0.05, 0.25, 0.15, 0.05],
      /*tired*/[0.0, 0.55, 0.05, 0.0,  0.0,  0.0,  0.05, 0.2,  0.05, 0.1],    // 'tired' → 'cat'
    ],
    note: "Notice how 'it' and 'tired' attend strongly back to 'cat' — that's coreference resolution emerging from attention.",
  },
  "she gave the book to him after reading it": {
    tokens: ["She", "gave", "the", "book", "to", "him", "after", "reading", "it"],
    weights: [
      /* She */[0.85,0.05,0.0, 0.05,0.0, 0.05,0.0, 0.0, 0.0],
      /* gave*/[0.4, 0.45,0.0, 0.05,0.0, 0.05,0.0, 0.0, 0.0],
      /* the */[0.05,0.1, 0.6, 0.2, 0.0, 0.05,0.0, 0.0, 0.0],
      /*book */[0.05,0.25,0.25,0.4, 0.0, 0.05,0.0, 0.0, 0.0],
      /* to  */[0.05,0.4, 0.05,0.15,0.3, 0.05,0.0, 0.0, 0.0],
      /* him */[0.1, 0.15,0.0, 0.05,0.3, 0.4, 0.0, 0.0, 0.0],
      /*after*/[0.1, 0.2, 0.0, 0.15,0.0, 0.15,0.4, 0.0, 0.0],
      /*read.*/[0.4, 0.1, 0.0, 0.25,0.0, 0.1, 0.1, 0.05,0.0],     // 'reading' → 'she'
      /* it  */[0.05,0.05,0.0, 0.7, 0.0, 0.05,0.05,0.05,0.05],    // 'it' → 'book'
    ],
    note: "'it' attends to 'book' (what was read). 'reading' attends to 'she' (who is doing the reading).",
  },
  "the trophy did not fit in the suitcase because it was too big": {
    tokens: ["The","trophy","did","not","fit","in","the","suitcase","because","it","was","too","big"],
    weights: [
      /*The */[0.75,0.15,0.0,0.0,0.0,0.0,0.05,0.05,0.0,0.0,0.0,0.0,0.0],
      /*trop*/[0.4, 0.45,0.05,0.0,0.05,0.0,0.0,0.05,0.0,0.0,0.0,0.0,0.0],
      /*did */[0.05,0.45,0.3,0.05,0.1,0.0,0.0,0.05,0.0,0.0,0.0,0.0,0.0],
      /*not */[0.05,0.4,0.15,0.2,0.15,0.0,0.0,0.05,0.0,0.0,0.0,0.0,0.0],
      /*fit */[0.05,0.45,0.05,0.1,0.2,0.05,0.0,0.1,0.0,0.0,0.0,0.0,0.0],
      /*in  */[0.05,0.15,0.0,0.0,0.45,0.2,0.05,0.1,0.0,0.0,0.0,0.0,0.0],
      /*the */[0.05,0.05,0.0,0.0,0.05,0.15,0.55,0.15,0.0,0.0,0.0,0.0,0.0],
      /*suit*/[0.05,0.15,0.0,0.0,0.1,0.1,0.25,0.35,0.0,0.0,0.0,0.0,0.0],
      /*bec.*/[0.05,0.2,0.0,0.05,0.1,0.05,0.05,0.2,0.3,0.0,0.0,0.0,0.0],
      /*it  */[0.0, 0.1,0.0,0.0,0.0,0.0,0.05,0.55,0.05,0.15,0.05,0.0,0.05], // it → suitcase
      /*was */[0.0, 0.1,0.0,0.0,0.0,0.0,0.0,0.4,0.05,0.2,0.15,0.05,0.05],
      /*too */[0.0, 0.05,0.0,0.0,0.0,0.0,0.0,0.3,0.05,0.15,0.15,0.2,0.1],
      /*big */[0.0, 0.05,0.0,0.0,0.0,0.0,0.0,0.55,0.05,0.15,0.05,0.1,0.05],  // big → suitcase
    ],
    note: "Classic Winograd schema. The correct reading is that 'it' = trophy (the trophy is too big to fit). Smaller models often get this wrong — notice 'it' here attends most to 'suitcase' instead. Resolving the reference requires combining 'too big' with world knowledge across layers, not just local attention.",
  },
};

function AttentionDemo() {
  const [example, setExample] = useState("the cat sat on the mat because it was tired");
  const [hoverQ, setHoverQ] = useState(null);
  const [pinnedQ, setPinnedQ] = useState(null);
  const [showMatrix, setShowMatrix] = useState(true);

  const ex = ATTENTION_EXAMPLES[example];
  const focusQ = hoverQ != null ? hoverQ : pinnedQ;

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Who's looking at whom">
        <Stage>
          {/* example picker */}
          <div className="label">sentence</div>
          <select value={example} onChange={(e) => { setExample(e.target.value); setPinnedQ(null); }}
            style={{ width: "100%", marginBottom: 24 }}>
            {Object.keys(ATTENTION_EXAMPLES).map(k => (
              <option key={k} value={k}>"{k}"</option>
            ))}
          </select>

          {/* Tokens row — interactive */}
          <div className="label">click or hover a token to see what it attends to</div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 28,
            padding: 16,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
          }}>
            {ex.tokens.map((t, i) => {
              const isFocus = i === focusQ;
              return (
                <button key={i}
                  onMouseEnter={() => setHoverQ(i)}
                  onMouseLeave={() => setHoverQ(null)}
                  onClick={() => setPinnedQ(pinnedQ === i ? null : i)}
                  className="tok"
                  style={{
                    background: isFocus ? "var(--green)" : "var(--bg-3)",
                    color: isFocus ? "var(--bg)" : "var(--ink-1)",
                    border: `1px solid ${isFocus ? "var(--green)" : "var(--border-bright)"}`,
                    fontWeight: isFocus ? 600 : 400,
                    fontSize: 14,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >{t}</button>
              );
            })}
          </div>

          {/* Active row visual */}
          {focusQ != null && (
            <div style={{ marginTop: 8 }}>
              <div className="label">
                <span style={{ color: "var(--green)" }}>"{ex.tokens[focusQ]}"</span> attends to →
              </div>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 6,
                padding: 16, background: "var(--bg-2)",
                border: "1px solid var(--border)", borderRadius: 4,
              }}>
                {ex.tokens.map((t, j) => {
                  const w = ex.weights[focusQ][j];
                  return (
                    <span key={j} className="tok" style={{
                      background: `rgba(var(--green-rgb), ${w * 1.2})`,
                      color: w > 0.4 ? "var(--bg)" : "var(--ink-2)",
                      border: `1px solid rgba(var(--green-rgb), ${Math.max(0.15, w * 1.5)})`,
                      fontSize: 13,
                      padding: "4px 8px",
                    }}
                      title={`${(w * 100).toFixed(1)}%`}
                    >{t} <span style={{ fontSize: 10, opacity: 0.7 }}>{(w * 100).toFixed(0)}%</span></span>
                  );
                })}
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 12, fontStyle: "italic" }}>
                {ex.note}
              </p>
            </div>
          )}

          {/* Full matrix toggle */}
          <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="label" style={{ marginBottom: 0 }}>full attention matrix</div>
            <button className="btn btn--sm btn--ghost" onClick={() => setShowMatrix(!showMatrix)}>
              {showMatrix ? "hide" : "show"}
            </button>
          </div>
          {showMatrix && <AttentionMatrix ex={ex} focusQ={focusQ} setHoverQ={setHoverQ} />}
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Each token asks every other token: 'are you relevant?'">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">heads matter</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
              A transformer has many attention heads per layer (16-128) and many layers (32-96). Each
              head learns a different pattern: syntactic, coreference, positional, etc. Our heatmap shows
              what one head, in one layer, might look like.
            </p>
          </div>
        }>
          <p>
            <strong style={{ color: "var(--green)" }}>Attention</strong> is the core mechanism of
            transformers. For each token (the "query"), the model computes how much it should pay
            attention to every other token (the "keys") — a learned soft-lookup over the sequence.
          </p>
          <p style={{ marginTop: 16 }}>
            The math: each token gets projected into a Query vector and a Key vector. Attention score
            between query <code>i</code> and key <code>j</code> is <code>Q_i · K_j</code>, scaled and
            softmaxed. The output for position <code>i</code> is a weighted average of all the Value
            vectors, weighted by those attention scores.
          </p>
          <p style={{ marginTop: 16 }}>
            What's wild: nobody told the model how to do coreference resolution. It emerged from
            attention because the cheapest way to predict the next token after "it was" is to know
            what "it" refers to.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The math, condensed">
        <Code>{`# Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V

import torch
import torch.nn.functional as F

def attention(Q, K, V, mask=None):
    # Q, K, V are [batch, n_heads, seq_len, d_head]
    d_k = Q.size(-1)
    scores = Q @ K.transpose(-2, -1) / (d_k ** 0.5)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float('-inf'))
    weights = F.softmax(scores, dim=-1)
    return weights @ V, weights

# In practice you never write this — use:
# nn.MultiheadAttention or F.scaled_dot_product_attention`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Click 'it' in the cat sentence. It strongly attends back to 'cat' — that's the model resolving the pronoun.",
          "Click 'reading' in the second sentence. It attends to 'she' (the subject) and 'book' (the object).",
          "Look at the Winograd sentence. The correct answer is 'it' = trophy, but in this single-layer snapshot 'it' attends most to 'suitcase'. Pronoun resolution like this needs many layers of attention plus world knowledge to get right.",
          "In a real transformer, every layer rewrites these patterns. By layer 30, attention is doing things humans can barely interpret.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

function AttentionMatrix({ ex, focusQ, setHoverQ }) {
  const cell = 38;
  const labelW = 70;
  const n = ex.tokens.length;
  return (
    <div style={{ marginTop: 14, overflowX: "auto" }}>
      <svg width={labelW + n * cell} height={labelW + n * cell + 8} style={{ display: "block" }}>
        {/* column labels (keys) at top */}
        {ex.tokens.map((t, j) => (
          <text key={"c"+j}
            x={labelW + j * cell + cell/2}
            y={labelW - 8}
            fontSize={10}
            textAnchor="end"
            fontFamily="JetBrains Mono"
            fill="var(--ink-3)"
            transform={`rotate(-45 ${labelW + j * cell + cell/2} ${labelW - 8})`}
          >{t}</text>
        ))}
        {/* row labels (queries) */}
        {ex.tokens.map((t, i) => (
          <text key={"r"+i}
            x={labelW - 8}
            y={labelW + i * cell + cell/2 + 4}
            fontSize={11}
            textAnchor="end"
            fontFamily="JetBrains Mono"
            fill={i === focusQ ? "var(--green)" : "var(--ink-3)"}
            fontWeight={i === focusQ ? 700 : 400}
          >{t}</text>
        ))}
        {/* cells */}
        {ex.weights.map((row, i) => row.map((w, j) => (
          <g key={`${i}-${j}`}>
            <rect
              x={labelW + j * cell}
              y={labelW + i * cell}
              width={cell - 1}
              height={cell - 1}
              fill={`rgba(var(--green-rgb), ${w * 1.2})`}
              stroke={i === focusQ ? "rgba(var(--green-rgb), 0.6)" : "transparent"}
              strokeWidth={i === focusQ ? 1 : 0}
              onMouseEnter={() => setHoverQ(i)}
              onMouseLeave={() => setHoverQ(null)}
              style={{ cursor: "pointer" }}
            />
            {w > 0.25 && (
              <text
                x={labelW + j * cell + cell/2}
                y={labelW + i * cell + cell/2 + 3}
                fontSize={9}
                textAnchor="middle"
                fontFamily="JetBrains Mono"
                fill={w > 0.4 ? "var(--bg)" : "var(--ink-2)"}
                pointerEvents="none"
              >{Math.round(w * 100)}</text>
            )}
          </g>
        )))}
      </svg>
    </div>
  );
}

export default AttentionDemo;
