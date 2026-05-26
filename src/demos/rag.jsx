import React, { useState, useEffect } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// RAG pipeline — retrieve, augment, generate
// ============================================================

const RAG_KB = [
  { id: 1, text: "The company's refund policy allows returns within 30 days of purchase, provided the item is unused and in original packaging.", topic: "refunds" },
  { id: 2, text: "Refunds are processed within 5-7 business days after the returned item is received and inspected.", topic: "refunds" },
  { id: 3, text: "Defective items can be returned at any time within the 1-year warranty period for a full refund or replacement.", topic: "refunds" },
  { id: 4, text: "International shipping takes 7-14 business days. Express is available at checkout for an additional fee.", topic: "shipping" },
  { id: 5, text: "Orders ship from our warehouse in Memphis, Tennessee. Domestic orders typically arrive in 3-5 business days.", topic: "shipping" },
  { id: 6, text: "Customer support is available 9am-6pm CT, Monday through Friday, at support@example.com.", topic: "support" },
];

const RAG_SCENARIOS = [
  {
    label: "refund question",
    q: "Can I return something I bought 2 weeks ago if I haven't opened it?",
    retrieved: [1, 2, 3],
    answer: "Yes — our return policy allows returns within 30 days of purchase as long as the item is unused and in original packaging. Since it's been 2 weeks and the item is unopened, you're well within the window. Refunds are processed within 5-7 business days of us receiving the return.",
  },
  {
    label: "shipping question",
    q: "How long will my order to Germany take?",
    retrieved: [4, 5],
    answer: "International orders typically arrive in 7-14 business days. Express shipping is available at checkout if you need it faster — that option appears at the payment step.",
  },
  {
    label: "off-topic question",
    q: "What's the meaning of life?",
    retrieved: [],
    answer: "I can only answer questions about our products, orders, and policies. For that one, I'd suggest a philosophy class — or 42.",
  },
];

function RAGDemo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const scenario = RAG_SCENARIOS[scenarioIdx];
  const retrievedDocs = scenario.retrieved.map(id => RAG_KB.find(c => c.id === id));

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (step < 4) setStep(step + 1);
      else setPlaying(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [playing, step]);

  function reset() {
    setStep(0);
    setPlaying(false);
  }
  function play() {
    setStep(0);
    setTimeout(() => setPlaying(true), 50);
  }

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Click through the pipeline">
        <Stage>
          {/* Scenario picker */}
          <div className="label">pick a question</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {RAG_SCENARIOS.map((s, i) => (
              <button key={i}
                className={`btn btn--sm ${i === scenarioIdx ? "btn--primary" : ""}`}
                onClick={() => { setScenarioIdx(i); reset(); }}
              >{s.label}</button>
            ))}
          </div>

          {/* Pipeline diagram */}
          <PipelineDiagram step={step} setStep={setStep} hasRetrieval={scenario.retrieved.length > 0} />

          {/* Player controls */}
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn btn--sm btn--ghost" onClick={reset}>↺ reset</button>
            <button className="btn btn--sm" disabled={step === 0} onClick={() => setStep(step - 1)}>← step</button>
            <button className="btn btn--sm" disabled={step >= 4} onClick={() => setStep(step + 1)}>step →</button>
            <button className="btn btn--sm btn--primary" onClick={play}>▶ play all</button>
          </div>

          {/* Step content */}
          <div style={{ marginTop: 32 }}>
            <StepContent step={step} scenario={scenario} retrievedDocs={retrievedDocs} />
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Give the model the right context, then ask">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">why not fine-tune</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
              Fine-tuning bakes knowledge into the model — slow to update, hard to attribute, and the
              model can still hallucinate. RAG keeps your knowledge in a database you control,
              swappable per query, with citations built in. Use both when you need style + facts.
            </p>
          </div>
        }>
          <p>
            <strong style={{ color: "var(--green)" }}>Retrieval-Augmented Generation</strong> is the
            standard pattern for grounding an LLM in your own data. The model itself doesn't change —
            you change what you put in its context window.
          </p>
          <p style={{ marginTop: 16 }}>
            The four steps: <strong>embed</strong> the query into a vector, <strong>retrieve</strong>{" "}
            the top-k most similar chunks from a vector DB, <strong>augment</strong> the prompt by
            stuffing those chunks alongside the question, and <strong>generate</strong> a grounded
            answer that the model can cite.
          </p>
          <p style={{ marginTop: 16 }}>
            The hard part isn't the LLM — it's everything around it. Chunking strategy, retrieval quality,
            handling no-result cases, citation formatting, query rewriting, reranking, evaluation. RAG
            is 90% data engineering and 10% prompting.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`from anthropic import Anthropic
import chromadb

client = Anthropic()
db = chromadb.PersistentClient("./kb").get_collection("docs")

SYSTEM = """You are a customer support assistant. Answer only using the
provided context. If the context doesn't contain the answer, say you
don't know. Cite which doc(s) you used: [doc-1], [doc-3], etc."""

def answer(question: str) -> str:
    # 1. Retrieve top-k chunks
    results = db.query(query_texts=[question], n_results=3)
    chunks = results["documents"][0]
    ids    = results["ids"][0]

    # 2. Augment the prompt
    context = "\\n".join(f"[doc-{i}] {c}" for i, c in zip(ids, chunks))
    user_msg = f"Context:\\n{context}\\n\\nQuestion: {question}"

    # 3. Generate
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        system=SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    return resp.content[0].text`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Run the 'off-topic question'. The retrieval step finds nothing relevant — and the generated answer correctly refuses. RAG handles 'I don't know' gracefully when prompted to.",
          "On the refund question, click into the 'augment' step. See exactly how retrieved chunks get formatted into the model's prompt — that's the part most engineers underestimate.",
          "Notice the generated answer cites specific facts ('30 days', '5-7 business days') that came from retrieval, not from the model's training data.",
          "Real RAG pipelines often have query-rewriting (LLM rephrases the question), reranking (cross-encoder reorders top-50), and citation extraction (model returns which chunk supported each claim).",
        ]} />
      </Section>
    </React.Fragment>
  );
}

// ============================================================
// Pipeline diagram (4 stages)
// ============================================================
const STAGES = [
  { id: 0, label: "1. query",     icon: "?", color: "var(--blue)" },
  { id: 1, label: "2. embed",     icon: "→", color: "var(--violet)" },
  { id: 2, label: "3. retrieve",  icon: "⌕", color: "var(--pink)" },
  { id: 3, label: "4. augment",   icon: "+", color: "var(--yellow)" },
  { id: 4, label: "5. generate",  icon: "★", color: "var(--green)" },
];

function PipelineDiagram({ step, setStep, hasRetrieval }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "stretch",
      gap: 0,
      width: "100%",
    }}>
      {STAGES.map((s, i) => {
        const active = i === step;
        const reached = i <= step;
        const dim = !hasRetrieval && (i === 2 || i === 3) ? 0.5 : 1;
        return (
          <React.Fragment key={s.id}>
            <button
              onClick={() => setStep(i)}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                background: active ? s.color : "var(--bg-2)",
                color: active ? "var(--bg)" : (reached ? "var(--ink-1)" : "var(--ink-4)"),
                border: `1px solid ${active ? s.color : "var(--border)"}`,
                borderRadius: 4,
                padding: "16px 8px",
                cursor: "pointer",
                opacity: dim,
                fontFamily: "var(--font-mono)",
                transition: "all 0.15s var(--ease)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 999,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? "rgba(0,0,0,0.15)" : (reached ? s.color : "var(--bg-3)"),
                color: active ? "var(--bg)" : (reached ? "var(--bg)" : "var(--ink-4)"),
                fontSize: 16, fontWeight: 700,
              }}>{s.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{s.label}</span>
            </button>
            {i < STAGES.length - 1 && (
              <div style={{
                alignSelf: "center",
                padding: "0 6px",
                color: reached ? s.color : "var(--ink-5)",
                flexShrink: 0,
              }}>→</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepContent({ step, scenario, retrievedDocs }) {
  switch (step) {
    case 0:
      return (
        <DataPanel title="User asks">
          <div style={{ fontSize: 18, fontStyle: "italic", color: "var(--blue)", padding: 8 }}>
            "{scenario.q}"
          </div>
        </DataPanel>
      );
    case 1:
      return (
        <DataPanel title="Embedding (1536-dim vector, truncated)">
          <code style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.7, display: "block" }}>
            [0.0142, -0.0833, 0.1024, 0.0091, -0.0451, 0.0772, -0.0028, 0.1198,
            <br/>&nbsp; 0.0034, -0.0926, 0.0613, 0.0245, -0.1107, 0.0089, 0.0517, -0.0364,
            <br/>&nbsp; ... <span style={{ color: "var(--ink-4)" }}>(1520 more numbers)</span> ...]
          </code>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            The query is now a vector. Same model that embedded the knowledge base, so they share a coordinate system.
          </p>
        </DataPanel>
      );
    case 2:
      return (
        <DataPanel title={`Top-${retrievedDocs.length} retrieved from vector DB`}>
          {retrievedDocs.length === 0 ? (
            <div style={{ padding: 12, color: "var(--pink)", fontSize: 13 }}>
              ⚠ no chunks scored above the similarity threshold. The model will be told there's no relevant context.
            </div>
          ) : retrievedDocs.map((d, i) => (
            <div key={d.id} style={{
              padding: 12, marginBottom: 8,
              background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 4,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-4)", marginBottom: 4 }}>
                <span>doc-{d.id} · {d.topic}</span>
                <span className="num" style={{ color: "var(--pink)" }}>
                  similarity {(0.92 - i * 0.06).toFixed(3)}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{d.text}</div>
            </div>
          ))}
        </DataPanel>
      );
    case 3:
      const ctxBlock = retrievedDocs.map(d => `[doc-${d.id}] ${d.text}`).join("\n");
      return (
        <DataPanel title="Augmented prompt sent to the model">
          <pre style={{
            margin: 0, fontSize: 12, lineHeight: 1.6,
            color: "var(--ink-2)", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
{`<system>
You are a customer support assistant. Answer only using
the provided context. If the context doesn't contain the
answer, say you don't know. Cite which doc(s) you used.
</system>

<user>
Context:
`}<span style={{ color: "var(--yellow)" }}>{ctxBlock || "(none — no relevant docs found)"}</span>{`

Question: `}<span style={{ color: "var(--blue)" }}>{scenario.q}</span>{`
</user>`}
          </pre>
        </DataPanel>
      );
    case 4:
      return (
        <DataPanel title="Model output">
          <div style={{
            padding: 14, background: "rgba(var(--green-rgb), 0.05)",
            border: "1px solid rgba(var(--green-rgb), 0.2)", borderRadius: 4,
            fontSize: 14, color: "var(--ink-1)", lineHeight: 1.6,
          }}>
            {scenario.answer}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12, fontStyle: "italic" }}>
            The model only uses facts from the retrieved chunks. No hallucination, no
            making up policy numbers, and a graceful refusal when context is missing.
          </p>
        </DataPanel>
      );
    default:
      return null;
  }
}

function DataPanel({ title, children }) {
  return (
    <div>
      <div className="label">{title}</div>
      <div className="card" style={{ background: "var(--bg-2)", padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

export default RAGDemo;
