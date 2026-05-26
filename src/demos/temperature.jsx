import React, { useState, useRef, useMemo } from "react";
import { rng, Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Temperature & sampling — the dial that controls boldness
// ============================================================

// A simulated next-token distribution after "The cat sat on the"
const PROMPT = "The cat sat on the";
const NEXT_TOKEN_LOGITS = [
  { tok: "mat",      logit: 6.2 },
  { tok: "chair",    logit: 5.1 },
  { tok: "couch",    logit: 4.6 },
  { tok: "floor",    logit: 4.2 },
  { tok: "rug",      logit: 3.7 },
  { tok: "table",    logit: 3.3 },
  { tok: "bed",      logit: 2.9 },
  { tok: "windowsill", logit: 2.4 },
  { tok: "fence",    logit: 1.8 },
  { tok: "roof",     logit: 1.4 },
  { tok: "moon",     logit: -0.3 },
  { tok: "internet", logit: -1.2 },
];

function softmax(logits, T) {
  // Avoid div by zero
  const t = Math.max(T, 0.01);
  const scaled = logits.map(l => l / t);
  const max = Math.max(...scaled);
  const exp = scaled.map(s => Math.exp(s - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(e => e / sum);
}

function TemperatureDemo() {
  const [temp, setTemp] = useState(0.7);
  const [topP, setTopP] = useState(1.0);
  const [samples, setSamples] = useState([]);
  const [seed, setSeed] = useState(42);
  const randRef = useRef(rng(seed));

  const probs = useMemo(() => softmax(NEXT_TOKEN_LOGITS.map(t => t.logit), temp), [temp]);

  // Apply top-p (nucleus) filtering
  const { keep, finalProbs } = useMemo(() => {
    const order = probs
      .map((p, i) => ({ i, p }))
      .sort((a, b) => b.p - a.p);
    let cum = 0;
    const kept = new Set();
    for (const { i, p } of order) {
      kept.add(i);
      cum += p;
      if (cum >= topP) break;
    }
    const masked = probs.map((p, i) => kept.has(i) ? p : 0);
    const sum = masked.reduce((a, b) => a + b, 0);
    const renorm = masked.map(p => p / sum);
    return { keep: kept, finalProbs: renorm };
  }, [probs, topP]);

  function doSample() {
    const r = randRef.current();
    let cum = 0;
    for (let i = 0; i < finalProbs.length; i++) {
      cum += finalProbs[i];
      if (r <= cum) {
        setSamples([NEXT_TOKEN_LOGITS[i].tok, ...samples].slice(0, 20));
        return;
      }
    }
  }
  function resetSeed() {
    randRef.current = rng(seed);
    setSamples([]);
  }
  function sample10() {
    for (let i = 0; i < 10; i++) doSample();
  }

  // Variety in sample history
  const uniq = new Set(samples).size;

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Same prompt. Different boldness.">
        <Stage>
          {/* prompt line */}
          <div style={{
            padding: "12px 16px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            fontSize: 13,
            marginBottom: 24,
          }}>
            <span style={{ color: "var(--ink-3)" }}>prompt: </span>
            <span style={{ color: "var(--ink-1)" }}>"{PROMPT}"</span>
            <span style={{ color: "var(--green)" }}> _____</span>
          </div>

          {/* sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="label" style={{ marginBottom: 0 }}>temperature</span>
                <span className="num" style={{ color: "var(--green)", fontSize: 14 }}>{temp.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={2} step={0.05} value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--green)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-4)", marginTop: 4 }}>
                <span>0 · deterministic</span><span>1 · default</span><span>2 · chaotic</span>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="label" style={{ marginBottom: 0 }}>top-p (nucleus)</span>
                <span className="num" style={{ color: "var(--yellow)", fontSize: 14 }}>{topP.toFixed(2)}</span>
              </div>
              <input type="range" min={0.05} max={1} step={0.05} value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--yellow)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-4)", marginTop: 4 }}>
                <span>0.05 · greedy</span><span>0.5</span><span>1.00 · all tokens</span>
              </div>
            </div>
          </div>

          {/* distribution bars */}
          <div className="label" style={{ marginTop: 32 }}>next-token probability distribution</div>
          <div style={{ marginTop: 8 }}>
            {NEXT_TOKEN_LOGITS.map((t, i) => {
              const p = finalProbs[i];
              const original = probs[i];
              const masked = !keep.has(i);
              return (
                <div key={t.tok} style={{
                  display: "grid",
                  gridTemplateColumns: "110px 1fr 70px",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 4,
                  opacity: masked ? 0.3 : 1,
                }}>
                  <span style={{
                    fontSize: 12.5,
                    fontFamily: "var(--font-mono)",
                    color: i === 0 ? "var(--green)" : "var(--ink-2)",
                    textAlign: "right",
                  }}>"{t.tok}"</span>
                  <div style={{ position: "relative", height: 16, background: "var(--bg-2)", borderRadius: 2 }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      width: `${p * 100}%`,
                      background: masked ? "#3a3a3a" : (i === 0 ? "var(--green)" : "var(--ink-4)"),
                      transition: "width 0.2s var(--ease)",
                      borderRadius: 2,
                    }} />
                  </div>
                  <span className="num" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {(p * 100).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* sample buttons + history */}
          <div style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            <button className="btn btn--primary" onClick={doSample}>sample 1 →</button>
            <button className="btn" onClick={sample10}>sample 10 →</button>
            <button className="btn btn--ghost" onClick={resetSeed}>reset</button>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)" }}>
              seed{" "}
              <input type="number" value={seed} onChange={(e) => { setSeed(parseInt(e.target.value)); }}
                style={{ width: 60, padding: "2px 6px", fontSize: 11 }} />
            </span>
          </div>

          <div className="label" style={{ marginTop: 20 }}>
            samples · {samples.length} drawn · {uniq} unique
          </div>
          <div style={{
            padding: 14,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            minHeight: 48,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}>
            {samples.length === 0 && <span className="dim" style={{ fontSize: 12 }}>no samples yet — hit "sample 1"</span>}
            {samples.map((s, i) => (
              <span key={i} className="tok" style={{
                background: "rgba(var(--green-rgb), 0.12)",
                color: "var(--green)",
                border: "1px solid rgba(var(--green-rgb), 0.3)",
                fontSize: 12,
              }}>{s}</span>
            ))}
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="From logits to a single word">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">when to use what</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.9 }}>
              <li><strong style={{ color: "var(--green)" }}>0.0</strong> · classification, extraction, tools</li>
              <li><strong style={{ color: "var(--green)" }}>0.3-0.7</strong> · code, structured answers</li>
              <li><strong style={{ color: "var(--green)" }}>0.7-1.0</strong> · prose, conversation</li>
              <li><strong style={{ color: "var(--green)" }}>1.0-1.5</strong> · brainstorm, creative writing</li>
              <li><strong style={{ color: "var(--green)" }}>{">"}1.5</strong> · chaos, fun, rarely useful</li>
            </ul>
          </div>
        }>
          <p>
            For every next-token decision the model outputs a vector of <strong style={{ color: "var(--green)" }}>logits</strong> —
            one number per token in the vocabulary, roughly meaning "how strongly do I want to say this?"
          </p>
          <p style={{ marginTop: 16 }}>
            <strong>softmax</strong> turns logits into a probability distribution. <strong>Temperature</strong>{" "}
            divides logits before softmax: low T makes the gaps bigger (sharper distribution, the top token
            wins), high T makes them smaller (flatter distribution, weirder tokens get a real chance).
          </p>
          <p style={{ marginTop: 16 }}>
            <strong>Top-p</strong> (nucleus sampling) zeroes out the long tail: keep only the smallest set
            of tokens whose cumulative probability ≥ p. With temp=1.0, top-p=0.9, you're basically saying
            "be creative within the top 90% of plausibility."
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`from anthropic import Anthropic
client = Anthropic()

# Deterministic — same prompt → same answer (mostly)
factual = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=200,
    temperature=0,
    messages=[{"role": "user", "content": "What is the capital of France?"}],
)

# Creative — different output every time
story = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=500,
    temperature=1.0,
    top_p=0.95,
    messages=[{"role": "user", "content": "Write a short poem about rain."}],
)`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Set temperature to 0. Hit 'sample 10' — every draw should be 'mat'. Determinism.",
          "Crank temperature to 2.0. Now even 'internet' (an absurd completion) gets picked sometimes.",
          "At temperature 1.0, slide top-p down to 0.5. The bottom tokens fade out — you've cut the tail.",
          "Greedy decoding (temp=0) is fast and reproducible but can get stuck in loops. That's why default temperatures sit around 0.7.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default TemperatureDemo;
