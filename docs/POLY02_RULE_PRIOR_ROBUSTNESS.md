# POLY-02 · Update-rule and prior sensitivity ledger

**NBG status:** exact finite synthetic research extension, **authority NONE**.
**Altermath implementation:** [R25 PR #27](https://github.com/MichaelWave369/Altermath/pull/27) (review pending when ledger authored).
**Baseline and prior gate:** [POLY-01 ledger](POLY01_POLYHEDRAL_KEYHOLE.md).
**PocketMesh:** no adapter, no routing authority, no permission changes.

## Primary question

In POLY-01 we observed different next-step aggregates among different full graph states sharing the same current aggregate. That is **observer insufficiency under one chosen dynamics**, not evidence of hidden spatial dimensions. POLY-02 asks whether the conclusion survives varied update rules and independent Bernoulli priors with better-controlled graph comparisons.

## Registered model

- 4, 8, and 12 original face-pockets; faces are represented as vertices of **dual face-adjacency graphs** K4, cube, and icosahedron.
- Each full state \(X\in\{-1,1\}^n\) has independent Bernoulli weight \(p^{k(X)}(1-p)^{n-k(X)}\) for \(p\in\{1/4,1/2,3/4\}\).
- The coarse NBG **Keyhole** sees \(M=\sum_i X_i\), while the observed future is \(Y=\sum_i F(X)_i\).
- Exact exhaustive conditional entropy \(H(Y\mid M)\) is computed, not estimated by sampling over masks.

The four preselected update laws are:

1. Strict **neighbor majority** (original R24).
2. **Neighbor parity** (product of neighboring signs).
3. **Inertia/tie-to-self majority**, including each node's own sign as a vote and retaining its sign when tied.
4. **Identity/null dynamics**. If \(F(X)=X\), the resulting \(H(Y\mid M)\) **must be exactly zero**, regardless of source shape or prior.

## Adversarial methods

Altermath R25 includes an independent array-based reference oracle checking the complete 3-solid × 4-rule × 3-prior canonical grid, along with exact mass normalization, 25%/75% sign-symmetry, R24 continuity, and graph validation failures. The provided controls use fixed seeds, connected degree-preserving edge swaps (n, degree, edge counts, rule, prior held constant).

**Important limitations:**
- An eight-graph seed sample cannot yield a population p-value or confidence interval. No "statistically significant" geometry effect is claimed.
- Two labeled edge sets may be graph-isomorphic; R25 reports only distinct **labeled** controls.
- K4 is unique under 4 nodes and degree 3. It **cannot** offer a distinct matched degree-preserving graph.
- 4/8/12 solids vary in vertex count, so cross-solid differences still confound size and topology.
- Every metric is a property of a *synthetic* rule and assumed prior. Neither hidden information nor entropy is an intelligence score, a physical force, or a higher-dimensional signal.
- Positive or negative results both matter and must be reported.

## Verification gate

Run the Altermath test/build and inspect the pull-request workflow results:

~~~sh
npm run test --prefix site
npm run build --prefix site
~~~

Review \`site/tests/polyhedralRobustness.test.js\`, the UI \`site/src/PolyhedralRobustnessLab.jsx\` and the predeclared [R25 protocol](https://github.com/MichaelWave369/Altermath/blob/research/poly02-dynamics-robustness-r25/docs/polyhedral-robustness-r25.md).

**Stop or revise** if any independent reference check disagrees with the primary implementation, probability mass fails to normalize, controls fail to preserve their declared invariants, or the identity null has nonzero entropy.

## What would make POLY-03 worthwhile?

Only after POLY-02 is green and independently reviewed:

1. Design a fixed-size/degree **enumerated or well-characterized graph ensemble**, and compute stable topology features and uncertainty over graph controls.
2. Pre-register operational tasks where observability changes outcomes, and compare with simple aggregate-only and conventional graph-feature predictors on held-out examples.
3. For any PocketMesh work, benchmark real task accuracy, latency, memory, budget and failures under existing fail-closed permissions. A graph score must never authorize a task or bypass manifest privacy controls.

**No demonstrated PocketMesh improvement or novel physics is claimed.**
