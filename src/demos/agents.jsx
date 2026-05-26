import React, { useState, useEffect, useRef } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Agentic workflows — thought → action → observation → repeat
// ============================================================

const AGENT_TASKS = {
  "trip-planner": {
    label: "Plan a weekend in Tokyo (under $1500)",
    goal: "Plan a 3-day trip to Tokyo within a $1500 total budget. Find flights, hotel, and 3 things to do.",
    steps: [
      {
        thought: "I need flights, a hotel, and activities. Let me start with the biggest cost — flights.",
        action: { tool: "search_flights", args: { from: "SFO", to: "HND", date: "2026-06-12" } },
        observation: { results: [
          { airline: "ANA", price: 780, stops: 0 },
          { airline: "JAL", price: 820, stops: 0 },
          { airline: "Singapore", price: 690, stops: 1 },
        ]},
      },
      {
        thought: "Singapore is cheapest at $690 but has a stop. ANA is $780 nonstop — worth the $90 for a 3-day trip. I'll go with ANA. Remaining budget: $720. Now hotel.",
        action: { tool: "search_hotels", args: { city: "Tokyo", checkin: "2026-06-12", nights: 3, max_per_night: 200 } },
        observation: { results: [
          { name: "Hotel Gracery Shinjuku",  per_night: 145, rating: 4.3 },
          { name: "APA Hotel Asakusa",        per_night: 95,  rating: 3.9 },
          { name: "Park Hyatt Tokyo",         per_night: 480, rating: 4.8 },
        ]},
      },
      {
        thought: "Park Hyatt blows the budget. Hotel Gracery at $145 × 3 = $435 fits well, in a good area. Remaining: $720 - $435 = $285 for everything else (food, transit, activities).",
        action: { tool: "check_weather", args: { city: "Tokyo", date: "2026-06-12" } },
        observation: { forecast: "rainy, 22°C all weekend (rainy season)" },
      },
      {
        thought: "Rainy season — outdoor activities are risky. I should bias toward indoor stuff.",
        action: { tool: "get_attractions", args: { city: "Tokyo", filter: "indoor", max: 5 } },
        observation: { results: [
          { name: "teamLab Planets",      price: 30, type: "art" },
          { name: "Tsukiji Outer Market", price: 0,  type: "food" },
          { name: "Studio Ghibli Museum", price: 25, type: "museum" },
          { name: "Shibuya Sky Observatory", price: 22, type: "view" },
          { name: "Robot Restaurant",     price: 80, type: "show" },
        ]},
      },
      {
        thought: "teamLab + Ghibli + Tsukiji is a great trio: $55 total, all indoor-friendly, three different vibes. Done planning.",
        action: null,
        answer: `**3-day Tokyo trip — total $1,270**

✈️ ANA SFO→HND nonstop — $780
🏨 Hotel Gracery Shinjuku, 3 nights — $435
🎨 teamLab Planets — $30
🎬 Studio Ghibli Museum — $25
🍣 Tsukiji Outer Market (free, eat-as-you-go)

Note: rainy season, all three activities are indoor.
$230 buffer for food, transit, and surprises.`,
      },
    ],
  },
  "bug-triage": {
    label: "Triage and reply to a GitHub bug",
    goal: "Find the most upvoted open bug in our repo, check if a fix exists, and post a status reply.",
    steps: [
      {
        thought: "First, find open issues labeled 'bug', sorted by reactions.",
        action: { tool: "github.list_issues", args: { repo: "acme/widget", label: "bug", sort: "reactions", state: "open" } },
        observation: { issues: [
          { num: 421, title: "App crashes on iOS 17 when uploading >5MB files", reactions: 47 },
          { num: 388, title: "Dark mode toggle resets on reload",                reactions: 22 },
          { num: 365, title: "Typo in welcome email",                            reactions: 8 },
        ]},
      },
      {
        thought: "#421 is by far the top. Let me read the full thread to understand it.",
        action: { tool: "github.get_issue", args: { repo: "acme/widget", num: 421 } },
        observation: { title: "App crashes on iOS 17 when uploading >5MB files", body: "Reproduced on iPhone 15. Stack trace points to multipart upload chunking.", comments: 18 },
      },
      {
        thought: "Now check if there's a merged PR that fixes this.",
        action: { tool: "github.search_prs", args: { repo: "acme/widget", query: "ios 17 upload fix" } },
        observation: { prs: [
          { num: 437, title: "fix: upload chunking for large files on iOS 17", merged: true, version: "2.4.1" },
        ]},
      },
      {
        thought: "Fix shipped in 2.4.1. I'll post a status reply on the issue and close it.",
        action: { tool: "github.comment_issue", args: { repo: "acme/widget", num: 421, body: "Fixed in v2.4.1 via #437 — please update and reopen if you can still reproduce. Thanks for the detailed report!" } },
        observation: { ok: true, comment_id: 9941 },
      },
      {
        thought: "Comment posted. Now close the issue.",
        action: { tool: "github.close_issue", args: { repo: "acme/widget", num: 421 } },
        observation: { ok: true, state: "closed" },
      },
      {
        thought: "Task complete.",
        action: null,
        answer: `Done. Triaged issue #421 (47 reactions), confirmed the iOS 17 upload crash was fixed by merged PR #437 (shipped in v2.4.1), posted a status comment, and closed the issue.`,
      },
    ],
  },
};

function AgentsDemo() {
  const [taskId, setTaskId] = useState("trip-planner");
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const containerRef = useRef(null);

  const task = AGENT_TASKS[taskId];
  const visible = step >= 0 ? task.steps.slice(0, step + 1) : [];
  const done = step >= task.steps.length - 1;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      if (step < task.steps.length - 1) setStep(step + 1);
      else setRunning(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [running, step, task]);

  function reset() { setStep(-1); setRunning(false); }
  function run()   { reset(); setTimeout(() => setRunning(true), 50); }

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="A loop that solves multi-step tasks">
        <Stage>
          <div className="label">task</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {Object.entries(AGENT_TASKS).map(([k, t]) => (
              <button key={k}
                className={`btn btn--sm ${k === taskId ? "btn--primary" : ""}`}
                onClick={() => { setTaskId(k); reset(); }}
              >{t.label}</button>
            ))}
          </div>

          <div style={{
            padding: "14px 16px", background: "var(--bg-2)",
            border: "1px solid var(--border)", borderRadius: 4,
            fontSize: 13, color: "var(--ink-1)", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span className="chip chip--green">GOAL</span>
            <span>{task.goal}</span>
          </div>

          {/* ReAct loop visualization */}
          <div ref={containerRef} style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: 20,
            minHeight: 380,
            maxHeight: 540,
            overflowY: "auto",
            position: "relative",
          }}>
            {visible.length === 0 && (
              <div className="dim" style={{ textAlign: "center", padding: 60, fontSize: 13 }}>
                press <strong>run</strong> to watch the agent work →
              </div>
            )}
            <div style={{ position: "relative" }}>
              {/* timeline */}
              {visible.length > 0 && (
                <div style={{
                  position: "absolute", left: 18, top: 12, bottom: 12,
                  width: 1, background: "var(--border-bright)",
                }} />
              )}

              {visible.map((s, i) => (
                <Iteration key={i} step={s} idx={i} isLast={i === visible.length - 1 && !done} />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={reset}>↺ reset</button>
            <button className="btn btn--sm" disabled={step >= task.steps.length - 1}
              onClick={() => setStep(step + 1)}>iterate →</button>
            <button className="btn btn--sm btn--primary" onClick={run} style={{ marginLeft: "auto" }}>
              ▶ run autonomously
            </button>
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="A while-loop with reasoning">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">failure modes</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.9 }}>
              <li>· infinite loops</li>
              <li>· tool result misinterpreted</li>
              <li>· cost blowup mid-task</li>
              <li>· gets "stuck" trying same action</li>
              <li>· stops too early ("I think I'm done")</li>
            </ul>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
              Production agents need budget limits, observability, and human-in-the-loop checkpoints.
            </p>
          </div>
        }>
          <p>
            An <strong style={{ color: "var(--green)" }}>agent</strong> is just a while-loop where
            each iteration is: model decides next action, code executes it, result feeds back into
            the model. Repeat until the model says it's done.
          </p>
          <p style={{ marginTop: 16 }}>
            The dominant pattern is <strong>ReAct</strong> (Reason + Act): each turn, the model
            produces a <strong>thought</strong> (private reasoning), an <strong>action</strong>{" "}
            (tool call), then sees an <strong>observation</strong> (tool result). Repeat. The thought
            stream is what makes the agent steerable and debuggable — you can read its mind.
          </p>
          <p style={{ marginTop: 16 }}>
            Notice the model in the trip example actually adapts: it sees the budget shrinking,
            chooses cheaper hotels accordingly, and pivots to indoor activities once it learns about
            the weather. That's the difference between an agent and a script — it reacts to what it
            sees.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`from anthropic import Anthropic
client = Anthropic()

def run_agent(goal: str, tools, max_iters=10):
    messages = [{"role": "user", "content": goal}]
    for i in range(max_iters):
        resp = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2048,
            tools=tools,
            messages=messages,
        )
        # Append the assistant turn (may contain thought + tool_use blocks)
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason == "end_turn":
            return resp.content[-1].text  # final answer

        # Execute every tool_use block, gather results
        tool_results = []
        for block in resp.content:
            if block.type == "tool_use":
                result = TOOL_REGISTRY[block.name](**block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result),
                })
        messages.append({"role": "user", "content": tool_results})

    raise RuntimeError("agent exceeded max iterations")`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Run the trip planner. Watch the agent revise its plan when it sees the weather forecast — that's planning under uncertainty.",
          "Run the bug-triage task. Notice the agent chains 5 tool calls without you telling it the order — it figures out the sequence from the goal.",
          "Each step costs tokens AND a roundtrip. Long agentic chains can be slow and expensive — production agents cap iterations and budget.",
          "Agents shine when (a) the steps depend on each other's results and (b) you can't enumerate the steps in advance. For everything else, a regular script is better.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

function Iteration({ step, idx, isLast }) {
  const hasAction = !!step.action;
  return (
    <div style={{ position: "relative", paddingLeft: 44, marginBottom: 22 }}>
      {/* numbered dot */}
      <div style={{
        position: "absolute", left: 4, top: 0,
        width: 28, height: 28, borderRadius: 999,
        background: hasAction ? "var(--bg-3)" : "var(--green)",
        border: `2px solid ${hasAction ? "var(--border-bright)" : "var(--green)"}`,
        color: hasAction ? "var(--ink-2)" : "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)",
        zIndex: 1,
      }}>{hasAction ? idx + 1 : "★"}</div>

      {/* thought */}
      <div style={{
        padding: "8px 12px",
        background: "rgba(var(--violet-rgb), 0.06)",
        border: "1px solid rgba(var(--violet-rgb), 0.2)",
        borderRadius: 4,
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--violet)", marginBottom: 4, fontWeight: 600,
        }}>thought</div>
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{step.thought}</div>
      </div>

      {/* action + observation */}
      {step.action && (
        <React.Fragment>
          <div style={{
            padding: "8px 12px",
            background: "rgba(var(--yellow-rgb), 0.06)",
            border: "1px solid rgba(var(--yellow-rgb), 0.25)",
            borderRadius: 4,
            marginBottom: 6,
          }}>
            <div style={{
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--yellow)", marginBottom: 4, fontWeight: 600,
            }}>action</div>
            <code style={{ fontSize: 12, color: "var(--yellow)" }}>
              {step.action.tool}({Object.entries(step.action.args).map(([k, v]) =>
                `${k}=${JSON.stringify(v)}`).join(", ")})
            </code>
          </div>
          <div style={{
            padding: "8px 12px",
            background: "rgba(var(--blue-rgb), 0.06)",
            border: "1px solid rgba(var(--blue-rgb), 0.2)",
            borderRadius: 4,
          }}>
            <div style={{
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--blue)", marginBottom: 4, fontWeight: 600,
            }}>observation</div>
            <pre style={{
              margin: 0, fontSize: 11.5, lineHeight: 1.5,
              color: "var(--ink-2)", whiteSpace: "pre-wrap", wordBreak: "break-word",
              fontFamily: "var(--font-mono)",
            }}>{JSON.stringify(step.observation, null, 2)}</pre>
          </div>
        </React.Fragment>
      )}

      {/* final answer */}
      {step.answer && (
        <div style={{
          padding: 14,
          background: "rgba(var(--green-rgb), 0.06)",
          border: "1px solid rgba(var(--green-rgb), 0.3)",
          borderRadius: 4,
          marginTop: 4,
        }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--green)", marginBottom: 8, fontWeight: 600,
          }}>final answer</div>
          <div style={{
            fontSize: 13, color: "var(--ink-1)", lineHeight: 1.6,
            whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)",
          }}>{step.answer}</div>
        </div>
      )}

      {isLast && hasAction && (
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-4)", fontStyle: "italic" }}>
          <span className="dot dot--pulse" /> waiting for next iteration…
        </div>
      )}
    </div>
  );
}

export default AgentsDemo;
