import React, { useState, useEffect } from "react";
import { Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// MCP — Model Context Protocol
// ============================================================

const MCP_SERVERS = [
  {
    id: "filesystem",
    name: "filesystem",
    desc: "Read/write local files",
    icon: "▣",
    color: "var(--green)",
    tools: [
      { name: "read_file",  args: ["path"] },
      { name: "write_file", args: ["path", "content"] },
      { name: "list_dir",   args: ["path"] },
    ],
    resources: [
      { uri: "file:///home/me/docs/notes.md", mime: "text/markdown" },
      { uri: "file:///home/me/projects/",      mime: "directory" },
    ],
    prompts: [
      { name: "summarize_file", desc: "Summarize a file as 3 bullets" },
    ],
  },
  {
    id: "github",
    name: "github",
    desc: "Repos, issues, PRs",
    icon: "⬡",
    color: "var(--violet)",
    tools: [
      { name: "search_repos", args: ["query"] },
      { name: "create_issue", args: ["repo", "title", "body"] },
      { name: "get_pr",       args: ["repo", "number"] },
      { name: "comment_pr",   args: ["repo", "number", "body"] },
    ],
    resources: [
      { uri: "github://user/repo/README.md", mime: "text/markdown" },
      { uri: "github://user/repo/issues",     mime: "application/json" },
    ],
    prompts: [
      { name: "triage_issue",   desc: "Label and prioritize an open issue" },
      { name: "review_pr",      desc: "Generate a code-review comment" },
    ],
  },
  {
    id: "postgres",
    name: "postgres",
    desc: "Read-only SQL queries",
    icon: "◆",
    color: "var(--blue)",
    tools: [
      { name: "query",   args: ["sql"] },
      { name: "explain", args: ["sql"] },
    ],
    resources: [
      { uri: "postgres://prod/schema",        mime: "application/json" },
      { uri: "postgres://prod/users/columns", mime: "application/json" },
    ],
    prompts: [
      { name: "describe_table", desc: "Explain a table's schema in plain English" },
    ],
  },
  {
    id: "slack",
    name: "slack",
    desc: "Channels, messages, search",
    icon: "◉",
    color: "var(--yellow)",
    tools: [
      { name: "send_message", args: ["channel", "text"] },
      { name: "search",       args: ["query"] },
    ],
    resources: [
      { uri: "slack://channels", mime: "application/json" },
    ],
    prompts: [],
  },
];

function MCPDemo() {
  const [selected, setSelected] = useState("github");
  const [tab, setTab] = useState("tools");
  const [activeFlow, setActiveFlow] = useState(0);

  const server = MCP_SERVERS.find(s => s.id === selected);

  // Animate the discovery flow on a loop
  useEffect(() => {
    const t = setInterval(() => setActiveFlow(f => (f + 1) % 4), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <React.Fragment>
      <Section eyebrow="the demo" title="One client. Many standardized servers.">
        <Stage padding={0}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", minHeight: 560 }}>
            {/* Diagram */}
            <div style={{ padding: 24 }}>
              <MCPDiagram selected={selected} setSelected={setSelected} activeFlow={activeFlow} />

              <div style={{
                marginTop: 24,
                padding: 14,
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6,
              }}>
                <span style={{ color: "var(--green)", fontWeight: 600 }}>JSON-RPC over stdio/HTTP · </span>
                Client discovers servers, asks each one "what can you do?", then invokes capabilities by name.
                Servers can be written in any language — the protocol is what's standardized.
              </div>
            </div>

            {/* Server inspector */}
            <div style={{
              borderLeft: "1px solid var(--border)",
              background: "var(--bg-2)",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{
                padding: 18,
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 4,
                  background: server.color, color: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700,
                }}>{server.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: server.color }}>
                    {server.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                    mcp://servers/{server.id}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                {["tools", "resources", "prompts"].map(t => (
                  <button key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      background: tab === t ? "var(--bg-1)" : "transparent",
                      color: tab === t ? server.color : "var(--ink-3)",
                      border: "none",
                      borderBottom: tab === t ? `1px solid ${server.color}` : "1px solid transparent",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t} ({server[t].length})
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
                {tab === "tools" && server.tools.map(t => (
                  <div key={t.name} style={{
                    padding: "10px 12px", marginBottom: 8,
                    background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: 4,
                  }}>
                    <code style={{ fontSize: 12.5, color: server.color }}>
                      {t.name}({t.args.join(", ")})
                    </code>
                  </div>
                ))}
                {tab === "resources" && server.resources.map(r => (
                  <div key={r.uri} style={{
                    padding: "10px 12px", marginBottom: 8,
                    background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: 4,
                  }}>
                    <code style={{ fontSize: 11.5, color: "var(--ink-2)", wordBreak: "break-all" }}>{r.uri}</code>
                    <div style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 2 }}>{r.mime}</div>
                  </div>
                ))}
                {tab === "prompts" && (server.prompts.length === 0 ? (
                  <div className="dim" style={{ fontSize: 12, fontStyle: "italic" }}>
                    no prompts exposed by this server.
                  </div>
                ) : server.prompts.map(p => (
                  <div key={p.name} style={{
                    padding: "10px 12px", marginBottom: 8,
                    background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: 4,
                  }}>
                    <code style={{ fontSize: 12.5, color: server.color }}>{p.name}</code>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>{p.desc}</div>
                  </div>
                )))}
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section eyebrow="how it works" title="USB-C for AI tools">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">why it matters</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
              Before MCP, every app that wanted to give an LLM access to GitHub wrote its own GitHub
              integration. With MCP, anyone runs the GitHub server, every LLM client speaks the same
              protocol. Tools become portable.
            </p>
          </div>
        }>
          <p>
            <strong style={{ color: "var(--green)" }}>MCP (Model Context Protocol)</strong> is an
            open standard from Anthropic for how LLM applications expose tools, data, and prompts to
            language models. Think of it as a USB-C plug for AI: the model doesn't care what's on the
            other end, as long as it speaks the protocol.
          </p>
          <p style={{ marginTop: 16 }}>
            A server exposes three kinds of capabilities:
            <br/>• <strong style={{ color: "var(--green)" }}>tools</strong> — actions the model can invoke (with arguments + results)
            <br/>• <strong style={{ color: "var(--green)" }}>resources</strong> — read-only data the model can fetch by URI
            <br/>• <strong style={{ color: "var(--green)" }}>prompts</strong> — reusable templates a user can pick from
          </p>
          <p style={{ marginTop: 16 }}>
            Communication is JSON-RPC over stdio or HTTP/SSE. The client (Claude Desktop, Cursor,
            Continue, etc.) starts each server as a subprocess, runs an <code>initialize</code>
            handshake, then queries <code>tools/list</code>, <code>resources/list</code>, etc. The
            model sees the union of capabilities across all connected servers.
          </p>
        </Explain>
      </Section>

      <Section eyebrow="for real" title="A minimal MCP server (Python SDK)">
        <Code>{`# pip install mcp
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

@mcp.resource("notes://{name}")
def get_note(name: str) -> str:
    """Read a note from disk."""
    return open(f"notes/{name}.md").read()

@mcp.prompt()
def summarize() -> str:
    """Reusable summarization prompt."""
    return "Summarize the following in 3 bullets:\\n\\n"

if __name__ == "__main__":
    mcp.run()  # listens on stdio, ready for any MCP client`}</Code>
      </Section>

      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Click between servers. Each one exposes its own tools, resources, and prompts — but the client speaks to all of them the same way.",
          "Look at the difference between 'tools' and 'resources'. Tools are verbs the model invokes. Resources are nouns the model reads. Both are useful.",
          "Notice the GitHub server has 'prompts' too — these are pre-written templates that the user (not the model) can invoke, e.g. /review_pr in Claude Desktop.",
          "In production, MCP servers run as separate subprocesses with their own permissions. You can ship a sandboxed filesystem server that only sees one directory.",
        ]} />
      </Section>
    </React.Fragment>
  );
}

// ============================================================
// MCP architecture diagram
// ============================================================
function MCPDiagram({ selected, setSelected, activeFlow }) {
  // Layout: client on left, 4 servers on right
  const clientX = 110, clientY = 220;
  const serverX = 460;
  const serverYs = [80, 175, 270, 365];

  return (
    <svg viewBox="0 0 580 460" style={{ width: "100%", display: "block" }}>
      <defs>
        <marker id="mcp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
        {MCP_SERVERS.map(s => (
          <marker key={s.id} id={`mcp-arrow-${s.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={s.color} />
          </marker>
        ))}
      </defs>

      {/* Client box */}
      <g>
        <rect x={clientX - 75} y={clientY - 55} width={150} height={110} rx={6}
          fill="var(--bg-2)" stroke="var(--green)" strokeWidth={1.5} />
        <text x={clientX} y={clientY - 28} fontSize={11} textAnchor="middle"
          fontFamily="JetBrains Mono" fill="var(--green)" fontWeight={700}>MCP CLIENT</text>
        <text x={clientX} y={clientY - 12} fontSize={9.5} textAnchor="middle"
          fontFamily="JetBrains Mono" fill="var(--ink-3)">Claude Desktop</text>
        <line x1={clientX - 60} y1={clientY - 2} x2={clientX + 60} y2={clientY - 2} stroke="var(--border)" />
        <text x={clientX} y={clientY + 14} fontSize={9} textAnchor="middle"
          fontFamily="JetBrains Mono" fill="var(--ink-2)">⌘ LLM (Claude)</text>
        <text x={clientX} y={clientY + 28} fontSize={9} textAnchor="middle"
          fontFamily="JetBrains Mono" fill="var(--ink-3)">+ user UI</text>
        <text x={clientX} y={clientY + 44} fontSize={9} textAnchor="middle"
          fontFamily="JetBrains Mono" fill="var(--ink-3)">+ context router</text>
      </g>

      {/* Connection lines + servers */}
      {MCP_SERVERS.map((s, i) => {
        const sy = serverYs[i];
        const isActive = activeFlow === i;
        const isSelected = selected === s.id;
        return (
          <g key={s.id} style={{ cursor: "pointer" }} onClick={() => setSelected(s.id)}>
            {/* connection line */}
            <line x1={clientX + 75} y1={clientY} x2={serverX - 65} y2={sy + 30}
              stroke={isSelected ? s.color : (isActive ? s.color : "var(--border-bright)")}
              strokeWidth={isSelected || isActive ? 1.8 : 1}
              opacity={isSelected ? 1 : (isActive ? 0.9 : 0.4)}
              strokeDasharray={isActive && !isSelected ? "4 3" : "0"}
            />
            {/* pulse dot when active */}
            {isActive && (
              <circle r={4} fill={s.color}>
                <animateMotion dur="1.8s" repeatCount="1"
                  path={`M${clientX + 75} ${clientY} L${serverX - 65} ${sy + 30}`} />
              </circle>
            )}

            {/* server box */}
            <rect x={serverX - 65} y={sy} width={150} height={62} rx={4}
              fill={isSelected ? "var(--bg-3)" : "var(--bg-2)"}
              stroke={isSelected ? s.color : "var(--border-bright)"}
              strokeWidth={isSelected ? 1.8 : 1}
              opacity={isSelected ? 1 : 0.85}
            />
            <text x={serverX - 50} y={sy + 22} fontSize={16}
              fontFamily="JetBrains Mono" fill={s.color}>{s.icon}</text>
            <text x={serverX - 32} y={sy + 22} fontSize={12}
              fontFamily="JetBrains Mono" fontWeight={isSelected ? 700 : 600}
              fill={isSelected ? s.color : "var(--ink-1)"}>{s.name}</text>
            <text x={serverX - 50} y={sy + 40} fontSize={9.5}
              fontFamily="JetBrains Mono" fill="var(--ink-3)">{s.desc}</text>
            <text x={serverX - 50} y={sy + 54} fontSize={8.5}
              fontFamily="JetBrains Mono" fill="var(--ink-4)">
              {s.tools.length}t · {s.resources.length}r · {s.prompts.length}p
            </text>
          </g>
        );
      })}

      {/* connection-protocol label */}
      <text x={290} y={420} fontSize={9.5} textAnchor="middle"
        fontFamily="JetBrains Mono" fill="var(--ink-4)" letterSpacing="0.1em">
        JSON-RPC · STDIO / HTTP-SSE · stateful sessions
      </text>
    </svg>
  );
}

export default MCPDemo;
