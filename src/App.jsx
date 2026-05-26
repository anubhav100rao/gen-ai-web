import React from "react";
import { useHashRoute } from "./util.jsx";
import { Nav } from "./components/Nav.jsx";
import { Footer } from "./components/Footer.jsx";
import { Home } from "./components/Home.jsx";
import { ConceptPage } from "./components/ConceptPage.jsx";

import TokenizerDemo         from "./demos/tokenizer.jsx";
import EmbeddingsDemo        from "./demos/embeddings.jsx";
import ContextWindowDemo     from "./demos/context-window.jsx";
import TemperatureDemo       from "./demos/temperature.jsx";
import AttentionDemo         from "./demos/attention.jsx";
import PromptEngineeringDemo from "./demos/prompt-engineering.jsx";
import VectorDBDemo          from "./demos/vector-db.jsx";
import SearchCompareDemo     from "./demos/search-compare.jsx";
import RAGDemo               from "./demos/rag.jsx";
import ToolsDemo             from "./demos/tools.jsx";
import MCPDemo               from "./demos/mcp.jsx";
import AgentsDemo            from "./demos/agents.jsx";

const DEMOS = {
  "tokenizer":          () => <TokenizerDemo />,
  "embeddings":         () => <EmbeddingsDemo />,
  "context-window":     () => <ContextWindowDemo />,
  "temperature":        () => <TemperatureDemo />,
  "attention":          () => <AttentionDemo />,
  "prompt-engineering": () => <PromptEngineeringDemo />,
  "vector-db":          () => <VectorDBDemo />,
  "search-compare":     () => <SearchCompareDemo />,
  "rag":                () => <RAGDemo />,
  "tools":              () => <ToolsDemo />,
  "mcp":                () => <MCPDemo />,
  "agents":             () => <AgentsDemo />,
};

export default function App() {
  const route = useHashRoute();
  return (
    <>
      <Nav />
      {route.name === "home" && <Home />}
      {route.name === "concept" && (
        <ConceptPage id={route.id}>
          {DEMOS[route.id] ? DEMOS[route.id]() : <ComingSoon id={route.id} />}
        </ConceptPage>
      )}
      <Footer />
    </>
  );
}

function ComingSoon({ id }) {
  return (
    <div className="card" style={{ padding: 48, textAlign: "center" }}>
      <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 16 }}>scaffolded</div>
      <h2 className="h-2">Demo &quot;{id}&quot; is loading from the future</h2>
      <p className="muted" style={{ marginTop: 12 }}>Hold tight — the component file is being wired up.</p>
    </div>
  );
}
