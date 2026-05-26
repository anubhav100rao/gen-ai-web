import React, { useState, useEffect, useRef } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

const TRAINING_DATA = [
  { input: "deep learning is", target: "powerful" },
  { input: "attention layers are", target: "efficient" },
  { input: "language models generate", target: "tokens" },
  { input: "transformers process text", target: "rapidly" },
];

function TrainingInferenceDemo() {
  const [trainingActive, setTrainingActive] = useState(false);
  const [trainStep, setTrainStep] = useState(0); // 0 = Idle, 1 = Forward, 2 = Loss, 3 = Backward
  const [dataIdx, setDataIdx] = useState(0);
  const [trainLoss, setTrainLoss] = useState(2.45);
  const [lossHistory, setLossHistory] = useState([2.5, 2.48, 2.45]);
  const [weights, setWeights] = useState([0.15, -0.42, 0.73, -0.11, 0.55]);

  const [inferenceActive, setInferenceActive] = useState(false);
  const [inferOutput, setInferOutput] = useState([]);
  const [inferStep, setInferStep] = useState(0); // 0 = Idle, 1 = Forward, 2 = Token Emit

  const trainTimerRef = useRef(null);
  const inferTimerRef = useRef(null);
  const inferPrompt = "artificial intelligence is";

  // Train loop step controller
  useEffect(() => {
    if (!trainingActive) return;

    trainTimerRef.current = setInterval(() => {
      setTrainStep(prev => {
        if (prev === 3) {
          // Backward complete, move to next item, update loss/weights
          setDataIdx(i => (i + 1) % TRAINING_DATA.length);
          setTrainLoss(l => {
            const nextL = Math.max(0.15, l - 0.08 * (0.8 + Math.random() * 0.4));
            setLossHistory(h => [...h, nextL].slice(-10));
            return nextL;
          });
          setWeights(w => w.map(val => val + (Math.random() - 0.5) * 0.1));
          return 1; // loop back to forward
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(trainTimerRef.current);
  }, [trainingActive]);

  // Inference loop step controller
  useEffect(() => {
    if (!inferenceActive) return;

    const vocab = ["smart", "revolutionary", "ubiquitous", "scalable", "transformative"];

    inferTimerRef.current = setInterval(() => {
      setInferStep(prev => {
        if (prev === 2) {
          // Token emitted, append to outputs, check length, proceed
          const nextTok = vocab[Math.floor(Math.random() * vocab.length)];
          setInferOutput(out => {
            if (out.length >= 5) {
              return out;
            }
            return [...out, nextTok];
          });
          return 1; // loop back to forward
        }
        return prev + 1;
      });
    }, 1100);

    return () => clearInterval(inferTimerRef.current);
  }, [inferenceActive]);

  useEffect(() => {
    if (inferenceActive && inferOutput.length >= 5) {
      setInferenceActive(false);
      setInferStep(0);
    }
  }, [inferOutput.length, inferenceActive]);

  function startTrain() {
    setInferenceActive(false);
    setTrainStep(1);
    setTrainingActive(true);
  }

  function pauseTrain() {
    setTrainingActive(false);
    setTrainStep(0);
  }

  function resetWeights() {
    pauseTrain();
    setTrainLoss(2.5);
    setLossHistory([2.5]);
    setWeights([0.15, -0.42, 0.73, -0.11, 0.55]);
  }

  function startInfer() {
    setTrainingActive(false);
    setInferOutput([]);
    setInferStep(1);
    setInferenceActive(true);
  }

  function stopInfer() {
    setInferenceActive(false);
    setInferStep(0);
  }

  const currentItem = TRAINING_DATA[dataIdx];

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Inside the Weights: Writing vs Reading">
        <Stage padding={0}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", minHeight: 520 }}>
            
            {/* Left Screen: Training Panel */}
            <div style={{ padding: 24, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="chip chip--pink">1. Training (Writing)</span>
                <span className="num" style={{ fontSize: 11, color: "var(--pink)" }}>Mode: Backpropagation</span>
              </div>

              <div className="card" style={{ padding: 14, background: "var(--bg-2)", border: "1px solid var(--border)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 6 }}>Training Set Batch</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--ink-3)" }}>Input:</span> "{currentItem.input}" <br/>
                  <span style={{ color: "var(--pink)" }}>Target:</span> "{currentItem.target}"
                </div>
              </div>

              {/* Training Synapse Net Visualization */}
              <div style={{
                flex: 1,
                minHeight: 180,
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                overflow: "hidden",
                padding: "20px 0",
              }}>
                {/* Inputs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 2 }}>
                  <div className="tok" style={{ fontSize: 10, background: "var(--bg-2)" }}>x1</div>
                  <div className="tok" style={{ fontSize: 10, background: "var(--bg-2)" }}>x2</div>
                </div>

                {/* Weights & Connections SVG Overlay */}
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                  {/* Neural connection line 1 */}
                  <line x1="60" y1="65" x2="160" y2="65" stroke={trainStep === 3 ? "var(--pink)" : "var(--border)"}
                    strokeWidth={Math.abs(weights[0]) * 5}
                    strokeDasharray={trainStep === 1 ? "4 4" : "none"}
                    style={{ transition: "stroke 0.25s" }} />
                  {/* Neural connection line 2 */}
                  <line x1="60" y1="115" x2="160" y2="115" stroke={trainStep === 3 ? "var(--pink)" : "var(--border)"}
                    strokeWidth={Math.abs(weights[1]) * 5}
                    strokeDasharray={trainStep === 1 ? "4 4" : "none"}
                    style={{ transition: "stroke 0.25s" }} />
                  {/* Gradients returning arrow */}
                  {trainStep === 3 && (
                    <path d="M 150 90 Q 110 50 70 90" stroke="var(--pink)" strokeWidth={2} fill="none" markerEnd="url(#arrow-dim)" strokeDasharray="3 3" />
                  )}
                </svg>

                {/* Synaptic Neuron nodes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 2 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 999,
                    border: "2px solid var(--border)",
                    background: trainStep === 1 ? "var(--green)" : "var(--bg-2)",
                    boxShadow: trainStep === 1 ? "0 0 12px rgba(var(--green-rgb), 0.4)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontFamily: "var(--font-mono)",
                    transition: "all 0.3s",
                  }}>
                    {weights[0].toFixed(2)}
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 999,
                    border: "2px solid var(--border)",
                    background: trainStep === 1 ? "var(--green)" : "var(--bg-2)",
                    boxShadow: trainStep === 1 ? "0 0 12px rgba(var(--green-rgb), 0.4)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontFamily: "var(--font-mono)",
                    transition: "all 0.3s",
                  }}>
                    {weights[1].toFixed(2)}
                  </div>
                </div>

                {/* Output prediction status card */}
                <div style={{ zIndex: 2, padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 3, fontSize: 11 }}>
                  {trainStep === 1 && <span style={{ color: "var(--green)" }}>Forward pass...</span>}
                  {trainStep === 2 && <span style={{ color: "var(--yellow)" }}>Loss: {trainLoss.toFixed(3)}</span>}
                  {trainStep === 3 && <span style={{ color: "var(--pink)", fontWeight: 600 }}>Backpropagation!</span>}
                  {trainStep === 0 && <span style={{ color: "var(--ink-4)" }}>Idle</span>}
                </div>
              </div>

              {/* Loss minimization chart */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span className="label" style={{ marginBottom: 0 }}>Loss Curve Graph</span>
                <span className="num" style={{ color: "var(--pink)" }}>Loss: {trainLoss.toFixed(2)}</span>
              </div>
              <div style={{
                height: 48,
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                marginTop: 8,
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                padding: "2px 4px",
                overflow: "hidden",
              }}>
                {lossHistory.map((val, idx) => {
                  const hPercent = (val / 3.0) * 100;
                  return (
                    <div key={idx} style={{
                      flex: 1,
                      height: `${hPercent}%`,
                      background: "var(--pink)",
                      opacity: 0.8,
                      borderRadius: "1px 1px 0 0",
                    }} />
                  );
                })}
              </div>

              {/* Train controls */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {!trainingActive ? (
                  <button className="btn btn--sm" onClick={startTrain}>▶ Start Training</button>
                ) : (
                  <button className="btn btn--sm btn--primary" onClick={pauseTrain}>⏸ Pause</button>
                )}
                <button className="btn btn--sm btn--ghost" onClick={resetWeights}>↺ Reset weights</button>
              </div>
            </div>

            {/* Right Screen: Inference Panel */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="chip chip--green">2. Inference (Reading)</span>
                <span className="num" style={{ fontSize: 11, color: "var(--green)" }}>🔒 WEIGHTS FROZEN</span>
              </div>

              <div className="card" style={{ padding: 14, background: "var(--bg-2)", border: "1px solid var(--border)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 6 }}>Frozen Prompt Input</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--ink-3)" }}>Prompt:</span> "{inferPrompt}"
                </div>
              </div>

              {/* Visual read-only forward pass net */}
              <div style={{
                flex: 1,
                minHeight: 180,
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                overflow: "hidden",
                padding: "20px 0",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, zIndex: 2 }}>
                  <div className="tok" style={{ fontSize: 10, background: "var(--bg-2)" }}>x1</div>
                  <div className="tok" style={{ fontSize: 10, background: "var(--bg-2)" }}>x2</div>
                </div>

                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                  {/* Dotted lines moving ONLY forward */}
                  <line x1="60" y1="65" x2="160" y2="65" stroke="var(--green)"
                    strokeWidth={Math.abs(weights[0]) * 5}
                    strokeDasharray="4 4" />
                  <line x1="60" y1="115" x2="160" y2="115" stroke="var(--green)"
                    strokeWidth={Math.abs(weights[1]) * 5}
                    strokeDasharray="4 4" />
                </svg>

                {/* Nodes with frozen padlock values */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 2 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 999,
                    border: "2px dashed var(--green)",
                    background: "var(--bg-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontFamily: "var(--font-mono)",
                  }}>
                    🔒 {weights[0].toFixed(1)}
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: 999,
                    border: "2px dashed var(--green)",
                    background: "var(--bg-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontFamily: "var(--font-mono)",
                  }}>
                    🔒 {weights[1].toFixed(1)}
                  </div>
                </div>

                <div style={{ zIndex: 2, padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 3, fontSize: 11 }}>
                  {inferStep === 1 && <span style={{ color: "var(--green)" }}>Reading model...</span>}
                  {inferStep === 2 && <span style={{ color: "var(--green)", fontWeight: 600 }}>Emit token!</span>}
                  {inferStep === 0 && <span style={{ color: "var(--ink-4)" }}>Idle</span>}
                </div>
              </div>

              {/* Autoregressive Output Box */}
              <div className="label" style={{ marginTop: 12 }}>Generated Token Output sequence</div>
              <div style={{
                height: 48,
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}>
                <span className="lead" style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>... is</span>
                {inferOutput.length === 0 && <span className="dim" style={{ fontSize: 12 }}>[Awaiting inference run]</span>}
                {inferOutput.map((tok, idx) => (
                  <span key={idx} className="tok" style={{
                    background: "rgba(var(--green-rgb), 0.12)",
                    color: "var(--green)",
                    border: "1px solid rgba(var(--green-rgb), 0.3)",
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}>
                    {tok}
                  </span>
                ))}
              </div>

              {/* Inference controls */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                {!inferenceActive ? (
                  <button className="btn btn--sm" onClick={startInfer}>▶ Generate Text</button>
                ) : (
                  <button className="btn btn--sm btn--primary" onClick={stopInfer}>⏸ Stop</button>
                )}
                <button className="btn btn--sm btn--ghost" onClick={() => setInferOutput([])}>↺ Clear logs</button>
              </div>
            </div>

          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Weights are Trained once, then Read-Only">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">Core difference</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
              <li><strong>Training:</strong> Writes to weights. Requires GPU clusters, backpropagation, and label datasets (<code>O(backward)</code>).</li>
              <li style={{ marginTop: 6 }}><strong>Inference:</strong> Reads weights. Low memory footprint, only calculates forward, frozen values (<code>O(forward)</code>).</li>
            </ul>
          </div>
        }>
          <p>
            One of the most persistent misconceptions for beginners is the belief that Large Language Models continue to "learn" or adapt their brain cells (synaptic weights) while they are chatting with users.
          </p>
          <p style={{ marginTop: 14 }}>
            In reality, LLM weights are <strong>frozen</strong> during inference. When you send a prompt, the system executes a pure <strong>Forward Pass</strong> — multiplying your input vectors by static matrices to calculate next-token probabilities. The model doesn't store your query, learn new definitions, or rewrite its memory during this phase.
          </p>
          <p style={{ marginTop: 14 }}>
            To modify what a model knows, we must trigger <strong>Training</strong>. In training, we pass text in, calculate the error (Loss) against a known ground truth target, and run <strong>Backpropagation</strong>. Backpropagation uses gradient mathematics to flow error signals <em>backward</em> through the network, updating the weight coefficients so the model predicts more accurately next time.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="Model evaluation vs training in PyTorch">
        <Code>{`import torch
import torch.nn as nn

model = nn.Linear(10, 2)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

# --- TRAINING MODE (Gradient Tracking + Weights updated) ---
model.train()
x_train = torch.randn(1, 10)
target = torch.tensor([1])
loss = nn.CrossEntropyLoss()(model(x_train), target)

loss.backward()      # 1. Calculates gradients
optimizer.step()     # 2. Writes modifications to weights
optimizer.zero_grad() 

# --- INFERENCE MODE (🔒 Memory protected, Read-Only) ---
model.eval()
with torch.no_grad(): # Disable backpropagation pathways
    x_test = torch.randn(1, 10)
    probabilities = torch.softmax(model(x_test), dim=-1) # Forward pass only
    print("Inference probabilities:", probabilities)`}</Code>
      </Section>

      <Section eyebrow="experiments" title="Try these tests">
        <Experiments items={[
          "Click 'Start Training'. Watch the error logs and gradients flow backward in the left screen. Notice the synapse weight values changing dynamically.",
          "Look at the right screen during training. The inference values are locked (🔒). Click 'Generate Text' to watch forward passes read those frozen weights without altering them.",
          "Pause the training loop. Notice that both panels are now static. Inference can be run thousands of times, but the model's knowledge will remain exactly identical.",
          "Reset weights. The left graph returns to high loss, and the synapse values are restored to baseline. This illustrates how training always starts from a clean parameter state."
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default TrainingInferenceDemo;
