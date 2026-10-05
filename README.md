# Nested Bubble/Gear (NBG)

[![CI](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/ci.yml/badge.svg)](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/ci.yml)
[![Pages](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/pages.yml/badge.svg)](https://github.com/MichaelWave369/NestedBubbleGear/actions/workflows/pages.yml)
[![Code License: MIT](https://img.shields.io/badge/code-MIT-73ffc5.svg)](LICENSE)
[![Research Content: CC BY 4.0](https://img.shields.io/badge/research%20content-CC%20BY%204.0-8bc9ff.svg)](LICENSE_POLICY.md)

**Nested Bubble/Gear (NBG)** is an experimental mathematical and computational framework for studying systems in which coarse observables can hide causally relevant internal structure.

> **Core question:** When two states look identical through the current Keyhole, can an admissible future interaction reveal that they were never behaviorally equivalent?

## Live research site

**GitHub Pages:** https://michaelwave369.github.io/NestedBubbleGear/

The React site presents the research stack, interactive **Bubble Atlas**, canonical **Bubble Zoo**, Keyhole depth explorer, frozen AH experiment ladder, core equations, and claim firewall.

## Current stack

```text
NBG
  -> Conveyor
  -> Gear
  -> Altermath
  -> Keyholes
  -> Φ-System integration
  -> Ledger
```

- **NBG** — domains and interfaces.
- **Conveyor** — between-step/interface transport state.
- **Gear** — ordered recurrence and cycle-space current.
- **Altermath** — causally relevant structure hidden by coarse cancellation.
- **Keyholes** — observer projections and observability depth.
- **Φ-System** — task-typed convergence/control layer, maintained as a conceptually separate line.
- **Ledger** — replayable provenance.

## Temporal NBG (NBG-T)

NBG-T extends the same hidden-structure question across **history** rather than only a single present state.

A temporal model keeps versioned state, lineage, and two clocks:

- **valid time** — when an event belongs in the modeled world;
- **known time** — when evidence for that event entered the ledger.

The first executable rung, **NBG-T1**, freezes a synthetic witness in which two histories are identical through the coarse present Keyhole but retain different hidden lineage. The same later admissible probe reveals that difference. NBG-T1 also freezes no-hindsight replay and explicit counterfactual separation.

**NBG-T2** adds typed temporal relations so chronology, allegation, documentation, inference, contradiction, and supersession cannot silently collapse into the same generic arrow. It also freezes explicit Keyhole projection and narrow typed composition rules.

**NBG-T3** adds contradictory-source reconciliation: explicit source independence, duplicate-lineage detection, support/opposition ledgers, conservative dispute preservation, and an explicit refutation gate.

**NBG-T4** adds hostile dense-ingest semantics: generic source arrows become `ALLEGED_LINK`, chronological placement remains non-causal, adjacency creates no edge, unreadable labels become `UNKNOWN`, unsupported relations are refused, and analyst hypotheses stay on a separate layer.

**NBG-T5** adds evidence-linked review and Temporal Keyholes: reviewer actions append to a hash-chained ledger, earlier snapshots remain replayable, source status stays distinct from later review status, filters are pure projections, and analyst hypotheses remain a separate overlay.

**NBG-T6** exposes those semantics in the live GitHub Pages Temporal Keyhole Explorer with side-by-side cutoffs, evidence/relation filters, provenance inspection, ambiguity review, analyst overlays, ledger heads, and governed JSON export.

**NBG-T7** adds governed evidence-capture semantics: every retrieval becomes a hashed receipt, retrieval alone cannot alter review state, source-version drift is explicit, contradictions are preserved, and captured evidence can replay offline.

**NBG-T8** connects that contract to an operator-triggered read-only HTTP capture path and a governed review queue in the Temporal Explorer. Captures are persisted before review, host access is allow-listed, drift is visible, and browser ACCEPT/REJECT controls remain session projections until exported.

**NBG-T9** adds portable evidence bundles and a stable source registry: content-addressed objects are deduplicated, mirror captures do not manufacture independence, source drift survives export/import, reviewer identities remain attributed, and conflicting review decisions merge as `REVIEW_CONFLICT` rather than last-write-wins.

**NBG-T10** adds explicit trust-policy and conflict-resolution receipts: reviewer roles and authority are registered, policies are hashed data objects with quorum/weight/time rules, the same preserved disagreement can yield different named governance outcomes, and no policy outcome is presented as objective truth.

See [docs/TEMPORAL_NBG.md](docs/TEMPORAL_NBG.md), [experiments/NBGT1](experiments/NBGT1/), and [experiments/NBGT2](experiments/NBGT2/). See also [experiments/NBGT3](experiments/NBGT3/), [experiments/NBGT4](experiments/NBGT4/), [experiments/NBGT5](experiments/NBGT5/), [experiments/NBGT6](experiments/NBGT6/), [experiments/NBGT7](experiments/NBGT7/), [experiments/NBGT8](experiments/NBGT8/), [experiments/NBGT9](experiments/NBGT9/), and [experiments/NBGT10](experiments/NBGT10/).

## Frozen AH ladder

| Rung | Focus | Outcome |
|---|---|---|
| AH2 | Latent causal residue | PASS · 29/29 |
| AH3 | Boundary-transferred residue | PASS · 89/89 |
| AH4 | Two-interface Altermath holonomy | PASS · 44/44 |
| AH5 | Noncommuting interface order | PASS · 36/36 |
| AH6 | Closed commutator loop | PASS · 41/41 |
| AH7 | Oriented holonomy cancellation | PASS · 65/65 |
| AH8 | Plaquette transport / curvature proxy | PASS · 63/63 |
| AH9 | Basepoint transport / local-to-global composition | PASS · 106/106 |
| AH10 | Three-plaquette transport / composition order | PASS · 158/158 |

See [docs/EXPERIMENTS.md](docs/EXPERIMENTS.md).

## Mathematical heart

A working Altermath witness is:

```text
P(X) = P(X')
but
there exists an admissible future word w
such that
P(rho(w) X) != P(rho(w) X')
```

The states are observationally equivalent **now**, but not behaviorally equivalent under the allowed dynamics.

## Claim firewall

NBG maintains an explicit distinction between:

1. **demonstrated finite toy-model results**;
2. **formal machinery under development**;
3. **speculative physical interpretation**.

Read [CLAIMS.md](CLAIMS.md) before treating a mathematical toy result as evidence about horizons, cosmology, or fundamental spacetime. Humanity has enough problems without a GitHub README inventing another one.

## Repository map

```text
.
├── src/                  React research site
├── docs/
│   ├── BUBBLE_ATLAS.md   Bubble-family taxonomy
│   ├── BUBBLE_ZOO.md     Canonical toy behaviors
│   ├── CONCEPTS.md       Working vocabulary
│   ├── EXPERIMENTS.md    Frozen AH experiment ladder
│   ├── TEMPORAL_NBG.md   Temporal lineage / bitemporal model
│   └── ROADMAP.md        Next research rungs
├── experiments/
│   ├── AH9/              Frozen runnable rung
│   ├── AH10/             Frozen runnable rung
│   ├── NBGT1/            Frozen temporal-lineage rung
│   ├── NBGT2/            Frozen typed temporal-graph rung
│   ├── NBGT3/            Frozen source-reconciliation rung
│   ├── NBGT4/            Frozen hostile-ingest rung
│   ├── NBGT5/            Frozen evidence-review / Temporal Keyhole rung
│   ├── NBGT6/            Frozen Temporal Keyhole Explorer UI rung
│   ├── NBGT7/            Frozen evidence-capture adapter rung
│   ├── NBGT8/            Frozen live-adapter / review-queue rung
│   ├── NBGT9/            Frozen portable evidence-bundle rung
│   ├── NBGT10/           Frozen trust-policy / resolution-receipt rung
│   └── archive-index.json
├── CLAIMS.md             Claim-status firewall
├── CITATION.cff
├── LICENSE              MIT software license
├── LICENSE_POLICY.md     MIT / CC BY 4.0 scope map
└── .github/workflows/    CI + Pages deployment
```

## Development

```bash
npm install
npm run dev
npm run build
```

The Vite base path is configured for GitHub Pages at `/NestedBubbleGear/`.

## Research stance

NBG is an active research program, **not an established physical theory**. Frozen toy models are used to make precise questions executable and falsifiable before any broader interpretation is entertained.

## Archive

Frozen research releases and related work are archived through the **Enter the Field | Φ369 Research Lab** Zenodo community:

https://zenodo.org/communities/enter-the-field-phi369/records

## Licensing

NBG uses a deliberate split:

- **software/code:** MIT;
- **original research prose, figures, documentation, and research-content artifacts:** CC BY 4.0 unless a file/archive says otherwise;
- **third-party material:** retains its own terms.

See [LICENSE_POLICY.md](LICENSE_POLICY.md) for the exact scope and attribution guidance.
