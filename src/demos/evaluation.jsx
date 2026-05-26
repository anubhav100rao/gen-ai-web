import React, { useEffect, useMemo, useRef, useState } from "react";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";
import { Code } from "../util.jsx";

const JUDGE_SCENARIOS = [
  {
    label: "Accurate Answer",
    text: "The capital of France is Paris. It is a beautiful city renowned for the Eiffel Tower and rich history.",
    scores: { helpfulness: 5, coherence: 5, factuality: 5, average: 5.0 },
    reason: "The model answers the prompt directly, with perfect grammar and completely accurate statements."
  },
  {
    label: "Inaccurate Answer",
    text: "The capital of France is London. Paris is actually a small town located in western Germany.",
    scores: { helpfulness: 2, coherence: 4, factuality: 1, average: 2.3 },
    reason: "The model has high coherence but completely failed factuality, falsely swapping France's capital and placing Paris in Germany."
  }
];

function EvaluationDemo() {
  const [metricTab, setMetricTab] = useState("em"); // 'em', 'pr', 'judge'

  // Exact Match States
  const emTarget = '{"status": "success", "data": {"user_id": 401}}';
  const emOutputMatch = '{"status": "success", "data": {"user_id": 401}}';
  const [emSelectedOutput, setEmSelectedOutput] = useState("match"); // 'match' or 'mismatch'

  // Precision & Recall States (Doc indices: 1 to 8)
  const groundTruth = useMemo(() => new Set([1, 3, 5]), []);
  const [retrievedDocs, setRetrievedDocs] = useState(new Set([1, 2, 5, 8]));

  // LLM-as-a-Judge States
  const [judgeIdx, setJudgeIdx] = useState(0);
  const [judgeRunning, setJudgeRunning] = useState(false);
  const [judgeComplete, setJudgeComplete] = useState(true);
  const judgeTimeoutRef = useRef(null);

  function clearJudgeTimer() {
    if (judgeTimeoutRef.current) {
      clearTimeout(judgeTimeoutRef.current);
      judgeTimeoutRef.current = null;
    }
  }

  useEffect(() => clearJudgeTimer, []);

  // Compute Precision and Recall
  const stats = useMemo(() => {
    const tp = [...retrievedDocs].filter(d => groundTruth.has(d));
    const precision = retrievedDocs.size > 0 ? tp.length / retrievedDocs.size : 0;
    const recall = groundTruth.size > 0 ? tp.length / groundTruth.size : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      truePositives: tp.length,
      precision,
      recall,
      f1
    };
  }, [retrievedDocs, groundTruth]);

  function toggleDoc(docId) {
    const next = new Set(retrievedDocs);
    if (next.has(docId)) next.delete(docId); else next.add(docId);
    setRetrievedDocs(next);
  }

  function runJudge() {
    clearJudgeTimer();
    setJudgeRunning(true);
    setJudgeComplete(false);
    judgeTimeoutRef.current = setTimeout(() => {
      setJudgeRunning(false);
      setJudgeComplete(true);
      judgeTimeoutRef.current = null;
    }, 1100);
  }

  const activeJudge = JUDGE_SCENARIOS[judgeIdx];

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Interactive Benchmarking & Metrics Arena">
        <Stage>
          {/* Main metric category selection */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
            <button onClick={() => setMetricTab("em")}
              style={{
                background: "transparent", border: "none",
                borderBottom: metricTab === "em" ? "2px solid var(--green)" : "2px solid transparent",
                color: metricTab === "em" ? "var(--green)" : "var(--ink-3)",
                padding: "10px 18px", cursor: "pointer", fontSize: 12.5, fontWeight: metricTab === "em" ? 600 : 400
              }}>
              Exact Match (EM)
            </button>
            <button onClick={() => setMetricTab("pr")}
              style={{
                background: "transparent", border: "none",
                borderBottom: metricTab === "pr" ? "2px solid var(--pink)" : "2px solid transparent",
                color: metricTab === "pr" ? "var(--pink)" : "var(--ink-3)",
                padding: "10px 18px", cursor: "pointer", fontSize: 12.5, fontWeight: metricTab === "pr" ? 600 : 400
              }}>
              Precision & Recall
            </button>
            <button onClick={() => setMetricTab("judge")}
              style={{
                background: "transparent", border: "none",
                borderBottom: metricTab === "judge" ? "2px solid var(--blue)" : "2px solid transparent",
                color: metricTab === "judge" ? "var(--blue)" : "var(--ink-3)",
                padding: "10px 18px", cursor: "pointer", fontSize: 12.5, fontWeight: metricTab === "judge" ? 600 : 400
              }}>
              LLM-as-a-Judge
            </button>
          </div>

          {/* EXACT MATCH SCREEN */}
          {metricTab === "em" && (
            <div>
              <span className="label" style={{ display: "block", marginBottom: 12 }}>Choose Candidate Model Answer</span>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button className={`btn btn--sm ${emSelectedOutput === "match" ? "btn--primary" : ""}`}
                  onClick={() => setEmSelectedOutput("match")}>
                  Exact Casing Match
                </button>
                <button className={`btn btn--sm ${emSelectedOutput === "mismatch" ? "btn--primary" : ""}`}
                  onClick={() => setEmSelectedOutput("mismatch")}
                  style={{ background: emSelectedOutput === "mismatch" ? "var(--pink)" : "transparent", borderColor: emSelectedOutput === "mismatch" ? "var(--pink)" : "var(--border)" }}>
                  Casing Shift Mismatch
                </button>
              </div>

              {/* Side by side comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                <div className="card" style={{ padding: 14, background: "var(--bg-2)" }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 6 }}>Target Ground Truth</div>
                  <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-1)" }}>{emTarget}</pre>
                </div>

                <div className="card" style={{
                  padding: 14,
                  background: emSelectedOutput === "match" ? "rgba(var(--green-rgb), 0.04)" : "rgba(var(--pink-rgb), 0.04)",
                  border: emSelectedOutput === "match" ? "1px solid var(--green)" : "1px solid var(--pink)",
                }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 6 }}>Generated Output</div>
                  <pre style={{
                    margin: 0,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: emSelectedOutput === "match" ? "var(--green)" : "var(--pink)",
                    whiteSpace: "pre-wrap"
                  }}>
                    {emSelectedOutput === "match" ? emOutputMatch : (
                      <>
                        {'{'}
                        <span style={{ background: "rgba(255, 95, 86, 0.2)", textDecoration: "underline" }}>"Status"</span>:{" "}
                        <span style={{ background: "rgba(255, 95, 86, 0.2)", textDecoration: "underline" }}>"Success"</span>,{" "}
                        <span style={{ background: "rgba(255, 95, 86, 0.2)", textDecoration: "underline" }}>"Data"</span>: {'{'}
                        <span style={{ background: "rgba(255, 95, 86, 0.2)", textDecoration: "underline" }}>"User_Id"</span>: 401{'}}'}
                      </>
                    )}
                  </pre>
                </div>
              </div>

              {/* Exact match metrics scorecard */}
              <div style={{ marginTop: 24, padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 4, textAlign: "center" }}>
                <span className="label">Strict Exact Match Score</span>
                <div className="num" style={{ fontSize: 44, fontWeight: 700, color: emSelectedOutput === "match" ? "var(--green)" : "var(--pink)", marginTop: 6 }}>
                  {emSelectedOutput === "match" ? "1.0 (MATCH)" : "0.0 (MISMATCH)"}
                </div>
                <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {emSelectedOutput === "match" ? (
                    "Every single character matches exactly. Strict string validation succeeded."
                  ) : (
                    "Warning: Exact Match fails on tiny JSON capitalization shifts, even though semantic meaning is identical!"
                  )}
                </p>
              </div>
            </div>
          )}

          {/* PRECISION & RECALL SCREEN */}
          {metricTab === "pr" && (
            <div>
              <div className="label">Toggle Retrieved Docs in Vector Database (Select to adjust stats)</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(id => {
                  const needed = groundTruth.has(id);
                  const selected = retrievedDocs.has(id);
                  return (
                    <button key={id}
                      className={`btn btn--sm`}
                      onClick={() => toggleDoc(id)}
                      style={{
                        background: selected ? (needed ? "rgba(var(--green-rgb), 0.16)" : "var(--bg-3)") : "transparent",
                        borderColor: selected ? (needed ? "var(--green)" : "var(--ink-4)") : "var(--border)",
                        color: selected ? "var(--ink-1)" : "var(--ink-4)",
                        textTransform: "none",
                        letterSpacing: 0,
                      }}>
                      Doc {id} {needed ? "⭐" : ""} {selected ? "✓" : ""}
                    </button>
                  );
                })}
              </div>

              {/* Diagrams & scores side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                {/* SVG Venn Diagram */}
                <div style={{
                  background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: 6,
                  height: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
                }}>
                  <svg viewBox="0 0 200 120" style={{ width: "100%", height: "100%" }}>
                    {/* Circle 1: Ground Truth */}
                    <circle cx="85" cy="60" r="42" fill="none" stroke="var(--green)" strokeWidth={1.5} />
                    <text x="50" y="28" fontSize={7} fill="var(--green)" fontFamily="var(--font-mono)">Ground Truth (Needed)</text>
                    
                    {/* Circle 2: Retrieved */}
                    <circle cx="115" cy="60" r="42" fill="none" stroke="var(--pink)" strokeWidth={1.5} />
                    <text x="115" y="28" fontSize={7} fill="var(--pink)" fontFamily="var(--font-mono)">Retrieved Chunks</text>

                    {/* True positives overlap markers */}
                    <text x="100" y="64" fontSize={8} textAnchor="middle" fill="var(--green)" fontFamily="var(--font-mono)">
                      TP: {stats.truePositives}
                    </text>
                  </svg>
                </div>

                {/* Statistics scoreboard */}
                <div style={{ display: "flex", flexDirection: "column", justifySelf: "stretch", gap: 10 }}>
                  <div className="card" style={{ padding: 12, background: "var(--bg-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>Precision (Hits / Retrieved)</span>
                    <span className="num" style={{ color: "var(--green)" }}>{(stats.precision * 100).toFixed(0)}%</span>
                  </div>
                  <div className="card" style={{ padding: 12, background: "var(--bg-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>Recall (Hits / Ground Truth)</span>
                    <span className="num" style={{ color: "var(--pink)" }}>{(stats.recall * 100).toFixed(0)}%</span>
                  </div>
                  <div className="card" style={{ padding: 12, background: "var(--bg-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13 }}>F1-Score (Balanced Mean)</span>
                    <span className="num" style={{ color: "var(--yellow)" }}>{(stats.f1 * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LLM AS A JUDGE SCREEN */}
          {metricTab === "judge" && (
            <div>
              <span className="label" style={{ display: "block", marginBottom: 12 }}>Select LLM Output to Evaluate</span>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {JUDGE_SCENARIOS.map((s, i) => (
                  <button key={i}
                    className={`btn btn--sm ${judgeIdx === i ? "btn--primary" : ""}`}
                    onClick={() => { clearJudgeTimer(); setJudgeRunning(false); setJudgeIdx(i); setJudgeComplete(true); }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Visual Evaluator Loop */}
              <div className="demo-judge-grid">
                <div>
                  <div className="label">Generated Output Text</div>
                  <div style={{
                    padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 4,
                    minHeight: 88, fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)"
                  }}>
                    "{activeJudge.text}"
                  </div>

                  {judgeComplete && (
                    <div className="card" style={{ padding: 14, background: "var(--bg-2)", border: "1px solid var(--border)", marginTop: 16 }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--blue)", fontWeight: 600, marginBottom: 6 }}>Evaluator Grader Feedback</div>
                      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
                        {activeJudge.reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Score panel */}
                <div>
                  <div className="label">Scorecard Breakdown</div>
                  {judgeRunning ? (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "var(--blue)", fontSize: 13 }}>
                      <span className="dot dot--pulse" /> Evaluator grading...
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {Object.entries(activeJudge.scores).map(([k, val]) => {
                        const isAverage = k === "average";
                        return (
                          <div key={k} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "6px 8px", background: isAverage ? "rgba(var(--blue-rgb), 0.08)" : "var(--bg-3)",
                            border: isAverage ? "1px solid var(--blue)" : "1px solid transparent",
                            borderRadius: 4,
                          }}>
                            <span style={{ fontSize: 12, textTransform: "capitalize", fontWeight: isAverage ? 600 : 400 }}>{k}</span>
                            <span className="num" style={{ fontSize: 13, color: "var(--blue)", fontWeight: 600 }}>
                              {val.toFixed(1)} {!isAverage && "/ 5.0"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Trigger */}
              <button className="btn btn--sm btn--primary" onClick={runJudge} disabled={judgeRunning} style={{ marginTop: 16 }}>
                ▶ Run Evaluator Judge
              </button>
            </div>
          )}
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="How We Evaluate Generative AI Systems">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">Production metrics</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
              <li><strong>ROUGE/BLEU:</strong> Syntactic N-gram overlap tests. Good for translation quality, poor for abstract meanings.</li>
              <li style={{ marginTop: 4 }}><strong>LLM-as-a-Judge:</strong> Leveraging highly advanced models (like Claude 3.5 Sonnet) with strict rubrics to evaluate complex quality components.</li>
            </ul>
          </div>
        }>
          <p>
            Evaluating traditional software is straightforward: writing assertion statements (e.g. <code>assert output == expected</code>). However, language models output unstructured natural text, rendering exact assertions nearly useless.
          </p>
          <p style={{ marginTop: 14 }}>
            For structured JSON outputs, <strong>Exact Match (EM)</strong> is frequently used. But as shown, EM is extremely fragile, failing on minor key capitalization shifts or extra whitespace padding despite the semantic data remaining identical.
          </p>
          <p style={{ marginTop: 14 }}>
            For RAG systems, we measure <strong>Retrieval Precision & Recall</strong>. Precision measures whether the system avoided pulling useless, distracting chunks (noise control). Recall measures whether the system pulled every chunk needed to answer the prompt (coverage control).
          </p>
          <p style={{ marginTop: 14 }}>
            For subjective prose, we use <strong>LLM-as-a-Judge</strong>. By prompting a highly intelligent frontier model with strict score rubrics and few-shot examples, we can reliably grade generated text on criteria like helpfulness, coherence, and safety at massive scale.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="LLM-as-a-judge prompt template in python">
        <Code>{`# Python snippet orchestrating a grading evaluator loop
from openai import OpenAI
client = OpenAI()

def evaluate_response(user_query, assistant_output):
    evaluator_prompt = (
        "You are an objective expert evaluator. Grade the assistant's answer based on standard criteria.\\n"
        "Criteria - Factuality:\\n"
        "Score 5: The answer is entirely factual and matches proven realities.\\n"
        "Score 1: The answer contains severe factual lies or logical swaps.\\n\\n"
        f"Query: {user_query}\\n"
        f"Answer: {assistant_output}\\n\\n"
        "Provide your score out of 5.0 in JSON format: {'factuality_score': X, 'reasoning': '...'}"
    )
    
    resp = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": evaluator_prompt}]
    )
    return resp.choices[0].message.content`}</Code>
      </Section>

      <Section eyebrow="experiments" title="Try these tests">
        <Experiments items={[
          "Select the 'Exact Match' tab. Note that 'Exact Casing Match' succeeds (1.0), but toggling 'Casing Shift Mismatch' crashes the score to 0.0 despite identical data content.",
          "Select the 'Precision & Recall' tab. Toggle off Doc 1, Doc 2, Doc 5, and Doc 8. Watch the overlap area in the Venn diagram shrink and statistics recalculate in real-time.",
          "Select the 'LLM-as-a-Judge' tab. Toggle to the 'Inaccurate Answer' case and click 'Run Evaluator Judge'. Observe how factuality drops to 1.0/5.0 while coherence remains a high 4.0/5.0."
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default EvaluationDemo;
