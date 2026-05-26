import React, { useState } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Prompt engineering — zero-shot, few-shot, chain-of-thought
// ============================================================

// Tasks with simulated outputs for each prompt style
const PROMPT_TASKS = {
  "sentiment-classification": {
    label: "Sentiment classification",
    input: "The pizza was cold and the waiter ignored us.",
    inputLabel: "review",
    prompts: {
      "zero-shot": {
        label: "Zero-shot",
        text: `Classify the sentiment of this review as positive, neutral, or negative.

Review: "The pizza was cold and the waiter ignored us."
Sentiment:`,
        output: "negative",
        correct: true,
      },
      "few-shot": {
        label: "Few-shot",
        text: `Classify the sentiment of the review as positive, neutral, or negative.

Review: "Best burger I've had in years!"
Sentiment: positive

Review: "Food was fine, service was forgettable."
Sentiment: neutral

Review: "Took 90 minutes and the soup was cold."
Sentiment: negative

Review: "The pizza was cold and the waiter ignored us."
Sentiment:`,
        output: "negative",
        correct: true,
      },
      "chain-of-thought": {
        label: "Chain-of-thought",
        text: `Classify the sentiment of this review. Think step by step before answering.

Review: "The pizza was cold and the waiter ignored us."

Let's analyze:`,
        output: `1. "Cold pizza" → negative signal about the food.
2. "Waiter ignored us" → negative signal about the service.
3. Both food and service are described negatively, no positive offsets.

Sentiment: negative`,
        correct: true,
      },
    },
  },
  "word-problem": {
    label: "Math word problem",
    input: "Roger has 5 tennis balls. He buys 2 cans, each with 3 balls. How many does he have now?",
    inputLabel: "problem",
    prompts: {
      "zero-shot": {
        label: "Zero-shot",
        text: `Q: Roger has 5 tennis balls. He buys 2 cans, each with 3 balls. How many does he have now?

A:`,
        output: "11 balls",
        correct: true,
        note: "Sometimes works for simple cases. Often fails on multi-step problems.",
      },
      "few-shot": {
        label: "Few-shot (no reasoning)",
        text: `Q: A library has 50 books. They get 20 more. How many do they have?
A: 70 books

Q: Sarah ran 3 miles each day for 4 days. How many miles total?
A: 12 miles

Q: Roger has 5 tennis balls. He buys 2 cans, each with 3 balls. How many does he have now?
A:`,
        output: "11 balls",
        correct: true,
        note: "Examples teach the format. Still fragile on harder problems.",
      },
      "chain-of-thought": {
        label: "Chain-of-thought",
        text: `Q: A library has 50 books. They get 20 more. How many do they have?
A: They started with 50. They got 20 more. 50 + 20 = 70. The answer is 70.

Q: Roger has 5 tennis balls. He buys 2 cans, each with 3 balls. How many does he have now?
A:`,
        output: `Roger starts with 5 balls. He buys 2 cans of 3 balls each, which is 2 × 3 = 6 balls. So he now has 5 + 6 = 11. The answer is 11.`,
        correct: true,
        note: "Showing reasoning in the example unlocks much higher accuracy on harder math.",
      },
    },
  },
  "extraction": {
    label: "Structured extraction",
    input: "Anna Park, 34, an engineer at Acme Robotics in Tokyo, is leading the new lidar project.",
    inputLabel: "sentence",
    prompts: {
      "zero-shot": {
        label: "Zero-shot",
        text: `Extract the person, age, role, and company from the sentence.

Sentence: "Anna Park, 34, an engineer at Acme Robotics in Tokyo, is leading the new lidar project."`,
        output: `Person: Anna Park
Age: 34
Role: engineer
Company: Acme Robotics`,
        correct: true,
        note: "Ambiguous output format — hard to parse downstream.",
      },
      "few-shot": {
        label: "Few-shot (with format)",
        text: `Extract fields as JSON.

Sentence: "Karim, 28, runs sales at Northwind Outdoors."
{"person":"Karim","age":28,"role":"sales lead","company":"Northwind Outdoors"}

Sentence: "Anna Park, 34, an engineer at Acme Robotics in Tokyo, is leading the new lidar project."`,
        output: `{"person":"Anna Park","age":34,"role":"engineer","company":"Acme Robotics"}`,
        correct: true,
        note: "Examples lock the format. JSON parses cleanly.",
      },
      "chain-of-thought": {
        label: "Chain-of-thought",
        text: `Extract person, age, role, company as JSON. Reason about each field first.

Sentence: "Anna Park, 34, an engineer at Acme Robotics in Tokyo, is leading the new lidar project."`,
        output: `Reasoning:
- Person: "Anna Park" appears at the start.
- Age: "34" follows the comma after the name.
- Role: "engineer" — the noun describing her job.
- Company: "Acme Robotics" — the company she's at.

{"person":"Anna Park","age":34,"role":"engineer","company":"Acme Robotics"}`,
        correct: true,
        note: "Overkill for extraction. CoT helps reasoning, not pattern-matching.",
      },
    },
  },
};

function PromptEngineeringDemo() {
  const [taskId, setTaskId] = useState("word-problem");
  const [activeStyles, setActiveStyles] = useState(["zero-shot", "few-shot", "chain-of-thought"]);

  const task = PROMPT_TASKS[taskId];

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="Same task, three structures">
        <Stage>
          <div className="label">task</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {Object.entries(PROMPT_TASKS).map(([k, t]) => (
              <button key={k}
                className={`btn btn--sm ${k === taskId ? "btn--primary" : ""}`}
                onClick={() => setTaskId(k)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="label">{task.inputLabel}</div>
          <div style={{
            padding: "12px 16px",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            fontSize: 14,
            marginBottom: 24,
            fontStyle: "italic",
            color: "var(--ink-1)",
          }}>"{task.input}"</div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}>
            {Object.entries(task.prompts).map(([style, p]) => (
              <PromptCard key={style} style={style} prompt={p} />
            ))}
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="Why structure shifts the answer">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">other techniques</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.9 }}>
              <li><strong>Role priming</strong> · "You are a senior tax accountant…"</li>
              <li><strong>Self-consistency</strong> · sample N CoT chains, vote</li>
              <li><strong>Tree-of-thought</strong> · branch + prune reasoning paths</li>
              <li><strong>Reflexion</strong> · generate, critique, regenerate</li>
              <li><strong>ReAct</strong> · interleave reasoning + tool calls</li>
            </ul>
          </div>
        }>
          <p>
            The model is conditioned on everything in its context — including your prompt. Changing the
            shape of the prompt changes the distribution over likely continuations. That's the entire
            theory of prompt engineering.
          </p>
          <p style={{ marginTop: 16 }}>
            <strong style={{ color: "var(--green)" }}>Zero-shot</strong> asks directly. Cheapest, but
            relies on the model to figure out format and approach.{" "}
            <strong style={{ color: "var(--green)" }}>Few-shot</strong> shows 1-5 examples — this is
            shockingly effective for locking format and demonstrating edge cases.{" "}
            <strong style={{ color: "var(--green)" }}>Chain-of-thought</strong> asks the model to "think
            step by step" — by writing reasoning tokens first, accuracy on math, logic, and multi-hop
            questions jumps dramatically.
          </p>
          <p style={{ marginTop: 16 }}>
            Modern reasoning models (Claude, o1, DeepSeek-R1) build CoT into the architecture — you
            don't have to prompt for it. But on every other model, a "let's think step by step" prefix
            is the cheapest accuracy boost in the field.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`from anthropic import Anthropic
client = Anthropic()

# Few-shot prompt baked into the system message
SYSTEM = """You extract structured data as JSON. Examples:

Input: "Karim, 28, runs sales at Northwind Outdoors."
Output: {"person":"Karim","age":28,"role":"sales lead","company":"Northwind Outdoors"}

Input: "Lina, 41, marketing director at BlueSky."
Output: {"person":"Lina","age":41,"role":"marketing director","company":"BlueSky"}
"""

def extract(sentence: str) -> dict:
    msg = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=200,
        temperature=0,
        system=SYSTEM,
        messages=[{"role": "user", "content": f'Input: "{sentence}"\\nOutput:'}],
    )
    return json.loads(msg.content[0].text)`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Switch to the math task. Notice how chain-of-thought writes out '5 + 6 = 11' before the answer — that's what makes it more reliable than zero-shot guessing.",
          "On extraction, the few-shot example locks the JSON format. Without it, the model picks any format it likes and your parser breaks.",
          "Few-shot examples are leaky teachers: if all your examples have similar structure, the model copies it. Vary your examples to teach the boundary.",
          "Beyond ~5 examples, returns diminish. Burn tokens on better examples, not more examples.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

function PromptCard({ style, prompt }) {
  const styleColors = {
    "zero-shot":         "var(--blue)",
    "few-shot":          "var(--yellow)",
    "chain-of-thought":  "var(--green)",
  };
  const c = styleColors[style];
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: 4,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, color: c, fontWeight: 600 }}>{prompt.label}</span>
        <span style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {prompt.text.split("\n").length} lines
        </span>
      </div>
      <pre style={{
        margin: 0,
        padding: 14,
        fontSize: 11.5,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: "var(--ink-3)",
        background: "var(--bg-1)",
        minHeight: 200,
        maxHeight: 240,
        overflowY: "auto",
        borderBottom: "1px solid var(--border)",
        flex: 1,
        fontFamily: "var(--font-mono)",
      }}>{prompt.text}</pre>
      <div style={{
        padding: 14,
        background: "rgba(var(--green-rgb), 0.04)",
        borderTop: "1px solid rgba(var(--green-rgb), 0.15)",
      }}>
        <div style={{
          fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--green)", marginBottom: 6,
        }}>
          ← model output
        </div>
        <pre style={{
          margin: 0, fontSize: 12, lineHeight: 1.55,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          color: "var(--ink-1)", fontFamily: "var(--font-mono)",
        }}>{prompt.output}</pre>
        {prompt.note && (
          <p className="muted" style={{ fontSize: 11, marginTop: 10, fontStyle: "italic", lineHeight: 1.4 }}>
            {prompt.note}
          </p>
        )}
      </div>
    </div>
  );
}

export default PromptEngineeringDemo;
