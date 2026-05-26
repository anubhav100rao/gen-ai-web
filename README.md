# GenAI Visualizer

Interactive demos for understanding generative AI — built as a static React + Vite app.

## Local dev

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm run build
```

Then push to GitHub and connect the repo at [vercel.com/new](https://vercel.com/new) — Vercel auto-detects Vite.
The included `vercel.json` rewrites all paths to `index.html` so hash-based routing works.

## Tech

- React 18, Vite 5, hash-based routing (no router library)
- No backend, no API keys, no network calls
- All demos are pure simulations — deterministic and offline-safe

## File layout

- `src/components/` — Nav, Footer, Home, ConceptPage
- `src/demos/` — one .jsx per concept (12 total)
- `src/util.jsx` — shared hooks, helpers, Code/Section/Stage primitives
- `src/data.js` — module + concept catalog
- `src/styles.css` — design tokens

Built for learners. Add demos, change copy, fork freely.
