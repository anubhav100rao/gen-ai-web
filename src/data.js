// ============================================================
// Module + concept catalog
// ============================================================

const MODULES = [
  {
    id: "foundations",
    num: "01",
    title: "Foundations",
    blurb: "How language becomes tokens, vectors, and the finite buffer the model reads from.",
    concepts: [
      { id: "tokenizer",      title: "Tokenizer",        oneline: "Text becomes numbers. Watch BPE chop words into subword units.",  tag: "input" },
      { id: "embeddings",     title: "Embeddings",       oneline: "Words become coordinates. Geometry encodes meaning.",              tag: "vectors" },
      { id: "context-window", title: "Context window",   oneline: "Every token costs. See what fits, what gets dropped.",             tag: "memory" },
      { id: "next-token",     title: "Next-token prediction", oneline: "Text in, probabilities out. Watch the model predict logits word by word.", tag: "autoregressive", aliases: ["logits", "autoregression", "next word", "generation loop"] },
      { id: "training-inference", title: "Training vs Inference", oneline: "Weights are learned, then frozen. See the difference between reading and writing.", tag: "weights", aliases: ["learning", "backprop", "backpropagation", "forward pass", "frozen weights"] },
    ],
  },
  {
    id: "generation",
    num: "02",
    title: "Generation",
    blurb: "How the model picks the next word, and how prompts steer it.",
    concepts: [
      { id: "temperature",        title: "Temperature & sampling", oneline: "Same model, same prompt, different outputs. The dial that controls boldness.", tag: "sampling" },
      { id: "sampling",           title: "Top-k & Top-p Sampling", oneline: "Interactive sorting and truncation. Watch how candidates are filtered out.", tag: "filtering", aliases: ["top k", "top p", "nucleus", "decoding", "greedy"] },
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
      { id: "rag",            title: "RAG pipeline",           oneline: "Retrieve, augment, generate. The full pipeline, click by click.", tag: "pipeline" },
      { id: "rag-failures",   title: "RAG failure modes",       oneline: "Stale docs, wrong chunks, and model overrides. Where search goes wrong.", tag: "diagnostics", aliases: ["hallucination", "stale data", "wrong chunk", "conflicting sources", "rag diagnostics"] },
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
  {
    id: "safety-eval",
    num: "05",
    title: "Safety & Evaluation",
    blurb: "How we align models, secure them against injections, and evaluate them.",
    concepts: [
      { id: "fine-tuning-rlhf", title: "Fine-tuning & RLHF",     oneline: "Supervised domain tuning meets preference learning. Adjust logits with feedback.", tag: "post-training", aliases: ["sft", "supervised fine tuning", "alignment", "preference tuning", "dpo"] },
      { id: "prompt-injection", title: "Prompt injection",       oneline: "Safety vs jailbreak. Watch retrieved third-party text hijack instructions.", tag: "security", aliases: ["jailbreak", "indirect injection", "guardrails", "security"] },
      { id: "evaluation",       title: "Model evaluation",       oneline: "Exact match, precision/recall, and LLM-as-a-judge. Measuring scale.", tag: "benchmarks", aliases: ["eval", "evals", "metrics", "judge", "precision", "recall", "exact match"] },
    ],
  },
];

// Flat lookup
const CONCEPTS = MODULES.flatMap(m => m.concepts.map(c => ({ ...c, module: m })));
const CATALOG_STATS = {
  moduleCount: MODULES.length,
  conceptCount: CONCEPTS.length,
};

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function conceptSearchText(concept) {
  return normalizeSearchText([
    concept.id,
    concept.id.replace(/-/g, " "),
    concept.title,
    concept.oneline,
    concept.tag,
    ...(concept.aliases || []),
    concept.module?.id,
    concept.module?.title,
    concept.module?.blurb,
  ].join(" "));
}

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

export {
  MODULES,
  CONCEPTS,
  CATALOG_STATS,
  normalizeSearchText,
  conceptSearchText,
  findConcept,
  nextConcept,
  prevConcept,
};
