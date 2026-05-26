import React, { useState, useMemo, useRef } from "react";
import { rng, Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// Simulated dataset of vocabulary distributions for different prompt contexts
const SCENARIOS = [
  {
    prompt: "The AI agent decided to call the",
    vocab: [
      { tok: "database",    logit: 5.8 },
      { tok: "calculator",  logit: 5.2 },
      { tok: "user",        logit: 4.5 },
      { tok: "API",         logit: 4.1 },
      { tok: "weather",     logit: 3.6 },
      { tok: "doctor",      logit: 2.1 },
      { tok: "pizza",       logit: -0.5 },
      { tok: "banana",      logit: -1.8 },
    ]
  },
  {
    prompt: "Deep learning models are trained on",
    vocab: [
      { tok: "GPUs",         logit: 6.1 },
      { tok: "data",         logit: 5.5 },
      { tok: "internet",     logit: 4.8 },
      { tok: "text",         logit: 4.2 },
      { tok: "matrices",     logit: 3.3 },
      { tok: "coffee",       logit: 1.2 },
      { tok: "cats",         logit: -0.2 },
      { tok: "yesterday",    logit: -1.9 },
    ]
  },
  {
    prompt: "To solve this hard puzzle, we should",
    vocab: [
      { tok: "reason",       logit: 5.9 },
      { tok: "think",        logit: 5.4 },
      { tok: "backtrack",    logit: 4.7 },
      { tok: "plan",         logit: 4.1 },
      { tok: "guess",        logit: 3.5 },
      { tok: "sleep",        logit: 1.8 },
      { tok: "give_up",      logit: 0.1 },
      { tok: "dance",        logit: -1.4 },
    ]
  }
];

function softmax(logits, T) {
  const t = Math.max(T, 0.01);
  const scaled = logits.map(l => l / t);
  const max = Math.max(...scaled);
  const exp = scaled.map(s => Math.exp(s - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(e => e / sum);
}

function NextTokenDemo() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [temp, setTemp] = useState(0.7);
  const [topK, setTopK] = useState(5);
  const [topP, setTopP] = useState(0.9);
  const [history, setHistory] = useState([]);
  const [seed, setSeed] = useState(101);
  const rngRef = useRef(rng(seed));

  const scenario = SCENARIOS[sceneIdx];

  // Pipeline computation: Logits -> Top-K filter -> Top-P filter -> Softmax
  const pipeline = useMemo(() => {
    // 1. Sort vocab by raw logits
    const sorted = [...scenario.vocab]
      .map((item, originalIndex) => ({ ...item, originalIndex }))
      .sort((a, b) => b.logit - a.logit);

    // 2. Top-K cutoff
    const kFiltered = sorted.map((item, rank) => ({
      ...item,
      rank,
      kKeep: rank < topK
    }));

    // 3. Apply Softmax to K-filtered logits to determine cumulative Top-P boundaries
    const kOnlyLogits = kFiltered.map(item => item.kKeep ? item.logit : -Infinity);
    const kOnlyProbs = softmax(kOnlyLogits, temp);

    let runningSum = 0;
    const pFiltered = kFiltered.map((item, i) => {
      const p = kOnlyProbs[i];
      const pKeep = item.kKeep && (runningSum < topP || i === 0);
      runningSum += p;
      return { ...item, pBeforeNorm: p, pKeep };
    });

    // 4. Renormalize probabilities among final kept candidates
    const finalKeptLogits = pFiltered.map(item => item.pKeep ? item.logit : -Infinity);
    const finalProbs = softmax(finalKeptLogits, temp);

    const result = pFiltered.map((item, idx) => ({
      ...item,
      finalProb: item.pKeep ? finalProbs[idx] : 0
    }));

    return result;
  }, [scenario, temp, topK, topP]);

  function sampleToken() {
    const r = rngRef.current();
    let cumulative = 0;
    // Sample based on renormalized probabilities
    for (const item of pipeline) {
      cumulative += item.finalProb;
      if (r <= cumulative && item.pKeep) {
        setHistory(prev => [...prev, item.tok]);
        return;
      }
    }
    // Fallback just in case
    const topItem = pipeline.find(item => item.pKeep) || pipeline[0];
    setHistory(prev => [...prev, topItem.tok]);
  }

  function resetScene(nextSeed = seed) {
    setHistory([]);
    rngRef.current = rng(nextSeed);
  }

  function updateSeed(value) {
    const nextSeed = parseInt(value, 10) || 42;
    setSeed(nextSeed);
    resetScene(nextSeed);
  }

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Auto-Regressive Logits Playground">
        <Stage>
          {/* Scenario chooser */}
          <div style={{ marginBottom: 20 }}>
            <span className="label" style={{ display: "block", marginBottom: 8 }}>Select Initial Prompt</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SCENARIOS.map((s, i) => (
                <button key={i}
                  className={`btn btn--sm ${sceneIdx === i ? "btn--primary" : ""}`}
                  onClick={() => { setSceneIdx(i); resetScene(); }}
                >
                  "{s.prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Large visual sequence */}
          <div style={{
            padding: "16px 20px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            minHeight: 64,
            marginBottom: 24,
            fontSize: 15,
            lineHeight: 1.6,
          }}>
            <span style={{ color: "var(--ink-3)", userSelect: "none" }}>Input: </span>
            <span style={{ color: "var(--ink-1)", fontWeight: 500 }}>{scenario.prompt}</span>
            {history.map((tok, i) => (
              <span key={i} className="tok" style={{
                background: "rgba(var(--green-rgb), 0.12)",
                color: "var(--green)",
                border: "1px solid rgba(var(--green-rgb), 0.3)",
                padding: "2px 6px",
                borderRadius: 4,
                marginLeft: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 13
              }}>
                {tok}
              </span>
            ))}
            <span className="cursor" style={{ marginLeft: 4 }} />
          </div>

          {/* Slicers and sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="label" style={{ marginBottom: 0 }}>Temperature</span>
                <span className="num" style={{ color: "var(--green)", fontSize: 13 }}>{temp.toFixed(2)}</span>
              </div>
              <input type="range" min={0.05} max={2.0} step={0.05} value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--green)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-4)", marginTop: 4 }}>
                <span>0.05 · Rigid</span><span>1.0 · Balanced</span><span>2.0 · Random</span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="label" style={{ marginBottom: 0 }}>Top-K Cutoff</span>
                <span className="num" style={{ color: "var(--yellow)", fontSize: 13 }}>{topK}</span>
              </div>
              <input type="range" min={1} max={8} step={1} value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--yellow)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-4)", marginTop: 4 }}>
                <span>k = 1 · Greedy</span><span>k = 8 · All Candidates</span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="label" style={{ marginBottom: 0 }}>Top-P (Nucleus)</span>
                <span className="num" style={{ color: "var(--pink)", fontSize: 13 }}>{topP.toFixed(2)}</span>
              </div>
              <input type="range" min={0.1} max={1.0} step={0.05} value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--pink)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--ink-4)", marginTop: 4 }}>
                <span>0.1 · Top only</span><span>1.0 · Full vocabulary</span>
              </div>
            </div>
          </div>

          {/* Histogram distribution of candidate tokens */}
          <div className="label" style={{ marginBottom: 10 }}>Probability Pipeline (Logits ➔ Top-K ➔ Top-P ➔ Softmax)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pipeline.map((item, idx) => {
              const active = item.pKeep;
              const probPercent = item.finalProb * 100;
              return (
                <div key={item.tok} style={{
                  display: "grid",
                  gridTemplateColumns: "110px 60px 1fr 70px",
                  alignItems: "center",
                  gap: 12,
                  opacity: active ? 1 : 0.28,
                  transition: "opacity 0.2s var(--ease)",
                }}>
                  {/* Token text */}
                  <span style={{
                    fontSize: 12.5,
                    fontFamily: "var(--font-mono)",
                    color: active ? "var(--green)" : "var(--ink-3)",
                    textAlign: "right",
                  }}>"{item.tok}"</span>

                  {/* Raw Logit value */}
                  <span style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>
                    L: {item.logit.toFixed(1)}
                  </span>

                  {/* Horizontal Bar */}
                  <div style={{ position: "relative", height: 18, background: "var(--bg-2)", borderRadius: 3 }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      width: `${probPercent}%`,
                      background: active ? "var(--green)" : "#3a3a3a",
                      transition: "width 0.25s var(--ease)",
                      borderRadius: 3,
                    }} />
                    {/* Status indicators */}
                    <div style={{
                      position: "absolute", right: 8, top: 2,
                      fontSize: 9, color: "var(--ink-4)", fontFamily: "var(--font-mono)"
                    }}>
                      {!item.kKeep && "Filtered by K"}
                      {item.kKeep && !item.pKeep && "Filtered by P"}
                    </div>
                  </div>

                  {/* Result Prob */}
                  <span className="num" style={{ fontSize: 12, color: active ? "var(--ink-2)" : "var(--ink-4)", fontWeight: active ? 600 : 400 }}>
                    {probPercent.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 28, alignItems: "center" }}>
            <button className="btn btn--primary" onClick={sampleToken}>
              Sample next token ➔
            </button>
            <button className="btn btn--ghost" onClick={resetScene}>
              Reset sequence
            </button>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-4)" }}>
              Seed:{" "}
              <input type="number" value={seed} onChange={(e) => updateSeed(e.target.value)}
                style={{ width: 55, padding: "2px 4px", fontSize: 11, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 3 }} />
            </span>
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Auto-Regressive Next-Token Prediction">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">The math loop</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
              <li>1. <strong>Context Prompt</strong> goes in</li>
              <li>2. Model computes raw <strong>Logits</strong></li>
              <li>3. <strong>Top-K</strong> filters out index &gt; K</li>
              <li>4. <strong>Top-P</strong> slices cumulative tail</li>
              <li>5. <strong>Temperature</strong> scales relative gaps</li>
              <li>6. <strong>Softmax</strong> outputs final probability</li>
              <li>7. <strong>Sample 1</strong> and repeat auto-regressively</li>
            </ul>
          </div>
        }>
          <p>
            Language models are fundamentally <strong>next-token predictors</strong>. They do not output sentences in a single massive pass. Instead, they operate in a loop: predicting a single token, adding that token to the input buffer, and running the whole model forward again.
          </p>
          <p style={{ marginTop: 14 }}>
            For each step, the model computes <strong>logits</strong> — raw scores for every word in its vocabulary. High logits represent words that are statistically likely to follow the input context.
          </p>
          <p style={{ marginTop: 14 }}>
            By adjusting <strong>Temperature</strong>, <strong>Top-K</strong>, and <strong>Top-P</strong>, we alter the raw logit scores and slice off unlikely candidates before drawing a random token. Low temperature makes the generation highly deterministic (the best token always wins), while higher values allow the model to explore rarer, more creative pathways.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="Auto-Regressive loop in Python">
        <Code>{`import torch
import torch.nn.functional as F

# A toy logits list and vocabulary
vocab = ["database", "calculator", "user", "API", "weather"]
logits = torch.tensor([5.8, 5.2, 4.5, 4.1, 3.6])

# Apply temperature scaling
temperature = 0.7
scaled_logits = logits / temperature

# Convert logits to a probability distribution
probabilities = F.softmax(scaled_logits, dim=-1)

# Sample one index from the distribution
sampled_index = torch.multinomial(probabilities, num_samples=1).item()
print("Next word:", vocab[sampled_index])`}</Code>
      </Section>

      <Section eyebrow="experiments" title="Try these tests">
        <Experiments items={[
          "Set Temperature to 0.05 and hit 'Sample' repeatedly. The model will exclusively select the top candidate ('database' or 'GPUs'), creating highly rigid outputs.",
          "Crank Temperature to 2.0. The probability distribution will flatten significantly, giving low-probability words like 'pizza' or 'cats' a high chance of selection.",
          "Slide Top-K to 2. Look at how all tokens ranked 3rd or lower ('user', 'API', 'weather', etc.) are immediately grayed out and blocked from selection.",
          "Keep Temperature at 1.0, but drop Top-P to 0.5. Notice how only the top two words remain active because their sum exceeds 50% cumulative probability."
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default NextTokenDemo;
