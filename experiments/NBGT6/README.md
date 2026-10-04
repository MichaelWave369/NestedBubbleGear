# NBG-T6 v0.1.0 — Temporal Keyhole Explorer UI

NBG-T6 makes the temporal research line visible on the live GitHub Pages site.

The explorer is built around a deliberately strict rule:

\`\`\`text
controls change the view
controls do not change the ledger
\`\`\`

The site now supports side-by-side knowledge cutoffs, evidence/relation filters, an analyst overlay, provenance inspection, an ambiguity queue, ledger heads, view fingerprints, and JSON export.

The browser model mirrors the frozen NBG-T5 synthetic witness. It does not fetch or verify real-world historical sources.

## Qualification

- browser model acceptance script PASS
- Vite production build PASS
- no-hindsight replay PASS
- source/review layer separation PASS
- pure filter projection PASS
- analyst overlay PASS
- provenance bundle PASS
- side-by-side change detection PASS
- export receipt PASS
