import React, { useEffect, useRef, useState } from "react";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";
import { Code } from "../util.jsx";

const DOMAIN_COMPARISONS = {
  legal: {
    title: "Legal AI Expert",
    prompt: "What happens if a contract clause is broken?",
    base: "A contract is an agreement. If someone breaks it, that's called a breach. You should try to talk to them, read the contract, or hire a local attorney to help you solve it.",
    tuned: "Pursuant to standard commercial statutes, a material breach of Section 4(b) triggers an immediate 14-day cure period. If default remains uncured, non-breaching party is entitled to liquidated damages under Clause 12.",
    words: [
      { w: "pursuant", base: 0.01, tuned: 0.65 },
      { w: "breach", base: 0.12, tuned: 0.58 },
      { w: "cure", base: 0.02, tuned: 0.44 },
      { w: "damages", base: 0.05, tuned: 0.52 },
    ]
  },
  support: {
    title: "E-Commerce Support Bot",
    prompt: "My package didn't arrive today, what do I do?",
    base: "Packages can get delayed for many reasons: weather, carrier logistics, or customs. Check your tracking link or ask your neighbors if they received it for you.",
    tuned: "I apologize for the delay! Let me look up your order status. Please reply with your Order ID, or click 'Request Refund' below to initiate an immediate refund ticket.",
    words: [
      { w: "apologize", base: 0.04, tuned: 0.72 },
      { w: "refund", base: 0.01, tuned: 0.68 },
      { w: "Order ID", base: 0.02, tuned: 0.55 },
      { w: "ticket", base: 0.01, tuned: 0.49 },
    ]
  }
};

function FineTuningRlhfDemo() {
  const [tab, setTab] = useState("sft"); // 'sft' or 'rlhf'
  
  // SFT State
  const [selectedDomain, setSelectedDomain] = useState("legal");
  const [isTuning, setIsTuning] = useState(false);
  const [sftProgress, setSftProgress] = useState(0);

  // RLHF State
  const [rlhfStep, setRlhfStep] = useState(0); // 0 = Awaiting feedback, 1 = Preference selected, 2 = Tuning complete
  const [preference, setPreference] = useState(null); // 'A' or 'B'
  const [simpleProbs, setSimpleProbs] = useState([
    { word: "isotopes", p: 0.45 },
    { word: "fission", p: 0.40 },
    { word: "sun", p: 0.08 },
    { word: "wheel", p: 0.07 }
  ]);
  const sftIntervalRef = useRef(null);
  const rlhfTimeoutRef = useRef(null);

  function clearSftTimer() {
    if (sftIntervalRef.current) {
      clearInterval(sftIntervalRef.current);
      sftIntervalRef.current = null;
    }
  }

  function clearRlhfTimer() {
    if (rlhfTimeoutRef.current) {
      clearTimeout(rlhfTimeoutRef.current);
      rlhfTimeoutRef.current = null;
    }
  }

  useEffect(() => () => {
    clearSftTimer();
    clearRlhfTimer();
  }, []);

  // Trigger SFT visual progress
  function triggerSFT() {
    clearSftTimer();
    setIsTuning(true);
    setSftProgress(0);
    sftIntervalRef.current = setInterval(() => {
      setSftProgress(p => {
        const next = Math.min(100, p + 10);
        if (next >= 100) {
          clearSftTimer();
          setIsTuning(false);
        }
        return next;
      });
    }, 150);
  }

  // Handle human feedback choice
  function choosePreference(choice) {
    clearRlhfTimer();
    setPreference(choice);
    setRlhfStep(1);
    
    // Simulate backpropagation shifting vocabulary probability weights
    rlhfTimeoutRef.current = setTimeout(() => {
      setSimpleProbs([
        { word: "isotopes", p: choice === "B" ? 0.05 : 0.65 },
        { word: "fission", p: choice === "B" ? 0.03 : 0.55 },
        { word: "sun", p: choice === "B" ? 0.58 : 0.02 },
        { word: "wheel", p: choice === "B" ? 0.48 : 0.01 }
      ]);
      setRlhfStep(2);
      rlhfTimeoutRef.current = null;
    }, 1200);
  }

  function resetRLHF() {
    clearRlhfTimer();
    setPreference(null);
    setRlhfStep(0);
    setSimpleProbs([
      { word: "isotopes", p: 0.45 },
      { word: "fission", p: 0.40 },
      { word: "sun", p: 0.08 },
      { word: "wheel", p: 0.07 }
    ]);
  }

  const comparison = DOMAIN_COMPARISONS[selectedDomain];

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Post-Training: Domain Adaptation & Alignment">
        <Stage>
          {/* Main Tab Switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
            <button
              onClick={() => setTab("sft")}
              style={{
                background: "transparent", border: "none",
                borderBottom: tab === "sft" ? "2px solid var(--violet)" : "2px solid transparent",
                color: tab === "sft" ? "var(--violet)" : "var(--ink-3)",
                padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: tab === "sft" ? 600 : 400
              }}>
              Supervised Fine-Tuning (SFT)
            </button>
            <button
              onClick={() => setTab("rlhf")}
              style={{
                background: "transparent", border: "none",
                borderBottom: tab === "rlhf" ? "2px solid var(--violet)" : "2px solid transparent",
                color: tab === "rlhf" ? "var(--violet)" : "var(--ink-3)",
                padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: tab === "rlhf" ? 600 : 400
              }}>
              RLHF (Human Preference Arena)
            </button>
          </div>

          {/* SFT PANEL */}
          {tab === "sft" && (
            <div>
              {/* Domain Chooser */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {Object.entries(DOMAIN_COMPARISONS).map(([key, value]) => (
                  <button key={key}
                    className={`btn btn--sm ${selectedDomain === key ? "btn--primary" : ""}`}
                    onClick={() => { setSelectedDomain(key); setSftProgress(0); }}>
                    Tuning: {value.title}
                  </button>
                ))}
              </div>

              {/* Training Progress animation card */}
              <div className="card" style={{ padding: 18, background: "var(--bg-2)", border: "1px solid var(--border)", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="label" style={{ marginBottom: 0 }}>Supervised Dataset Feed</span>
                  <button className="btn btn--sm btn--primary" onClick={triggerSFT} disabled={isTuning}>
                    {sftProgress === 100 ? "Re-Run Fine-Tuning" : "▶ Start SFT Training"}
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ width: `${sftProgress}%`, height: "100%", background: "var(--violet)", transition: "width 0.2s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>
                  <span>Base weights</span>
                  <span>{sftProgress}% Complete</span>
                  <span>Domain adapted</span>
                </div>
              </div>

              {/* Side-by-side output comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                {/* Base model output */}
                <div>
                  <div className="label">Base model response</div>
                  <div style={{
                    padding: 16, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 4,
                    minHeight: 120, fontSize: 13, lineHeight: 1.5, color: "var(--ink-3)"
                  }}>
                    <div style={{ fontWeight: 600, color: "var(--ink-4)", marginBottom: 8 }}>Prompt: "{comparison.prompt}"</div>
                    "{comparison.base}"
                  </div>
                </div>

                {/* Fine-Tuned Model response */}
                <div>
                  <div className="label" style={{ color: sftProgress === 100 ? "var(--violet)" : "var(--ink-3)" }}>
                    Fine-tuned response {sftProgress < 100 && "🔒 (Awaiting Tuning)"}
                  </div>
                  <div style={{
                    padding: 16,
                    background: sftProgress === 100 ? "rgba(var(--violet-rgb), 0.05)" : "var(--bg-2)",
                    border: sftProgress === 100 ? "1px solid var(--violet)" : "1px dashed var(--border)",
                    boxShadow: sftProgress === 100 ? "0 0 12px rgba(var(--violet-rgb), 0.15)" : "none",
                    borderRadius: 4,
                    minHeight: 120, fontSize: 13, lineHeight: 1.5,
                    color: sftProgress === 100 ? "var(--ink-1)" : "var(--ink-4)",
                    transition: "all 0.3s"
                  }}>
                    {sftProgress < 100 ? (
                      <span className="dim" style={{ fontSize: 12 }}>Click 'Start SFT Training' above to adapt the weights to a {comparison.title}.</span>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, color: "var(--violet)", marginBottom: 8 }}>Prompt: "{comparison.prompt}"</div>
                        "{comparison.tuned}"
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Shifting probability charts */}
              {sftProgress === 100 && (
                <div style={{ marginTop: 24 }}>
                  <div className="label">Vocab Likelihood Shifting</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {comparison.words.map(w => (
                      <div key={w.w} className="card" style={{ padding: 12, background: "var(--bg-2)" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--violet)" }}>"{w.w}"</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 8, color: "var(--ink-4)" }}>
                          <span>Base: {(w.base * 100).toFixed(0)}%</span>
                          <span style={{ color: "var(--green)" }}>➔ Tuned: {(w.tuned * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RLHF PANEL */}
          {tab === "rlhf" && (
            <div>
              <div className="card" style={{ padding: 16, background: "rgba(var(--blue-rgb), 0.05)", border: "1px dashed var(--blue)", borderRadius: 6, marginBottom: 20 }}>
                <span className="label" style={{ color: "var(--blue)", marginBottom: 6 }}>Instruction Task Prompt</span>
                <div style={{ fontSize: 14, fontWeight: 500 }}>"Explain nuclear energy to a 5-year-old."</div>
              </div>

              {/* Side-by-side preference choices */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
                {/* Option A */}
                <div onClick={() => rlhfStep === 0 && choosePreference("A")}
                  style={{
                    padding: 16, background: "var(--bg-2)", border: preference === "A" ? "2px solid var(--violet)" : "1px solid var(--border)",
                    borderRadius: 4, cursor: rlhfStep === 0 ? "pointer" : "default", opacity: preference === "B" ? 0.4 : 1,
                    transition: "all 0.25s",
                    position: "relative"
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="chip">Response A (Highly Technical)</span>
                    {preference === "A" && <span style={{ color: "var(--violet)", fontSize: 11, fontWeight: 600 }}>Preferred Option</span>}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
                    "Nuclear energy is generated via chain nuclear fission of uranium-235 isotopes under controlled conditions inside water-moderated cooling reactors."
                  </p>
                  {rlhfStep === 0 && <button className="btn btn--sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>👍 Pick Choice A</button>}
                </div>

                {/* Option B */}
                <div onClick={() => rlhfStep === 0 && choosePreference("B")}
                  style={{
                    padding: 16, background: "var(--bg-2)", border: preference === "B" ? "2px solid var(--violet)" : "1px solid var(--border)",
                    borderRadius: 4, cursor: rlhfStep === 0 ? "pointer" : "default", opacity: preference === "A" ? 0.4 : 1,
                    transition: "all 0.25s",
                    position: "relative"
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="chip">Response B (Simple Analogy)</span>
                    {preference === "B" && <span style={{ color: "var(--violet)", fontSize: 11, fontWeight: 600 }}>Preferred Option</span>}
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)" }}>
                    "Nuclear energy is like a super tiny, warm sun trapped inside a giant metal boiler. It heats up water to make steam, which spins a giant wheel to make electricity!"
                  </p>
                  {rlhfStep === 0 && <button className="btn btn--sm" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>👍 Pick Choice B</button>}
                </div>
              </div>

              {/* Feedbacks Backpropagation Graph */}
              {rlhfStep > 0 && (
                <div className="card" style={{ padding: 18, background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className="label" style={{ marginBottom: 0 }}>RLHF Reward Gradients backprop...</span>
                    {rlhfStep === 2 && <button className="btn btn--sm btn--ghost" onClick={resetRLHF}>↺ Reset preference arena</button>}
                  </div>

                  {rlhfStep === 1 && (
                    <div style={{ textAlign: "center", padding: "12px 0", color: "var(--violet)" }}>
                      <span className="dot dot--pulse" /> Flowing gradients to align logits...
                    </div>
                  )}

                  {rlhfStep === 2 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {simpleProbs.map(item => {
                        const isSimple = ["sun", "wheel"].includes(item.word);
                        return (
                          <div key={item.word} style={{ display: "grid", gridTemplateColumns: "100px 1fr 60px", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", textAlign: "right" }}>"{item.word}"</span>
                            <div style={{ height: 12, background: "var(--bg-1)", borderRadius: 2, position: "relative" }}>
                              <div style={{
                                width: `${item.p * 100}%`, height: "100%",
                                background: isSimple ? "var(--green)" : "var(--pink)",
                                borderRadius: 2, transition: "width 0.25s"
                              }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isSimple ? "var(--green)" : "var(--pink)" }}>
                              {(item.p * 100).toFixed(0)}% {isSimple ? "▲" : "▼"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Aligning LLMs via SFT and Preference Learning">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">Alignment stages</div>
            <ol style={{ paddingLeft: 16, marginTop: 8, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.8 }}>
              <li><strong>1. Pre-training:</strong> Predicts next word on web text. Models general grammar.</li>
              <li style={{ marginTop: 4 }}><strong>2. Supervised Fine-Tuning:</strong> Teaches model to format outputs as helpful Assistant answers on specific domain datasets.</li>
              <li style={{ marginTop: 4 }}><strong>3. RLHF / DPO Alignment:</strong> Learns safety, tone, and formatting constraints from pair comparisons.</li>
            </ol>
          </div>
        }>
          <p>
            When a Large Language Model completes its basic Pre-training, it is nothing more than a next-word predictor. If you ask it <em>"What is the capital of France?"</em>, it might respond with <em>"What is the capital of Spain? What is the capital of Germany?"</em> because it assumes you are writing a checklist of questions rather than requesting an answer.
          </p>
          <p style={{ marginTop: 14 }}>
            To shape this text engine into a useful agent, we apply two key Post-Training strategies:
          </p>
          <p style={{ marginTop: 14 }}>
            <strong>Supervised Fine-Tuning (SFT)</strong> feeds thousands of high-quality conversational prompts and target answers to the model. By adjusting model weights to favor these targets, the model adopts the desired tone, language format, and domain knowledge (such as writing in precise legal clauses or polite support chat templates).
          </p>
          <p style={{ marginTop: 14 }}>
            <strong>Reinforcement Learning from Human Feedback (RLHF)</strong> or <strong>Direct Preference Optimization (DPO)</strong> pairs up two candidate responses to the same prompt and trains the network on human preferences. When humans pick simple, helpful explanations over dense academic jargon, the model's reward signal shifts token weights — boosting the probability of helpful words and subduing complex or toxic terms.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="DPO fine-tuning loop in python">
        <Code>{`# Visualising a Direct Preference Optimization (DPO) objective
import torch
import torch.nn.functional as F

def compute_dpo_loss(policy_model, reference_model, prompt, preferred, rejected):
    # Get word probabilities under the active policy model
    log_probs_policy_pref = policy_model(prompt, preferred).log_prob
    log_probs_policy_rej  = policy_model(prompt, rejected).log_prob

    # Compare against the static reference model to avoid domain drift
    log_probs_ref_pref = reference_model(prompt, preferred).log_prob
    log_probs_ref_rej  = reference_model(prompt, rejected).log_prob

    # DPO Loss pushes policy log ratio above reference log ratio
    policy_ratio = log_probs_policy_pref - log_probs_policy_rej
    reference_ratio = log_probs_ref_pref - log_probs_ref_rej
    
    loss = -F.logsigmoid(policy_ratio - reference_ratio).mean()
    return loss`}</Code>
      </Section>

      <Section eyebrow="experiments" title="Try these tests">
        <Experiments items={[
          "Select Supervised Fine-Tuning. Toggle between the Legal AI and Support Bot domains, then hit 'Start SFT Training'. Watch how SFT progresses and adapts the vocabulary weights.",
          "Examine the probability outputs under the SFT tab. See how legal terms like 'pursuant' jump from 1% to 65% chance of selection because of the domain SFT.",
          "Switch to the RLHF tab. Note the base technical explanation A vs. the aligned analogy B. Click thumbs-up on Response B (Simple Analogy).",
          "Observe the RLHF reward feedback shifting the bar heights. Jargon words like 'isotopes' are suppressed to 5% probability, while simple words like 'sun' surge to 58%."
        ]} />
      </Section>
    </React.Fragment>
  );
}

export default FineTuningRlhfDemo;
