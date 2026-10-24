# Research Atlas | Live React Navigation + Source Status

This document describes the user-facing **Research Atlas** added to the existing NBG GitHub Pages React website.

## What changed

Previously the React website contained a substantial interactive AH2–AH44 evidence ladder and early browser demos but **did not expose the PHMP/semantic memory or RB3 research folders as navigable website content**. Research merged successfully into the repository did not automatically become visible to visitors.

- A permanent top-level **Research Atlas** navigation link now points to `#research-atlas`.
- The full AH2–AH44 ladder remains accessible under **Core Labs → AH2–AH44 Evidence Ladder** (`#experiments`).
- The hero now points to both the new Atlas and the existing evidence ladder.
- Source-linked cards provide searchable access to **semantic memory E0/E1A/E1B**, PHMP 1–3, optical O1/O2, quantum-boundary Q1–Q3, Keyhole Budgets K1–K7, RB3 and R5 evidence-review stages, provenance, AH governance/time tracks, and other recent foundations.
- Filter by research family, search identifier/title/description, expand a bounded initial result set, and follow source links to actual repository documents.
- A **synthetic interactive polarity illustration** demonstrates why unsigned cosine ties and explicit signed-real and binary complex-phase comparators agree. It never imports private memory, sends requests, invokes Ollama, or attempts natural language negation parsing.
- Responsive styles preserve desktop, mobile and keyboard navigation.

## Important research and source boundaries

- `src/researchAtlasData.js` is an **editorial, committed snapshot** of actual source files, not a live Github API feed. Research statuses must be reviewed and manually updated when protocols change.
- A green CI workflow proves that selected tests passed; it does not mean a physical hypothesis, real-data model, external review, or AI retrieval improvement is verified.
- PHMP-SM1 E1B is an **operator-run local CLI** with no confirmed user-hardware Ollama experiment yet. This hosted GitHub Page does not request access to local Ollama or private memories.
- PHMP-3 reserved evaluation remains separately gated; ordinary test-suite success does not spend a reserved split.
- RB3 real-data fitting is **blocked pending independent source review**. Do not convert its passed extraction/packet tests into claims of independent signoff.
- The UI links to the existing licensed repository research and contains no copy of external ResonanceDB source code.

## Qualification

```bash
npm run test:research-atlas
npm run test:navigation
npm run build
```

If the existing project names the navigation task differently, `npm test` includes its `test:navigation` equivalent in the full chain. The release must keep the original interactive panels and their hash anchors intact.

Source link integrity is checked by `scripts/test_research_atlas.mjs`; all indexed source paths must exist in the repository. Navigation regression checks ensure existing `#experiments` is retained while `#research-atlas` becomes visible.

## Future maintenance

When a research PR introduces a new protocol, add a short, source-grounded record to `src/researchAtlasData.js`, choose the conservative correct status, run `npm run test:research-atlas` and the full build, and link it directly to the repository document. Never invent test results or promote a research candidate automatically.

**Ledger Above Ego.**
