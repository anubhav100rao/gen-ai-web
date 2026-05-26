import React, { useState } from "react";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";
import { Code } from "../util.jsx";

const FAILURES = [
  {
    id: "wrong-chunk",
    title: "1. Wrong Chunk Retrieved",
    errorStage: "retrieval",
    query: "How do I fix a broken leaking copper pipe in my bathroom?",
    retrieved: '{\n  "document_id": "doc-90412",\n  "content": "Junction copper conduits are engineered for high-pressure manufacturing flow indices. Ensure sealant is applied in 300C environments.",\n  "cosine_similarity": 0.81\n}',
    output: "To fix the leaking pipe, you must heat the copper conduit to 300 degrees Celsius in an industrial chamber and apply specialized commercial high-pressure sealants.",
    diagnosis: "The semantic vector embedder matched corporate manufacturing jargon (high-pressure conduits) instead of standard household plumbing repair manuals because of similar vocabulary terms.",
    fix: "Implement a Cross-Encoder Reranking layer (e.g. Cohere Rerank) to double-check search results, or introduce structured metadata filtering such as category = 'household_plumbing'."
  },
  {
    id: "missed-info",
    title: "2. Relevant Chunk Missed",
    errorStage: "embedder",
    query: "What is the new office Wi-Fi password for guests?",
    retrieved: '{\n  "results": [],\n  "message": "No vector dimensions exceeded the threshold of 0.70 similarity"\n}',
    output: "I apologize, but I do not have access to the office guest Wi-Fi password in my context memory. Please check standard onboarding documents.",
    diagnosis: "The target information was never ingested into the Vector Database (or chunk size was too large, causing the keyword to get lost in a large document block).",
    fix: "Validate document ingestion pipelines, check for missing file formats, or reduce text chunking size down to smaller, dense sentence blocks."
  },
  {
    id: "stale-doc",
    title: "3. Stale / Outdated Data",
    errorStage: "augmentation",
    query: "How much does the Premium SaaS subscription cost per month?",
    retrieved: '{\n  "document_id": "pricing_sheet_2023.txt",\n  "content": "SaaS Premium subscription rate is $10 per month, charged annually.",\n  "date": "2023-04-12"\n}',
    output: "The Premium SaaS subscription rate costs $10 per month, billed annually.",
    diagnosis: "The retriever pulled out-of-date pricing sheets because semantic search does not inherently prioritize date/recency without mathematical weights.",
    fix: "Apply a hybrid metadata filter to prioritize documents where date is recent (e.g. date >= '2026'), or implement a recency decay multiplier on vector search scores."
  },
  {
    id: "conflicting",
    title: "4. Conflicting Sources",
    errorStage: "llm",
    query: "Can dogs safely eat grapes?",
    retrieved: '[\n  {\n    "source": "healthy_dog_tips.txt",\n    "content": "Grapes are fine for dogs in small quantities as a treat."\n  },\n  {\n    "source": "veterinary_toxicology.txt",\n    "content": "Grapes are highly nephrotoxic to canines. Even a single grape can cause acute kidney failure in dogs."\n  }\n]',
    output: "Yes, dogs can eat grapes in small quantities, although some sources advise caution as they can cause kidney issues in sensitive animals.",
    diagnosis: "The context prompt contained contradictory information from two different articles, causing the LLM to deliver a highly dangerous, middle-ground answer.",
    fix: "Enhance system prompt safety policies: instruct the LLM to default strictly to conservative safety warnings when source documents contradict each other."
  },
  {
    id: "hallucination",
    title: "5. Context Ignored (Hallucination)",
    errorStage: "llm",
    query: "What was our company's Q1 net revenue today?",
    retrieved: '{\n  "document_id": "q1_finance_recap.csv",\n  "content": "Q1 2026 corporate net revenue total sits at $4.2 Million."\n}',
    output: "Our company's Q1 net revenue was $12.5 Million.",
    diagnosis: "The LLM hallucinated, preferring its pre-trained weights/parametric memory over the retrieved numbers supplied in the prompt.",
    fix: "Strengthen the system prompt grounding rules: 'You are a factual assistant. Answer ONLY using the retrieved context. If the answer is not in the context, state that you do not know.'"
  }
];

function RAGFailuresDemo() {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const active = FAILURES[selectedIdx];

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Interactive RAG Diagnostics Dashboard">
        <Stage padding={0}>
          <div className="demo-two-column">
            {/* Main Interactive Flow */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column", justifySelf: "stretch" }}>
              <div className="label">Diagnostic Failure Cases</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {FAILURES.map((f, i) => (
                  <button key={f.id}
                    className={`btn btn--sm ${selectedIdx === i ? "btn--primary" : ""}`}
                    onClick={() => setSelectedIdx(i)}>
                    {f.title}
                  </button>
                ))}
              </div>

              {/* RAG pipeline map layout */}
              <div className="label">RAG Pipeline Flow Map</div>
              <div className="demo-pipeline-grid">
                <PipelineNode label="1. Query" active={active.errorStage === "query"} />
                <PipelineNode label="2. Embed" active={active.errorStage === "embedder"} />
                <PipelineNode label="3. Retrieve" active={active.errorStage === "retrieval"} />
                <PipelineNode label="4. Augment" active={active.errorStage === "augmentation"} />
                <PipelineNode label="5. Generate" active={active.errorStage === "llm"} />
              </div>

              {/* Details card containing step logs */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Query Bubble */}
                <div style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12.5 }}>
                  <strong style={{ color: "var(--ink-4)" }}>User Prompt:</strong> "{active.query}"
                </div>

                {/* Retrieved Context JSON */}
                <div style={{ padding: 10, background: "rgba(var(--pink-rgb), 0.05)", border: "1px dashed var(--pink)", borderRadius: 4, fontSize: 11.5 }}>
                  <div style={{ fontWeight: 600, color: "var(--pink)", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>Retrieved Context JSON</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{active.retrieved}</pre>
                </div>

                {/* LLM Response */}
                <div style={{
                  padding: 10,
                  background: "rgba(var(--red-rgb), 0.05)",
                  border: "1px solid var(--red)",
                  borderRadius: 4,
                  fontSize: 12.5,
                  boxShadow: "0 0 10px rgba(var(--red-rgb), 0.1)"
                }}>
                  <div style={{ fontWeight: 600, color: "var(--red)", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>❌ Faulty LLM output</div>
                  "{active.output}"
                </div>
              </div>
            </div>

            {/* Diagnostics & Repair Panel */}
            <div className="demo-sidebar">
              <div>
                <span className="chip chip--red" style={{ background: "rgba(var(--red-rgb), 0.12)", color: "var(--red)" }}>pipeline alert</span>
                <h3 className="h-3" style={{ marginTop: 8 }}>Bug Diagnosis</h3>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>
                  {active.diagnosis}
                </p>
              </div>

              <hr className="divider" style={{ margin: 0 }} />

              <div>
                <span className="chip chip--green" style={{ background: "rgba(var(--green-rgb), 0.12)", color: "var(--green)" }}>engineer cure</span>
                <h3 className="h-3" style={{ marginTop: 8 }}>Production Fix</h3>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>
                  {active.fix}
                </p>
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Why Search-Augmented systems Fail">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">The RAG trilemma</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
              <li><strong>1. Ingestion:</strong> Missed metadata, poor document parsing, or bad chunk split thresholds.</li>
              <li style={{ marginTop: 4 }}><strong>2. Retrieval:</strong> Semantic matching fails to handle negation or specific numbers.</li>
              <li style={{ marginTop: 4 }}><strong>3. Generation:</strong> Model hallucinates, ignores bounds, or trusts pre-trained bias.</li>
            </ul>
          </div>
        }>
          <p>
            Retrieval-Augmented Generation (RAG) is the industry standard for grounding LLMs on custom, privately held documents. However, constructing a production-grade RAG system is highly challenging.
          </p>
          <p style={{ marginTop: 14 }}>
            RAG systems operate on the assumption that semantic similarity equals relevance. But semantic models frequently struggle with specific negation (e.g. "Do not eat" vs. "Eat"), recency criteria, or specific numbers, matching unrelated high-similarity documents while missing the exact target document.
          </p>
          <p style={{ marginTop: 14 }}>
            Furthermore, even when retrieval is perfect, the generation phase can break if the context contains contradictions or if the LLM's parametric memory overrides the facts loaded in the prompt window. Production RAG engineering requires robust reranking, prompt constraints, and strict data curation to achieve safety.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="RAG query filters in python">
        <Code>{`# Example of metadata and date-decay filtering on a vector retrieval request
from pinecone import Pinecone

pc = Pinecone(api_key="pinecone-api")
index = pc.Index("corporate-docs")

# Hybrid query combining semantic search with strict filters to prevent RAG failures
result = index.query(
    vector=[0.12, -0.45, 0.93], # Prompt vector embedding
    top_k=3,
    filter={
        "category": {"$eq": "pricing_sheets"},
        "year": {"$gte": 2026} # Prevents stale document retrieval failures
    },
    include_metadata=True
)`}</Code>
      </Section>

      <Section eyebrow="experiments" title="Try these tests">
        <Experiments items={[
          "Select '1. Wrong Chunk Retrieved'. Note the highlighted 'Retrieve' node in red. See how plumbing prompts matched manufacturing documents.",
          "Select '3. Stale Data'. Observe the extracted pricing sheet date is 2023. Notice the LLM happily outputs the stale price.",
          "Select '4. Conflicting Sources'. Examine the two contradictory sources (A vs B) in the JSON payload, causing the model to provide a dangerously compromised answer.",
          "Select '5. Context Ignored'. Observe the retrieved document clearly says '$4.2 Million', but the model hallucinates '$12.5 Million', ignoring the context."
        ]} />
      </Section>
    </React.Fragment>
  );
}

function PipelineNode({ label, active }) {
  return (
    <div style={{
      padding: "8px 4px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: "var(--font-mono)",
      background: active ? "var(--red)" : "var(--bg-3)",
      color: active ? "white" : "var(--ink-3)",
      boxShadow: active ? "0 0 10px rgba(var(--red-rgb), 0.4)" : "none",
      border: active ? "1.5px solid var(--red)" : "1.5px solid var(--border)",
      transition: "all 0.25s var(--ease)",
    }}>
      {label}
    </div>
  );
}

export default RAGFailuresDemo;
