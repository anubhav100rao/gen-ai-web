import React, { useState, useMemo, useRef } from "react";
import { rng, Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

const VOCAB_LIST = [
  { word: "the",     logit: 5.5 },
  { word: "a",       logit: 4.8 },
  { word: "it",      logit: 4.2 },
  { word: "they",    logit: 3.9 },
  { word: "she",     logit: 3.5 },
  { word: "he",      logit: 3.1 },
  { word: "this",    logit: 2.5 },
  { word: "that",    logit: 1.8 },
  { word: "some",    logit: 1.0 },
  { word: "all",     logit: 0.2 },
];

function softmax(logits, T) {
  const t = Math.max(T, 0.01);
  const scaled = logits.map(l => l / t);
  const max = Math.max(...scaled);
  const exp = scaled.map(s => Math.exp(s - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(e => e / sum);
}

function SamplingDemo() {
  const [mode, setMode] = useState("all"); // 'greedy', 'top-k', 'top-p', 'all'
  const [topK, setTopK] = useState(4);
  const [topP, setTopP] = useState(0.8);
  const [temp, setTemp] = useState(0.7);
  const [history, setHistory] = useState([]);
  const [sampledWord, setSampledWord] = useState(null);
  const [seed, setSeed] = useState(42);
  const rngRef = useRef(rng(seed));

  // Compute final probabilities based on selected mode
  const distribution = useMemo(() => {
    // 1. Sort by raw logits
    const sorted = VOCAB_LIST.map((item, originalIdx) => ({
      ...item,
      originalIdx
    })).sort((a, b) => b.logit - a.logit);

    // Calculate probabilities at current temperature
    const rawProbs = softmax(sorted.map(x => x.logit), temp);
    
    // Build running states
    let runningSum = 0;
    
    return sorted.map((item, rank) => {
      const pRaw = rawProbs[rank];
      let kept = true;

      if (mode === "greedy") {
        kept = (rank === 0);
      } else if (mode === "top-k") {
        kept = (rank < topK);
      } else if (mode === "top-p") {
        kept = (runningSum < topP || rank === 0);
      }

      runningSum += pRaw;

      return {
        ...item,
        rank,
        rawProb: pRaw,
        runningSumBefore: runningSum - pRaw,
        runningSumAfter: runningSum,
        kept
      };
    });
  }, [mode, topK, topP, temp]);

  // Compute renormalized probabilities among the kept elements
  const finalProbs = useMemo(() => {
    const logits = distribution.map(x => x.kept ? x.logit : -Infinity);
    const probs = softmax(logits, temp);
    return distribution.map((item, i) => ({
      ...item,
      finalProb: item.kept ? probs[i] : 0
    }));
  }, [distribution, temp]);

  function drawSample() {
    const r = rngRef.current();
    let sum = 0;
    for (const item of finalProbs) {
      sum += item.finalProb;
      if (r <= sum && item.kept) {
        setSampledWord(item.word);
        setHistory(prev => [item.word, ...prev].slice(0, 15));
        return;
      }
    }
    // Fallback
    const fallback = finalProbs.find(x => x.kept) || finalProbs[0];
    setSampledWord(fallback.word);
    setHistory(prev => [fallback.word, ...prev].slice(0, 15));
  }

  function reset(nextSeed = seed) {
    setHistory([]);
    setSampledWord(null);
    rngRef.current = rng(nextSeed);
  }

  function updateSeed(value) {
    const nextSeed = parseInt(value, 10) || 42;
    setSeed(nextSeed);
    reset(nextSeed);
  }

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Vocabulary Sampling & Slicing">
        <Stage>
          {/* Mode Selector Toggles */}
          <div style={{ marginBottom: 24 }}>
            <span className="label" style={{ display: "block", marginBottom: 8 }}>Sampling Mode</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className={`btn btn--sm ${mode === "all" ? "btn--primary" : ""}`} onClick={() => setMode("all")}>
                Full Softmax (All Words)
              </button>
              <button className={`btn btn--sm ${mode === "greedy" ? "btn--primary" : ""}`} onClick={() => setMode("greedy")}>
                Greedy Decoding (Top 1)
              </button>
              <button className={`btn btn--sm ${mode === "top-k" ? "btn--primary" : ""}`} onClick={() => setMode("top-k")}>
                Top-K Sampling
              </button>
              <button className={`btn btn--sm ${mode === "top-p" ? "btn--primary" : ""}`} onClick={() => setMode("top-p")}>
                Top-P (Nucleus) Sampling
              </button>
            </div>
          </div>

          {/* Configuration Sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 28 }}>
            <div style={{ opacity: mode === "greedy" ? 0.35 : 1, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="label" style={{ marginBottom: 0 }}>Temperature (Logit Contrast)</span>
                <span className="num" style={{ color: "var(--green)", fontSize: 13 }}>{temp.toFixed(2)}</span>
              </div>
              <input type="range" min={0.05} max={2.0} step={0.05} value={temp}
                disabled={mode === "greedy"}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--green)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-4)", marginTop: 4 }}>
                <span>0.05 · Peak</span><span>1.0 · Norm</span><span>2.0 · Flat</span>
              </div>
            </div>

            <div style={{ opacity: mode === "top-k" ? 1 : 0.35, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="label" style={{ marginBottom: 0 }}>Top-K Count</span>
                <span className="num" style={{ color: "var(--yellow)", fontSize: 13 }}>{topK}</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={topK}
                disabled={mode !== "top-k"}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--yellow)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-4)", marginTop: 4 }}>
                <span>k=1 · Greedy</span><span>k=10 · All</span>
              </div>
            </div>

            <div style={{ opacity: mode === "top-p" ? 1 : 0.35, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="label" style={{ marginBottom: 0 }}>Top-P Percent</span>
                <span className="num" style={{ color: "var(--pink)", fontSize: 13 }}>{(topP * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min={0.05} max={1.0} step={0.05} value={topP}
                disabled={mode !== "top-p"}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--pink)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-4)", marginTop: 4 }}>
                <span>5% · Tight</span><span>100% · All</span>
              </div>
            </div>
          </div>

          {/* Ranked vertical/horizontal bars of vocabulary */}
          <div className="label" style={{ marginBottom: 12 }}>Ranked Vocabulary Probability Graph</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
            {finalProbs.map((item, idx) => {
              const active = item.kept;
              const probPercent = item.finalProb * 100;
              const rawProbPercent = item.rawProb * 100;
              const isSampled = item.word === sampledWord;

              return (
                <div key={item.word} style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr 150px 70px",
                  alignItems: "center",
                  gap: 12,
                  opacity: active ? 1 : 0.22,
                  transition: "all 0.25s var(--ease)",
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: isSampled ? "rgba(var(--yellow-rgb), 0.08)" : "transparent",
                  border: isSampled ? "1px dashed var(--yellow)" : "1px solid transparent",
                }}>
                  {/* Word item */}
                  <span style={{
                    fontSize: 13,
                    fontFamily: "var(--font-mono)",
                    color: isSampled ? "var(--yellow)" : "var(--ink-2)",
                    textAlign: "right",
                    fontWeight: isSampled ? 700 : 400,
                  }}>
                    {isSampled && "👉 "} "{item.word}"
                  </span>

                  {/* Histogram Bar */}
                  <div style={{ position: "relative", height: 16, background: "var(--bg-2)", borderRadius: 3 }}>
                    {/* Raw original prob */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: `${rawProbPercent}%`,
                      background: active ? "var(--green)" : "#3a3a3a",
                      opacity: 0.6,
                      borderRadius: 3,
                    }} />
                    {/* Renormalized prob bar overlay */}
                    {active && probPercent !== rawProbPercent && (
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${probPercent}%`,
                        background: "var(--green)",
                        boxShadow: "0 0 8px rgba(var(--green-rgb), 0.4)",
                        borderRadius: 3,
                        transition: "width 0.2s var(--ease)",
                      }} />
                    )}
                  </div>

                  {/* Cumulative Sum and Status Info */}
                  <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", display: "flex", gap: 10 }}>
                    <span>Cum: {(item.runningSumAfter * 100).toFixed(0)}%</span>
                    {mode === "top-k" && idx === topK - 1 && <span style={{ color: "var(--yellow)" }}>k-cutoff</span>}
                    {mode === "top-p" && item.runningSumBefore < topP && item.runningSumAfter >= topP && (
                      <span style={{ color: "var(--pink)" }}>p-boundary</span>
                    )}
                  </span>

                  {/* Final Renormalized Probability */}
                  <span className="num" style={{ fontSize: 12, textAlign: "right", color: active ? "var(--ink-1)" : "var(--ink-4)", fontWeight: active ? 600 : 400 }}>
                    {probPercent.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Actions & Sample History */}
          <div style={{ display: "flex", gap: 12, marginTop: 28, alignItems: "center" }}>
            <button className="btn btn--primary" onClick={drawSample}>
              Draw Random Sample
            </button>
            <button className="btn btn--ghost" onClick={reset}>
              Reset History
            </button>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-4)" }}>
              Seed:{" "}
              <input type="number" value={seed} onChange={(e) => updateSeed(e.target.value)}
                style={{ width: 55, padding: "2px 4px", fontSize: 11, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 3 }} />
            </span>
          </div>

          <div className="label" style={{ marginTop: 24 }}>History of drawn tokens</div>
          <div style={{
            padding: 12,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            minHeight: 44,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}>
            {history.length === 0 && <span className="dim" style={{ fontSize: 12 }}>No draws yet. Click "Draw Random Sample" above.</span>}
            {history.map((h, i) => (
              <span key={i} className="tok" style={{
                background: i === 0 ? "rgba(var(--yellow-rgb), 0.12)" : "rgba(var(--green-rgb), 0.08)",
                color: i === 0 ? "var(--yellow)" : "var(--green)",
                border: i === 0 ? "1px solid rgba(var(--yellow-rgb), 0.3)" : "1px solid rgba(var(--green-rgb), 0.2)",
                fontSize: 12,
                fontWeight: i === 0 ? 600 : 400,
              }}>
                {h}
              </span>
            ))}
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Filtering the Vocabulary Tail">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">Comparison table</div>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", marginTop: 8, color: "var(--ink-2)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "4px 0" }}>Mode</th>
                  <th>Speed</th>
                  <th>Diversity</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 0", fontWeight: 600 }}>Greedy</td>
                  <td>Fast</td>
                  <td style={{ color: "var(--red)" }}>None</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 0", fontWeight: 600 }}>Top-K</td>
                  <td>Fast</td>
                  <td>Medium</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", fontWeight: 600 }}>Top-P</td>
                  <td>Dynamic</td>
                  <td style={{ color: "var(--green)" }}>High</td>
                </tr>
              </tbody>
            </table>
          </div>
        }>
          <p>
            When an LLM runs inference, the final layer outputs a probability score for every word in its catalog (often 32,000+ items). Sampling algorithms truncate or filter this enormous list so that we avoid drawing nonsensical or completely incoherent tokens.
          </p>
          <p style={{ marginTop: 14 }}>
            <strong>Greedy Decoding</strong> simply picks the token at rank 1 every time. It is deterministic and fast, but often gets caught in repetitive loops because it never explores alternate branches.
          </p>
          <p style={{ marginTop: 14 }}>
            <strong>Top-K Sampling</strong> restricts the pool to the top <code>k</code> items. Any word below rank <code>k</code> is immediately zeroed out, shielding the model from making highly bizarre word choices.
          </p>
          <p style={{ marginTop: 14 }}>
            <strong>Top-P (Nucleus) Sampling</strong> dynamically sizes the pool. It keeps the smallest set of words whose combined probabilities add up to <code>p</code>. In highly certain scenarios, this pool might contain only 1 or 2 words. In highly creative or ambiguous scenarios, it expands to 20+ words.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="Sampling implementation in Python">
        <Code>{`import torch

def sample_nucleus(logits, top_p=0.9, temp=1.0):
    # Scale logits by temperature
    logits = logits / max(temp, 0.01)
    
    # Sort logits descending
    sorted_logits, sorted_indices = torch.sort(logits, descending=True)
    sorted_probs = torch.softmax(sorted_logits, dim=-1)
    
    # Calculate cumulative probabilities
    cumulative_probs = torch.cumsum(sorted_probs, dim=-1)
    
    # Remove tokens that exceed the cumulative top_p threshold
    sorted_indices_to_remove = cumulative_probs > top_p
    # Shift indices to keep the first token exceeding the threshold
    sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
    sorted_indices_to_remove[..., 0] = 0
    
    # Set logits of removed tokens to negative infinity
    indices_to_remove = sorted_indices_to_remove.scatter(0, sorted_indices, sorted_indices_to_remove)
    logits[indices_to_remove] = -float('Inf')
    
    # Softmax and sample
    probs = torch.softmax(logits, dim=-1)
    return torch.multinomial(probs, 1).item()`}</Code>
      </Section>

      <Section eyebrow="experiments" title="Try these tests">
        <Experiments items={[
          "Select 'Greedy Decoding'. Hit 'Draw Random Sample' 10 times. Every draw will be the word 'the'. No variety.",
          "Select 'Top-K Sampling' with k=3. Notice that 'she', 'he', 'this', etc. are completely excluded, leaving only 'the', 'a', and 'it' active.",
          "Switch to 'Top-P Sampling' with P = 60%. Observe how 'the' (32%) and 'a' (19%) sum to 51%. The third word 'it' (12%) takes the sum to 63%, exceeding the 60% boundary, so it is the last active candidate. Words 4-10 are excluded.",
          "Crank Temperature to 1.8 in Full Softmax mode. Watch the raw green bars flatten. Draw samples and observe how even the lower-ranked words like 'all' get drawn frequently."
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default SamplingDemo;
