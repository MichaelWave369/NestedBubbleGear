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

See [docs/TEMPORAL_NBG.md](docs/TEMPORAL_NBG.md), [experiments/NBGT1](experiments/NBGT1/), and [experiments/NBGT2](experiments/NBGT2/).

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
