import React, { useState, useEffect } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Tool use / function calling
// ============================================================

const TOOLS = [
  {
    name: "get_weather",
    desc: "Get current weather for a city.",
    schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. 'Tokyo'" },
        units: { type: "string", enum: ["celsius", "fahrenheit"], default: "celsius" },
      },
      required: ["city"],
    },
    impl: (args) => {
      const data = {
        "Tokyo":   { temp: 18, conditions: "light rain", humidity: 78 },
        "Paris":   { temp: 12, conditions: "cloudy",     humidity: 65 },
        "Sydney":  { temp: 24, conditions: "sunny",      humidity: 55 },
        "Cairo":   { temp: 31, conditions: "clear",      humidity: 22 },
        "Reykjavik": { temp: 4, conditions: "snow",       humidity: 81 },
      };
      const d = data[args.city] || { temp: 20, conditions: "unknown", humidity: 50 };
      const temp = args.units === "fahrenheit" ? Math.round(d.temp * 9/5 + 32) : d.temp;
      return { city: args.city, temp, units: args.units || "celsius", conditions: d.conditions, humidity_pct: d.humidity };
    },
  },
  {
    name: "calculate",
    desc: "Evaluate a math expression.",
    schema: {
      type: "object",
      properties: { expression: { type: "string", description: "JavaScript-like math, e.g. '2 + 3 * 4'" } },
      required: ["expression"],
    },
    impl: (args) => {
      try {
        // very limited safe eval — only digits and operators
        if (!/^[\d+\-*/.()\s]+$/.test(args.expression)) {
          return { error: "expression contains invalid characters" };
        }
        const result = Function('"use strict"; return (' + args.expression + ')')();
        return { result };
      } catch (e) {
        return { error: e.message };
      }
    },
  },
  {
    name: "search_products",
    desc: "Search the product catalog by name or category.",
    schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        max_results: { type: "integer", default: 3 },
      },
      required: ["query"],
    },
    impl: (args) => {
      const all = [
        { sku: "MX-1", name: "Mechanical Keyboard",     price: 149, category: "electronics" },
        { sku: "MX-2", name: "Wireless Mouse",          price: 49,  category: "electronics" },
        { sku: "MX-3", name: "USB-C Hub (7-port)",      price: 39,  category: "electronics" },
        { sku: "GR-1", name: "Espresso Beans, 1lb",     price: 22,  category: "grocery" },
        { sku: "GR-2", name: "Steel Cut Oats, 2lb",     price: 8,   category: "grocery" },
      ];
      const q = args.query.toLowerCase();
      return all
        .filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        .slice(0, args.max_results || 3);
    },
  },
];

const TOOL_SCENARIOS = [
  {
    user: "What's the weather in Tokyo right now?",
    steps: [
      { type: "thought", text: "User wants current weather. I should call get_weather." },
      { type: "tool_call", tool: "get_weather", args: { city: "Tokyo", units: "celsius" } },
      { type: "answer", text: "It's 18°C and lightly raining in Tokyo right now, with 78% humidity." },
    ],
  },
  {
    user: "Compare the weather in Cairo and Reykjavik in fahrenheit.",
    steps: [
      { type: "thought", text: "Two cities, both in fahrenheit. I'll call get_weather twice." },
      { type: "tool_call", tool: "get_weather", args: { city: "Cairo", units: "fahrenheit" } },
      { type: "tool_call", tool: "get_weather", args: { city: "Reykjavik", units: "fahrenheit" } },
      { type: "answer", text: "Big contrast: Cairo is 88°F and clear (low humidity at 22%), while Reykjavik is 39°F with snow and 81% humidity. About a 50°F gap." },
    ],
  },
  {
    user: "What is 137 * 248 + 2900?",
    steps: [
      { type: "thought", text: "Arithmetic — easier and more reliable to call the calculator than try to compute mentally." },
      { type: "tool_call", tool: "calculate", args: { expression: "137 * 248 + 2900" } },
      { type: "answer", text: "137 × 248 + 2,900 = 36,876." },
    ],
  },
  {
    user: "Do you have any keyboards in stock under $200?",
    steps: [
      { type: "thought", text: "I need to search products. The user mentioned keyboards." },
      { type: "tool_call", tool: "search_products", args: { query: "keyboard", max_results: 5 } },
      { type: "answer", text: "Yes — we have the Mechanical Keyboard (MX-1) for $149, which is under your $200 budget." },
    ],
  },
];

function ToolsDemo() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(-1);  // -1 = nothing run yet
  const [running, setRunning] = useState(false);

  const scenario = TOOL_SCENARIOS[scenarioIdx];

  // Auto-run
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      if (stepIdx < scenario.steps.length - 1) setStepIdx(stepIdx + 1);
      else setRunning(false);
    }, 1100);
    return () => clearTimeout(t);
  }, [running, stepIdx, scenario]);

  function reset() { setStepIdx(-1); setRunning(false); }
  function send()  { reset(); setTimeout(() => setRunning(true), 50); }

  const visibleSteps = stepIdx >= 0 ? scenario.steps.slice(0, stepIdx + 1) : [];

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="The model calls your function. Watches the result. Replies.">
        <Stage padding={0}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", minHeight: 540 }}>
            {/* Chat */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column" }}>
              <div className="label">scenario</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {TOOL_SCENARIOS.map((s, i) => (
                  <button key={i}
                    className={`btn btn--sm ${i === scenarioIdx ? "btn--primary" : ""}`}
                    onClick={() => { setScenarioIdx(i); reset(); }}
                    style={{ textTransform: "none", letterSpacing: 0, fontSize: 11 }}
                  >{s.user.slice(0, 32)}{s.user.length > 32 ? "…" : ""}</button>
                ))}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <Bubble role="user">{scenario.user}</Bubble>
                {visibleSteps.map((s, i) => <StepBubble key={i} step={s} />)}
                {running && stepIdx < scenario.steps.length - 1 && (
                  <Bubble role="thinking"><span className="dot dot--pulse" /> thinking…</Bubble>
                )}
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button className="btn btn--ghost btn--sm" onClick={reset}>↺ reset</button>
                <button className="btn btn--sm" disabled={stepIdx >= scenario.steps.length - 1} onClick={() => setStepIdx(stepIdx + 1)}>step →</button>
                <button className="btn btn--primary btn--sm" onClick={send} style={{ marginLeft: "auto" }}>▶ run</button>
              </div>
            </div>

            {/* Tools panel */}
            <div style={{
              padding: 24, borderLeft: "1px solid var(--border)", background: "var(--bg-2)",
              overflowY: "auto",
            }}>
              <div className="label">tools available</div>
              <p className="muted" style={{ fontSize: 11.5, marginBottom: 16 }}>
                The model sees these definitions and decides when (and how) to call them.
              </p>
              {TOOLS.map(t => (
                <details key={t.name} style={{
                  background: "var(--bg-1)", border: "1px solid var(--border)",
                  borderRadius: 4, padding: "10px 12px", marginBottom: 8,
                }}>
                  <summary style={{ cursor: "pointer", fontSize: 12.5 }}>
                    <code style={{ color: "var(--green)" }}>{t.name}</code>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>{t.desc}</span>
                  </summary>
                  <pre style={{
                    margin: "8px 0 0",
                    fontSize: 10.5,
                    color: "var(--ink-3)",
                    background: "var(--bg)",
                    padding: 10,
                    borderRadius: 3,
                    overflowX: "auto",
                  }}>{JSON.stringify(t.schema, null, 2)}</pre>
                </details>
              ))}
            </div>
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="The model writes JSON, your code runs it">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">where this matters</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.9 }}>
              <li>get current data (weather, prices, status)</li>
              <li>take actions (send email, create ticket)</li>
              <li>do math / code execution reliably</li>
              <li>query databases the model can't memorize</li>
              <li>compose APIs into multi-step workflows</li>
            </ul>
          </div>
        }>
          <p>
            <strong style={{ color: "var(--green)" }}>Tool use</strong> (a.k.a. function calling)
            extends a language model from a text-completion service into something that can interact
            with the world.
          </p>
          <p style={{ marginTop: 16 }}>
            You give the model a list of tools — each a name, description, and JSON Schema for the
            arguments. The model decides whether and how to call them by emitting a special
            structured response: <code>{`{"tool": "get_weather", "args": {...}}`}</code>. Your code
            executes the tool, captures the result, sends it back to the model. The model produces a
            human-friendly answer.
          </p>
          <p style={{ marginTop: 16 }}>
            The clarity of your tool definitions matters more than almost anything else. Vague
            descriptions → wrong tool choice. Loose schemas → broken downstream code. Real engineering
            time goes into the contract, not the prompt.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`from anthropic import Anthropic
client = Anthropic()

tools = [{
    "name": "get_weather",
    "description": "Get current weather for a city.",
    "input_schema": {
        "type": "object",
        "properties": {
            "city": {"type": "string"},
            "units": {"type": "string", "enum": ["celsius", "fahrenheit"]},
        },
        "required": ["city"],
    },
}]

def get_weather(city, units="celsius"):
    return {"temp": 18, "conditions": "rainy"}

messages = [{"role": "user", "content": "What's the weather in Tokyo?"}]
while True:
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )
    if resp.stop_reason == "tool_use":
        # Find the tool call, run it, append the result
        for block in resp.content:
            if block.type == "tool_use":
                result = get_weather(**block.input)
                messages.append({"role": "assistant", "content": resp.content})
                messages.append({"role": "user", "content": [{
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                }]})
    else:
        print(resp.content[0].text)
        break`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Run the multi-city weather scenario. Notice the model calls get_weather twice in parallel — modern models can request multiple tools per turn.",
          "Try the math question. The model knows arithmetic but defers to the calculator. That's a feature: tools are more reliable than the model for things tools are good at.",
          "Click 'reset' and step manually through each phase. The thought is the model's internal reasoning. The tool_call is what your code intercepts.",
          "In production you also need to handle errors: invalid args, tool failures, timeouts. The model handles them gracefully if you pass the error back as the tool result.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

function Bubble({ role, children }) {
  const colors = {
    user:      { bg: "var(--bg-2)", border: "var(--border-bright)", label: "user",      labelColor: "var(--ink-3)" },
    thinking:  { bg: "transparent", border: "transparent",          label: "",          labelColor: "var(--ink-4)" },
    thought:   { bg: "rgba(var(--violet-rgb), 0.06)", border: "rgba(var(--violet-rgb), 0.25)", label: "thought",   labelColor: "var(--violet)" },
    tool_call: { bg: "rgba(var(--yellow-rgb), 0.06)",   border: "rgba(var(--yellow-rgb), 0.3)",   label: "tool_call", labelColor: "var(--yellow)" },
    tool_result:{bg: "rgba(var(--blue-rgb), 0.06)", border: "rgba(var(--blue-rgb), 0.3)", label: "tool_result", labelColor: "var(--blue)" },
    answer:    { bg: "rgba(var(--green-rgb), 0.06)",   border: "rgba(var(--green-rgb), 0.3)",   label: "answer",    labelColor: "var(--green)" },
  };
  const c = colors[role] || colors.user;
  return (
    <div style={{
      padding: "10px 14px",
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 4,
      fontSize: 13,
      color: "var(--ink-2)",
      lineHeight: 1.5,
    }}>
      {c.label && (
        <div style={{
          fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
          color: c.labelColor, marginBottom: 6, fontWeight: 600,
        }}>{c.label}</div>
      )}
      {children}
    </div>
  );
}

function StepBubble({ step }) {
  if (step.type === "thought") {
    return <Bubble role="thought">{step.text}</Bubble>;
  }
  if (step.type === "tool_call") {
    const tool = TOOLS.find(t => t.name === step.tool);
    const result = tool ? tool.impl(step.args) : { error: "unknown tool" };
    return (
      <React.Fragment>
        <Bubble role="tool_call">
          <code style={{ color: "var(--yellow)" }}>{step.tool}</code>
          <pre style={{
            margin: "6px 0 0", fontSize: 11.5,
            color: "var(--ink-3)", whiteSpace: "pre-wrap",
          }}>{JSON.stringify(step.args, null, 2)}</pre>
        </Bubble>
        <Bubble role="tool_result">
          <pre style={{
            margin: 0, fontSize: 11.5,
            color: "var(--ink-2)", whiteSpace: "pre-wrap", wordBreak: "break-all",
          }}>{JSON.stringify(result, null, 2)}</pre>
        </Bubble>
      </React.Fragment>
    );
  }
  if (step.type === "answer") {
    return <Bubble role="answer">{step.text}</Bubble>;
  }
  return null;
}

export default ToolsDemo;
