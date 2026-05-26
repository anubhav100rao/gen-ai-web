// ============================================================
// Module + concept catalog
// ============================================================

const MODULES = [
  {
    id: "foundations",
    num: "01",
    title: "Foundations",
    blurb: "How language is broken into pieces a model can chew on.",
    concepts: [
      { id: "tokenizer",      title: "Tokenizer",        oneline: "Text becomes numbers. Watch BPE chop words into subword units.",  tag: "input" },
      { id: "embeddings",     title: "Embeddings",       oneline: "Words become coordinates. Geometry encodes meaning.",              tag: "vectors" },
      { id: "context-window", title: "Context window",   oneline: "Every token costs. See what fits, what gets dropped.",             tag: "memory" },
    ],
  },
  {
    id: "generation",
    num: "02",
    title: "Generation",
    blurb: "How the model picks the next word, and how prompts steer it.",
    concepts: [
      { id: "temperature",        title: "Temperature & sampling", oneline: "Same model, same prompt, different outputs. The dial that controls boldness.", tag: "sampling" },
      { id: "attention",          title: "Attention",              oneline: "Tokens look at other tokens. The heatmap of who talks to whom.",                tag: "transformer" },
      { id: "prompt-engineering", title: "Prompt engineering",     oneline: "Zero-shot, few-shot, chain-of-thought. Same task, three structures.",          tag: "prompting" },
    ],
  },
  {
    id: "retrieval",
    num: "03",
    title: "Retrieval",
    blurb: "How models look things up they were never trained on.",
    concepts: [
      { id: "vector-db",      title: "Vector database",        oneline: "Drop a query into vector space. Find its k nearest neighbors.",    tag: "ANN" },
      { id: "search-compare", title: "Semantic vs BM25",       oneline: "Lexical match vs meaning match. Run both on the same corpus.",     tag: "search" },
      { id: "rag",            title: "RAG pipeline",           oneline: "Retrieve, augment, generate. The four-stage loop, click by click.", tag: "pipeline" },
    ],
  },
  {
    id: "agents",
    num: "04",
    title: "Agents",
    blurb: "How models stop just answering and start doing things.",
    concepts: [
      { id: "tools",  title: "Tool use",          oneline: "Models call functions. Watch the JSON request and the result come back.", tag: "function-calling" },
      { id: "mcp",    title: "Model Context Protocol", oneline: "Standardized plug for tools, resources, prompts. The USB-C of agents.", tag: "MCP" },
      { id: "agents", title: "Agentic workflows", oneline: "Thought → action → observation → repeat. A loop that solves real tasks.",  tag: "ReAct" },
    ],
  },
];

// Flat lookup
const CONCEPTS = MODULES.flatMap(m => m.concepts.map(c => ({ ...c, module: m })));

function findConcept(id) {
  return CONCEPTS.find(c => c.id === id);
}

function nextConcept(id) {
  const i = CONCEPTS.findIndex(c => c.id === id);
  return i >= 0 && i < CONCEPTS.length - 1 ? CONCEPTS[i + 1] : null;
}

function prevConcept(id) {
  const i = CONCEPTS.findIndex(c => c.id === id);
  return i > 0 ? CONCEPTS[i - 1] : null;
}

export { MODULES, CONCEPTS, findConcept, nextConcept, prevConcept };
