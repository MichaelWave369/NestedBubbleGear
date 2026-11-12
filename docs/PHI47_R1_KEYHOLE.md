# PHI47-R1 · Fixed-observation topology comparison (SIMULATED)

**Authority NONE.** This is a separate, deterministic experiment, not new physics, a neural capability, or evidence of a unique property of anyone's age.

Run `node scripts/test_phi47_keyhole_r1.mjs` (Node 20+). The script prints a complete machine-readable result after its assertions. It does not modify existing experiment results.

## Protocol
- 47 binary pockets; each sampled initial state has 24 positive and 23 negative entries, so the observer always sees aggregate **+1**.
- Compare three degree-eight, 47-vertex circulant graphs: seed-inspired strides **[8,9,12,16]**, local **[1,2,3,4]**, and separate control **[3,7,11,19]**.
- One synchronous update using the sum of neighboring signs. For zero votes, keep the previous sign.
- 512 pseudorandom initial masks generated from seeds `369 + 7919*k` using an explicit xorshift32 shuffle. Same masks for all graphs.
- Record histograms and empirical conditional entropy `H(future aggregate | current aggregate=+1)` for each graph.
- Independently relabel a graph and matching state and confirm identical updates under the relabeling. Deliberate stride collision must be rejected.

## Interpretation
This measures **finite-sample, within-model Keyhole ambiguity** under a restricted constant-observation family. Since the initial aggregate never changes, entropy is estimated from the future-outcome histogram. It is *not* the exhaustive 2^47-state entropy or a fair cross-dynamics finding. It complements, but does not supersede, the existing POLY-01 through POLY-05 research.

This output has no authority to select routes, change privacy controls, authorize a task, or make physical/quantum/consciousness claims. Future work: preregistered multi-rule/multi-prior holdout study, computational-cost baseline, and an explicitly versioned read-only export to Altermath.
