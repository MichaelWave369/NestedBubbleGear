# OBS-01 · Observer & Reality Lab

**Status:** deterministic, finite, synthetic interactive demonstrations. **Origin:** SIMULATED. **Authority:** NONE. **Physical evidence:** none.

This is an educational extension to NBG's existing G1 Geometry Keyhole and G2 Dimensional Recovery experiments. Plato's cave and the nested-pyramid metaphor motivate questions about observability; neither is offered as a claim that our universe is a literal cave, simulation, higher-dimensional projection or nested set of physical gears.

## Reproduce

- Open the [NBG Pages site](https://michaelwave369.github.io/NestedBubbleGear/#observer-reality) after deployment.
- Select each of five tabs and change its controls.
- Export the JSON ledger. It has fixed protocol/version, parameters and results, no dates, invented confidence, credentials or external requests.
- Run npm run test:observer-reality and npm run build.

## Five synthetic demonstrations and their negative controls

1. **Plato's projection:** A=[1,1,1,-1] and B=[1,1,1,+1]. The first three coordinates are identical; a fourth-coordinate query distinguishes them. Full 4D state recovery is **not** inferred from any arbitrary 3D sensor. G2 tests constrained recovery budgets separately.
2. **Reference frames:** Choose A/B/C as origin, rotate 0/90/180 degrees. Raw coordinates change while the three pairwise Euclidean distances remain numerically invariant. Unlike projection, the frame change preserves information.
3. **Topology:** For a connected 6- or 12-vertex ring, the independent cycle count is β₁=E−V+C=1. Rearranging node positions leaves it unchanged. Cutting the closing edge changes β₁ to 0, a direct negative control. Shared β₁ between different graphs alone says nothing about shared dynamics or cosmology.
4. **Causality:** Compare structural models M1: A=H,B=H and M2: A=H,B=A, H∈{0,1}. Observation alone gives A=B=H for both. An ideal do(A=1) with H=0 separates B=0 (M1) from B=1 (M2). It requires a well-defined intervention and does not license causal claims from arbitrary real-world correlations.
5. **Time and partial observation:** Sample a slow sine plus 0.35 sin(4πt). At integer seconds the 2-Hz term is zero; at a 0.8-second interval sampled residual becomes nonzero. Separately, a specified system x'=0.7x+0.25h, h'=0.9h−0.1x allows exact two-delay prediction x(t+1)=1.6x(t)−0.655x(t−1). A fixed visible-only baseline x'=0.7x incurs nonzero error. The delay identity is derived from *known toy coefficients*, **not learned** and not a general guarantee for arbitrary hidden systems.

## Falsification and interpretation

An observer cannot infer a unique hidden cause from a single non-injective projection. A successful invariant requires explicit transformations under which it is promised to persist; cutting topology is not a reference-frame change. Intervention tests rely on the chosen structural equations. At particular sampling times a hidden component can disappear, but timing changes do not guarantee recovery of every unknown frequency. Low prediction error in a fully known finite toy does not establish physical universality.

**Excluded claims:** discovered higher physical dimensions, cosmic imprisonment, a real holographic universe, causal discovery of natural phenomena, conscious universes, new conservation laws, neural advantages, or PocketMesh routing authority.

## Next experiments, not yet implemented

- Fixed train/validation/holdout with blind recovery of a family of graphs and observation masks.
- Add deterministic noise, missing data, adversarial controls, and explicit abstention.
- Compare competing dynamical models under a budget for active measurements.
- Distinguish invariants under graph isomorphism, geometric transformations, and actual renormalization flows; avoid conflating them.
- Surface signed test receipts only if they remain simulation-scoped and provenance is honestly described.

See [Geometry Keyhole](GEOMETRY_KEYHOLE.md), [Dimensional Recovery](DIMENSIONAL_RECOVERY.md), and [Research Atlas](RESEARCH_ATLAS.md).