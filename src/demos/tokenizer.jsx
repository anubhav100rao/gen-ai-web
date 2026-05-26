import React, { useState, useMemo } from "react";
import { hash01, TOKEN_COLORS, Code } from "../util.jsx";
import { Section, Stage, Explain, Experiments } from "../components/ConceptPage.jsx";

// ============================================================
// Tokenizer demo
// Approximates a GPT-style BPE tokenizer with a small rule set:
//   - lowercase common-word lookup
//   - leading-space preservation
//   - split punctuation
//   - long unknowns fall through to char-by-char
// Token IDs are fake but deterministic per token string.
// ============================================================

const COMMON_WORDS = new Set([
  "the","a","an","and","or","but","if","then","of","to","in","on","at","for","with","from",
  "is","are","was","were","be","been","being","have","has","had","do","does","did",
  "this","that","these","those","it","its","i","you","he","she","we","they","them",
  "not","no","yes","can","will","would","could","should","may","might",
  "what","when","where","why","how","who","which",
  "quick","brown","fox","jumps","over","lazy","dog","cat","run","make","build","learn",
  "model","tokens","data","train","write","read","code","text","word","words",
  "hello","world","good","bad","new","old","first","last","time","day","year","one","two","three",
]);

const SUBWORD_MAP = {
  "tokenization": ["token", "ization"],
  "tokenizing":   ["token", "izing"],
  "tokenizer":    ["token", "izer"],
  "tokenized":    ["token", "ized"],
  "tokens":       ["token", "s"],
  "embeddings":   ["embed", "dings"],
  "embedding":    ["embed", "ding"],
  "transformer":  ["trans", "former"],
  "transformers": ["trans", "formers"],
  "attention":    ["att", "ention"],
  "generative":   ["gener", "ative"],
  "generation":   ["gener", "ation"],
  "retrieval":    ["retri", "eval"],
  "retrieve":     ["retri", "eve"],
  "augmented":    ["augment", "ed"],
  "augmenting":   ["augment", "ing"],
  "context":      ["con", "text"],
  "models":       ["model", "s"],
  "anthropic":    ["anth", "ropic"],
  "claude":       ["cla", "ude"],
  "openai":       ["open", "ai"],
  "language":     ["lang", "uage"],
  "understanding":["understand", "ing"],
  "visualization":["visual", "ization"],
};

function tokenize(input) {
  // Mimic GPT BPE: split on word boundaries, keep leading whitespace inside the token.
  // e.g. "The quick" → ["The", " quick"]
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    // capture leading whitespace as part of next token
    let lead = "";
    while (i < input.length && /\s/.test(input[i]) && input[i] !== "\n") {
      lead += input[i++];
    }
    if (i >= input.length && lead) {
      tokens.push(lead);
      break;
    }
    if (input[i] === "\n") {
      if (lead) tokens.push(lead);
      tokens.push("\n");
      i++;
      continue;
    }
    // collect a word or punctuation cluster
    let word = "";
    if (/[a-zA-Z]/.test(input[i])) {
      while (i < input.length && /[a-zA-Z]/.test(input[i])) word += input[i++];
    } else if (/\d/.test(input[i])) {
      while (i < input.length && /\d/.test(input[i])) word += input[i++];
    } else {
      // single punctuation char
      word = input[i++];
    }
    // apply subword rules
    const lower = word.toLowerCase();
    if (SUBWORD_MAP[lower]) {
      const parts = SUBWORD_MAP[lower];
      // first part gets the leading whitespace + same case prefix
      tokens.push(lead + word.slice(0, parts[0].length));
      for (let p = 1; p < parts.length; p++) {
        tokens.push(word.slice(parts.slice(0, p).join("").length, parts.slice(0, p + 1).join("").length));
      }
    } else if (COMMON_WORDS.has(lower) || word.length <= 5) {
      tokens.push(lead + word);
    } else {
      // split mid-word into ~4-char subwords
      tokens.push(lead + word.slice(0, 4));
      let rest = word.slice(4);
      while (rest.length > 4) {
        tokens.push(rest.slice(0, 4));
        rest = rest.slice(4);
      }
      if (rest) tokens.push(rest);
    }
  }
  return tokens;
}

function tokenId(tok) {
  // deterministic 5-digit "ID"
  return Math.floor(hash01(tok) * 99999);
}

function TokenizerDemo() {
  const [text, setText] = useState(
    "The quick brown fox jumps over the lazy dog.\nTokenization splits text into subword units that the model can embed."
  );

  const tokens = useMemo(() => tokenize(text), [text]);
  const bytes  = useMemo(() => new TextEncoder().encode(text).length, [text]);
  const chars  = text.length;
  const words  = text.trim().split(/\s+/).filter(Boolean).length;

  const ratio = words > 0 ? (tokens.length / words).toFixed(2) : "0";

  const presets = [
    { label: "english prose",  v: "The quick brown fox jumps over the lazy dog." },
    { label: "tech jargon",    v: "Tokenization, embeddings, and attention are the foundations of transformer models." },
    { label: "code",           v: "def greet(name):\n    return f\"hello, {name}\"" },
    { label: "emoji + unicode", v: "Café résumé naïve. 🌍 → 1F30D" },
    { label: "long word",      v: "antidisestablishmentarianism is the longest word most people know" },
  ];

  return (
    <React.Fragment>
      {/* ------- DEMO ------- */}
      <Section eyebrow="the demo" title="Type. Watch it split.">
        <Stage padding={0}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 240px",
            minHeight: 420,
          }}>
            {/* Left: input + tokens */}
            <div style={{ padding: 24, borderRight: "1px solid var(--border)" }}>
              <div className="label">input text</div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                style={{ width: "100%", resize: "vertical", fontSize: 13, lineHeight: 1.5 }}
              />

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {presets.map(p => (
                  <button key={p.label} className="btn btn--ghost btn--sm" onClick={() => setText(p.v)}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="label" style={{ marginTop: 24 }}>
                tokens · {tokens.length}
              </div>
              <div style={{
                padding: 16, background: "var(--bg-2)",
                border: "1px solid var(--border)", borderRadius: 4,
                minHeight: 120, fontSize: 13, lineHeight: 1.9,
              }}>
                {tokens.map((t, i) => <TokenChip key={i} tok={t} idx={i} />)}
              </div>

              <div className="label" style={{ marginTop: 24 }}>token ids (fake but stable)</div>
              <div style={{
                padding: "10px 14px", background: "var(--bg-2)",
                border: "1px solid var(--border)", borderRadius: 4,
                fontSize: 11.5, color: "var(--ink-3)",
                overflowX: "auto", whiteSpace: "nowrap",
              }}>
                [{tokens.map(t => tokenId(t)).join(", ")}]
              </div>
            </div>

            {/* Right: stats */}
            <div style={{ padding: 24, background: "var(--bg-2)" }}>
              <div className="label">measurements</div>
              <StatRow label="tokens"  value={tokens.length} accent="green" />
              <StatRow label="words"   value={words} />
              <StatRow label="chars"   value={chars} />
              <StatRow label="bytes"   value={bytes} />
              <StatRow label="tok/word" value={ratio} accent="yellow" />

              <div className="label" style={{ marginTop: 32 }}>cost (approx)</div>
              <StatRow label="@ $3/M in"  value={"$" + (tokens.length * 3 / 1_000_000).toFixed(6)} mono />
              <StatRow label="@ $15/M out" value={"$" + (tokens.length * 15 / 1_000_000).toFixed(6)} mono />

              <div style={{ marginTop: 28, fontSize: 11, color: "var(--ink-4)", lineHeight: 1.6 }}>
                A rough rule of thumb: 1 token ≈ 0.75 English words, or 4 chars.
                Code, non-English text, and rare words use more.
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      {/* ------- EXPLAIN ------- */}
      <Section eyebrow="how it works" title="From string to integer">
        <Explain aside={
          <div className="card" style={{ background: "var(--bg-1)" }}>
            <div className="label">vocabulary size</div>
            <div className="num h-2" style={{ marginTop: 4 }}>~50,000</div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              GPT-style tokenizers learn a vocabulary of ~50k subword pieces from training data.
              Claude uses a similar BPE-family scheme.
            </p>
          </div>
        }>
          <p>
            Models don't read characters and they don't read words. They read{" "}
            <strong style={{ color: "var(--green)" }}>tokens</strong> — integer IDs into a fixed
            vocabulary of subword pieces, learned by an algorithm called Byte-Pair Encoding (BPE).
          </p>
          <p style={{ marginTop: 16 }}>
            BPE starts with raw bytes, then repeatedly finds the most common adjacent pair and merges
            it. After thousands of merges, common words like <code>the</code> become single tokens,
            uncommon ones like <code>tokenization</code> split into <code>token</code> + <code>ization</code>,
            and truly rare strings fall through to character-level.
          </p>
          <p style={{ marginTop: 16 }}>
            Leading spaces matter: <code>" the"</code> and <code>"the"</code> are different tokens.
            This is why the model is sensitive to whitespace and why one extra space can change a
            generation completely.
          </p>
        </Explain>
      </Section>

      {/* ------- BPE WALKTHROUGH ------- */}
      <Section eyebrow="step by step" title="How BPE learns to merge">
        <BPEWalkthrough />
      </Section>

      {/* ------- CODE ------- */}
      <Section eyebrow="for real" title="The Python you'd actually write">
        <Code>{`# pip install tiktoken
import tiktoken

# GPT-4 / GPT-3.5 use the cl100k_base encoding
enc = tiktoken.get_encoding("cl100k_base")

text = "The quick brown fox jumps over the lazy dog."
ids  = enc.encode(text)

print(len(ids), "tokens")
print(ids)
# [791, 4062, 14198, 39935, 35308, 927, 279, 16053, 5679, 13]

# round-trip back to text
print(enc.decode(ids))

# inspect each token
for tid in ids:
    print(tid, repr(enc.decode([tid])))`}</Code>
      </Section>

      {/* ------- TRY THIS ------- */}
      <Section eyebrow="try this" title="Experiments">
        <Experiments items={[
          "Paste the same paragraph in English and in Mandarin. Which uses more tokens per character?",
          "Tokenize a JSON blob. Notice how every quote, brace, and key gets its own token — that's why structured outputs cost more.",
          "Add a single leading space to a word. Watch the token IDs change completely.",
          "Try a long made-up word like 'flibbertijibberation'. See how it falls through to short pieces."
        ]} />
      </Section>
    </React.Fragment>
  );
}

function TokenChip({ tok, idx }) {
  const color = TOKEN_COLORS[idx % TOKEN_COLORS.length];
  const display = tok.replace(/\n/g, "↵").replace(/ /g, "·");
  const isNewline = tok === "\n";
  return (
    <span
      className="tok"
      title={`token #${idx}  ·  id ${tokenId(tok)}  ·  "${tok}"`}
      style={{
        background: color.bg,
        color: color.fg,
        border: `1px solid ${color.bg.replace("0.18", "0.4")}`,
      }}
    >
      {display}{isNewline && <br />}
    </span>
  );
}

function StatRow({ label, value, accent, mono }) {
  const accents = { green: "var(--green)", yellow: "var(--yellow)", pink: "var(--pink)" };
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "8px 0", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{label}</span>
      <span className="num" style={{
        fontSize: mono ? 12 : 16,
        fontWeight: 600,
        color: accents[accent] || "var(--ink-1)",
      }}>{value}</span>
    </div>
  );
}

// ============================================================
// BPE Walkthrough — show iterative merging of "lowlower lowest"
// ============================================================
function BPEWalkthrough() {
  const [step, setStep] = useState(0);

  // Each step shows the corpus state after a merge
  const steps = [
    {
      title: "Start: every character is a token",
      tokens: [..."low low low low lower lower newest newest newest widest widest widest"].map(c => c === " " ? "▁" : c),
      merge: null,
      count: { l:5, o:5, w:5, e:9, r:2, " ":11, n:3, t:6, s:6, i:3, d:3 },
    },
    {
      title: "Merge 1: 'e' + 's' → 'es' (most common pair)",
      tokens: ["l","o","w","▁","l","o","w","▁","l","o","w","▁","l","o","w","▁","l","o","w","e","r","▁","l","o","w","e","r","▁","n","e","w","es","t","▁","n","e","w","es","t","▁","n","e","w","es","t","▁","w","i","d","es","t","▁","w","i","d","es","t","▁","w","i","d","es","t"],
      merge: ["e","s","es"],
    },
    {
      title: "Merge 2: 'es' + 't' → 'est'",
      tokens: ["l","o","w","▁","l","o","w","▁","l","o","w","▁","l","o","w","▁","l","o","w","e","r","▁","l","o","w","e","r","▁","n","e","w","est","▁","n","e","w","est","▁","n","e","w","est","▁","w","i","d","est","▁","w","i","d","est","▁","w","i","d","est"],
      merge: ["es","t","est"],
    },
    {
      title: "Merge 3: 'l' + 'o' → 'lo'",
      tokens: ["lo","w","▁","lo","w","▁","lo","w","▁","lo","w","▁","lo","w","e","r","▁","lo","w","e","r","▁","n","e","w","est","▁","n","e","w","est","▁","n","e","w","est","▁","w","i","d","est","▁","w","i","d","est","▁","w","i","d","est"],
      merge: ["l","o","lo"],
    },
    {
      title: "Merge 4: 'lo' + 'w' → 'low'",
      tokens: ["low","▁","low","▁","low","▁","low","▁","low","e","r","▁","low","e","r","▁","n","e","w","est","▁","n","e","w","est","▁","n","e","w","est","▁","w","i","d","est","▁","w","i","d","est","▁","w","i","d","est"],
      merge: ["lo","w","low"],
    },
    {
      title: "After many merges: common words are single tokens",
      tokens: ["low","▁","low","▁","low","▁","low","▁","lower","▁","lower","▁","newest","▁","newest","▁","newest","▁","widest","▁","widest","▁","widest"],
      merge: null,
    },
  ];

  const cur = steps[step];

  return (
    <Stage>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="label">step {step + 1} / {steps.length}</div>
          <div className="h-3" style={{ marginTop: 4 }}>{cur.title}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--sm" disabled={step === 0} onClick={() => setStep(step - 1)}>← prev</button>
          <button className="btn btn--sm btn--primary" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>next →</button>
        </div>
      </div>

      {cur.merge && (
        <div style={{
          padding: "10px 14px",
          background: "var(--bg-2)",
          border: "1px dashed var(--green)",
          borderRadius: 4,
          fontSize: 12.5,
          marginBottom: 16,
        }}>
          <span style={{ color: "var(--ink-3)" }}>merge: </span>
          <code style={{ color: "var(--pink)" }}>'{cur.merge[0]}'</code>
          <span style={{ color: "var(--ink-3)" }}> + </span>
          <code style={{ color: "var(--pink)" }}>'{cur.merge[1]}'</code>
          <span style={{ color: "var(--ink-3)" }}> → </span>
          <code style={{ color: "var(--green)" }}>'{cur.merge[2]}'</code>
        </div>
      )}

      <div style={{
        padding: 16,
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        fontSize: 14,
        lineHeight: 2,
      }}>
        {cur.tokens.map((t, i) => {
          const isMerged = cur.merge && t === cur.merge[2];
          const display = t === "▁" ? "·" : t;
          return (
            <span key={i} className="tok" style={{
              background: isMerged ? "rgba(var(--green-rgb), 0.25)" : (t === "▁" ? "transparent" : "rgba(255,255,255,0.05)"),
              color: isMerged ? "var(--green)" : (t === "▁" ? "var(--ink-5)" : "var(--ink-2)"),
              border: `1px solid ${isMerged ? "var(--green)" : "var(--border-hi)"}`,
              fontWeight: isMerged ? 600 : 400,
            }}>{display}</span>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-3)" }}>
        <span>vocab size: <strong style={{ color: "var(--ink-1)" }}>{new Set(cur.tokens).size}</strong></span>
        <span>total tokens: <strong style={{ color: "var(--ink-1)" }}>{cur.tokens.filter(t => t !== "▁").length}</strong></span>
      </div>
    </Stage>
  );
}

export default TokenizerDemo;
