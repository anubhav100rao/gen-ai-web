import React, { useState, useMemo } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Context window — visualize tokens filling up a finite buffer
// ============================================================

const SAMPLE_DOC = `# Project Plan: AI-Powered Customer Support

## Overview
Build a customer support bot that uses RAG to answer questions
from our product documentation. The bot should escalate to humans
when confidence is low.

## Goals
- Reduce response time from 4 hours to under 2 minutes
- Handle 80% of queries without human intervention  
- Maintain a CSAT score of 4.5+ stars

## Technical Stack
- Anthropic Claude as the language model
- Pinecone vector database for retrieval
- Cohere reranker for top-k refinement
- LangGraph for orchestration

## Open Questions
1. How do we handle multi-turn conversations with context?
2. What's our fallback when retrieval returns nothing relevant?
3. Should the bot ever take actions (refunds) or only answer?
4. How do we measure hallucination rate in production?
5. What's the cost ceiling per conversation?`;

// Naive whitespace+punctuation tokenizer for visualization
function quickTokens(text) {
  const out = [];
  const re = /(\s+|[.,!?;:#\-()'"]|[^\s.,!?;:#\-()'"]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
}

function ContextWindowDemo() {
  const [contextSize, setContextSize] = useState(200);
  const [systemPrompt, setSystemPrompt] = useState(35);
  const [conversation, setConversation] = useState(85);
  const [doc, setDoc] = useState(SAMPLE_DOC);

  const docTokens = useMemo(() => quickTokens(doc), [doc]);

  // Layout: [system | conversation | doc | output buffer]
  // If doc + sys + conv > ctx, we truncate doc from the left.
  const outputBuffer = 40;
  const available = contextSize - systemPrompt - conversation - outputBuffer;
  const docFits = Math.max(0, Math.min(docTokens.length, available));
  const docDropped = Math.max(0, docTokens.length - docFits);
  const overflowing = docDropped > 0;

  const slots = [
    { label: "system prompt", val: systemPrompt, color: "var(--blue-dim)", colorHi: "var(--blue)" },
    { label: "conversation",  val: conversation, color: "var(--yellow-dim)", colorHi: "var(--yellow)" },
    { label: "document",      val: docFits,      color: "var(--green-dim)", colorHi: "var(--green)" },
    { label: "output (reserved)", val: outputBuffer, color: "var(--ink-4)", colorHi: "var(--ink-3)" },
  ];

  const totalUsed = slots.reduce((s, x) => s + x.val, 0);
  const free = contextSize - totalUsed;

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Every token costs. See what fits.">
        <Stage>
          {/* Bar visualization */}
          <div className="label">context window — {contextSize} tokens</div>
          <div style={{
            display: "flex",
            height: 56,
            border: "1px solid var(--border-bright)",
            borderRadius: 4,
            overflow: "hidden",
            marginTop: 8,
          }}>
            {slots.map((s, i) => (
              <div key={i}
                style={{
                  width: `${(s.val / contextSize) * 100}%`,
                  background: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: i < slots.length - 1 ? "1px solid #000" : "none",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--bg)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {s.val > 8 ? `${s.label} · ${s.val}` : s.val}
              </div>
            ))}
            {free > 0 && (
              <div style={{
                width: `${(free / contextSize) * 100}%`,
                background: "var(--bg-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "var(--ink-4)",
              }}>{free > 8 ? `free · ${free}` : ""}</div>
            )}
          </div>

          {/* Sliders */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 24,
          }}>
            <Slider label="context size"  v={contextSize}  setV={setContextSize}  min={100} max={500} color="var(--green)" />
            <Slider label="system prompt" v={systemPrompt} setV={setSystemPrompt} min={0}   max={150} color="var(--blue)" />
            <Slider label="conversation"  v={conversation} setV={setConversation} min={0}   max={250} color="var(--yellow)" />
          </div>

          {/* Doc tokens visual: highlight which ones survive */}
          <div className="label" style={{ marginTop: 28 }}>
            document · {docTokens.length} tokens
            {overflowing && (
              <span style={{ color: "var(--pink)", marginLeft: 12, textTransform: "none", letterSpacing: 0 }}>
                — {docDropped} tokens dropped from the start ⚠
              </span>
            )}
          </div>
          <div style={{
            padding: 14,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            fontSize: 12.5,
            lineHeight: 1.7,
            maxHeight: 240,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {docTokens.map((t, i) => {
              const dropped = i < docDropped;
              return (
                <span key={i} style={{
                  color: dropped ? "var(--ink-5)" : "var(--ink-2)",
                  background: dropped ? "transparent" : (i === docDropped ? "rgba(var(--pink-rgb), 0.18)" : "transparent"),
                  borderLeft: i === docDropped && !dropped ? "2px solid var(--pink)" : "none",
                  paddingLeft: i === docDropped && !dropped ? 4 : 0,
                  textDecoration: dropped ? "line-through" : "none",
                }}>{t}</span>
              );
            })}
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--ink-3)" }}>
              ↳ replace the document
            </summary>
            <textarea
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              rows={6}
              style={{ width: "100%", marginTop: 8, fontSize: 12, fontFamily: "var(--font-mono)" }}
            />
          </details>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="A finite scratch pad">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">context windows in the wild</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 12, color: "var(--ink-2)" }}>
              <li>GPT-4o · <strong className="num">128k</strong></li>
              <li>Claude Sonnet 4.5 · <strong className="num">200k</strong></li>
              <li>Gemini 2.5 Pro · <strong className="num">2M</strong></li>
              <li>Llama 4 · <strong className="num">10M</strong></li>
            </ul>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
              Bigger isn't free: latency, cost, and attention quality all degrade as you fill the window.
            </p>
          </div>
        }>
          <p>
            A model's <strong style={{ color: "var(--green)" }}>context window</strong> is the total
            number of tokens it can see at once — system prompt, full conversation, retrieved documents,
            and the response it's generating, all in the same buffer.
          </p>
          <p style={{ marginTop: 16 }}>
            Everything competes for the same space. If you ship a 50k-token document into a model with
            a 200k window, you have 150k left for the conversation, system prompt, and reply. When
            things don't fit, something gets cut — usually by truncating from the start of the
            conversation, but with RAG you'd shrink the retrieved chunks first.
          </p>
          <p style={{ marginTop: 16 }}>
            Cost scales with context too. At Claude Sonnet 4.5 pricing, sending 200k input tokens costs
            about <span className="num" style={{ color: "var(--yellow)" }}>$0.60</span> per call — every
            call. Context engineering matters.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`from anthropic import Anthropic
client = Anthropic()

# Count tokens before sending — avoid surprises
count = client.messages.count_tokens(
    model="claude-sonnet-4-5",
    system="You are a helpful assistant.",
    messages=[{"role": "user", "content": long_document}],
)
print(count.input_tokens, "/ 200000 tokens")

# If too big: chunk, summarize, or retrieve instead of stuffing
if count.input_tokens > 150_000:
    chunks = split_document(long_document, max_tokens=2000)
    relevant = retrieve_top_k(query, chunks, k=5)
    context = "\\n\\n".join(relevant)
else:
    context = long_document`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Crank context size to 100, then to 500. Watch the percent of document that survives.",
          "Pump 'conversation' up to 200. The doc gets squeezed even though context size didn't change — there's a fixed budget.",
          "Paste a much longer document into the editor. See exactly where the cut line falls.",
          "Note that we cut from the start (oldest content) — that's why long chats forget what was said early."
        ]} />
      </Section>
    </React.Fragment>
  );
}

function Slider({ label, v, setV, min, max, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>{label}</span>
        <span className="num" style={{ fontSize: 13, color }}>{v}</span>
      </div>
      <input
        type="range"
        min={min} max={max} value={v}
        onChange={(e) => setV(parseInt(e.target.value))}
        style={{
          width: "100%",
          accentColor: color,
        }}
      />
    </div>
  );
}

export default ContextWindowDemo;
