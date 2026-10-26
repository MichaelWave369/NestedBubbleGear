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

## EG-01 | Coupled Field Observability (SIMULATED)

The Atlas now includes a first-class React EG-01 workbench and a source-linked **Field & Gravity** research track. Visitors can vary normalized drive amplitude, inject a hypothetical extra coefficient, toggle deterministic perturbation and compare a single-orientation coarse Keyhole against a paired, fixture-mirrored observation. The single run cannot distinguish magnetic pickup from the injected extra coefficient because the design matrix is rank deficient; the paired configuration can recover the injected coefficient **under explicit synthetic fixture-invariance and proxy-calibration assumptions**.

Use the export button to download a **SIMULATED / authority NONE** JSON receipt locally. No real magnetic hardware, superconductor, gravity sensor or remote service is involved. Primary sources and limitations are documented in [EG-01 PROTOCOL](../experiments/EG01/PROTOCOL.md). The historical source is Amy Eskridge's [HAL5 December 2018 presentation](https://www.hal5.org/PDF/HAL5-Dec2018-Talk-AntiGravity.pdf), not evidence of an operating anti-gravity apparatus. The 2003 Hathaway et al. replication reported no gravity-like force within instrument sensitivity.

Qualification: `npm run test:eg01 && npm run test:research-atlas && npm run build`. All existing AH and PHMP frozen results retain their previous scope.
