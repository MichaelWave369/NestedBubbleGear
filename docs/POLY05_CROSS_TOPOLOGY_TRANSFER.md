# POLY-05 · Cross-Topology Keyhole Transfer and Relabeling

**NBG status:** proposed synthetic transfer experiment, **authority NONE**.
**Executable implementation:** [Altermath R28 PR #30](https://github.com/MichaelWave369/Altermath/pull/30).
**Predecessor:** [POLY-04 heldout-state research](POLY04_HELDOUT_FORECAST.md). Earlier formal tracks: [POLY-03](POLY03_EXHAUSTIVE_CUBIC_ENSEMBLE.md).

## Research question

A predictor that succeeds on unseen pocket states *within a known network* might only have learned graph-specific patterns. POLY-05 tests a stricter form of generalization: when all training and validation examples come from **different graph structures** than the target, do coarse Keyhole forecasts and validation-chosen sensor locations transfer?

A second negative-control axis randomly reassigns the target graph's node labels. This does not change the underlying abstract graph, but it changes which physical node is addressed by a fixed index. A sensor-location choice with no semantic anchor is not inherently transferable across graphs.

## Registered five-fold design

Use five fixed, connected, degree-three, eight-vertex cubic representatives from POLY-03. Their signatures are triangle-count : four-cycle-count. For each of five target families, choose the next family in cyclic order as validation and use the other three for training. The holdout family contributes **no labels to fit or sensor selection**.

- **Train:** three distinct graphs × all 256 possible binary pocket states = **768 synthetic labeled records**.
- **Validation:** one completely separate graph × 256 states = **256 labeled records**.
- **Holdout:** fifth graph × 256 states = **256 test records** for each of four label assignments.
- The test variants are unchanged canonical node indices, followed by exact graph-isomorphic vertex relabelings generated from fixed seeds **369, 636, 963**.
- This yields five folds × four label variants = 20 conditions and **5,120 synthetic heldout predictions per method per rule/budget**.

The same binary masks occur on different graph families; this is **out-of-graph transfer, not out-of-state transfer**. All update labels are calculated from one of four known synthetic POLY-02 graph rules, not obtained from external agent tasks, humans, instruments or hardware.

## Equal-cost baselines

The Keyhole always reveals the current signed pocket aggregate. Additional observation budget k∈{0,1,2} counts raw individually observed pocket signs. Four methods use the exact same training and heldout graph data, as well as the same k:

- Aggregate only (k=0).
- Fixed first-k pocket indices.
- Seeded random choice of k indices without viewing target labels.
- Sensor locations chosen among 8 singletons or 28 pairs by heldout-family-independent validation accuracy and MAE, then frozen before target testing.

Predictors use R27's empirical-mode lookup. An unseen feature key falls back to aggregate-only prediction based on training data, not on target labels.

Evaluate exact-match next-aggregate accuracy, mean absolute error, candidate-minus-fixed and candidate-minus-aggregate percentage-point differences. **All negative and zero outcomes must remain visible.** Do not imply higher hidden entropy is better prediction or cognition.

## Negative controls / gates

1. Distinct graph-family IDs in all three partitions, with no target graph in training or validation. Same state masks on different graphs are allowed and explicitly disclosed.
2. Vertex relabeling preserves node count, degree, undirected edges and graph isomorphism; the state-update rule must commute with a correspondingly relabeled state for every mask and all four update laws.
3. Budget k=0 must produce identical accuracy for aggregate, fixed, random and selected models.
4. Under identity dynamics, the current aggregate must perfectly predict the next aggregate for every target family and label assignment.
5. All sensor selection occurs before any test labels are used. Test-graph performance cannot trigger a refit, retuning or selection of a more favorable relabel seed.
6. Report all five target-family outcomes and all canonical/relabel variants regardless of whether the method improves, ties, or regresses.

## Research interpretation

If candidate accuracy collapses when target node labels are permuted, that is evidence of **index dependence in this toy procedure**, not evidence for a new physical force. If candidate outperforms on all five families, that is still **not** evidence that learned routing, agent memory or NBG-inspired topology improves real systems.

Graph labelings are arbitrary; an application adapter would need meaningful stable identifiers and explicit capability checks. A practical evaluation must supply independent consented tasks, clear metadata semantics, fixed train/validation/test datasets, latency/memory/cost-per-success baselines, privacy and hard PhiKernel gatekeeping.

This ledger does not modify production PocketMesh, grant authority, assert E8 cosmology, imply extra physical dimensions, or claim consciousness/quantum communication.

## Verification

In the Altermath repository:

~~~sh
npm run test --prefix site
npm run build --prefix site
~~~

[POLY-05 code and test PR](https://github.com/MichaelWave369/Altermath/pull/30) · [POLY-05 detailed protocol on proposed branch](https://github.com/MichaelWave369/Altermath/blob/research/poly05-cross-topology-transfer-r28/docs/keyhole-transfer-r28.md).

**Stop conditions:** cross-family leakage, invalid graph relabels, oracle disagreement, negative-outcome suppression, broken fair budgets or any accidental grant of production authority.
