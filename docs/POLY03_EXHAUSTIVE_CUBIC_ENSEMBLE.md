# POLY-03 · Exhaustive fixed-size cubic graph Keyhole census

**Status:** finite synthetic computational experiment, **authority NONE**.
**Executable experiment:** [Altermath R26 PR #28](https://github.com/MichaelWave369/Altermath/pull/28).
**Prior NBG ledgers:** [POLY-01](POLY01_POLYHEDRAL_KEYHOLE.md) · [POLY-02](POLY02_RULE_PRIOR_ROBUSTNESS.md).

## Why this rung

Comparing original tetrahedral / octahedral / dodecahedral face counts 4/8/12 changes graph size and sometimes degree along with topology. Even when a mathematical Keyhole hides future aggregate information, that comparison cannot independently identify the effect of connectivity. POLY-03 fixes **eight vertices, exactly three neighbors per vertex and twelve undirected edges** for its entire population.

The question is: can graph connectivity change the conditional uncertainty about an aggregate-only observer's next measurement when the initial state distribution and deterministic update rule are identical?

## Complete finite population

All undirected simple cubic graphs on the **same eight labeled vertices** are generated exactly via a remaining-degree recursive edge constructor:

- 19,355 labeled 3-regular simple graphs in total.
- 35 disconnected cases, each a partition into two disjoint K4 components.
- 19,320 connected eligible labeled graphs.
- Five **triangle count / 4-cycle count signature groups** with exact frequencies.

| Triangles : four-cycles | Eligible labeled graphs | Exact uniform-majority H(Y|M), bits |
|---|---:|---:|
| 4:2 | 2,520 | 0.9574523144989763 |
| 2:2 | 10,080 | 1.324181611171151 |
| 1:3 | 3,360 | 1.5164507163647825 |
| 0:6, cube | 840 | 0.47437549538726076 |
| 0:4 | 2,520 | 1.2489297378455433 |

A four-cycle is any simple length-four cycle (not necessarily induced). Cube topology is the 8-node dual of an octahedron's face adjacency, continuing R24/R25's canonical case.

A triangle/4-cycle signature is not asserted as a universal graph-isomorphism detector. Labeled frequencies should not be mistaken for equal weights over unlabeled graphs.

## Exact Keyhole experiment

Let \(X_i\in\{-1,+1\}\), and assume all \(2^8=256\) full states are equally likely. Observe only \(M(X)=\sum_i X_i\). The synchronous next state obeys neighbor-majority \(F_i(X)=\mathrm{sign}(\sum_{j\in N(i)}X_j)\), with no ties because degree is odd. The predicted next observation is \(Y(X)=\sum_iF_i(X)\).

For **every** connected labeled graph, a standalone independent majority-bitmask enumerator computes \(H(Y\mid M)\), compares the entire group's min and max against a frozen exact reference, and fails if any variation occurs inside the stated signature group. This directly verifies the claim on the complete finite labeled population, not selected samples.

**Result:** Under these assumptions, different wiring topology produces measurably different hidden predictive uncertainty while vertex count and vertex degree are held constant. This is an expected kind of finite graph-model behavior, not evidence of new fundamental physics.

## Guardrails / next phase

- The result is **conditional on one observer projection, one update rule and one state prior**. The R26 live lab explores four POLY-02 rules and three priors on **representative graphs**, but does not claim a full exhaustive graph census for these other cases.
- Fingerprints count motifs and need not isolate their independent causal contributions. Distinct unlabeled structures, motifs and graph spectra can vary together.
- Higher conditional entropy is not necessarily better. It can signal information discarded by a coarse observer rather than desirable computation.
- No new cosmic planes, E8 embedding, extra-dimensional beings, quantum signaling, silicon consciousness, gravitation effect, or production AI improvement is established.
- **No PocketMesh production adapter, routing grant, model-training claim, or PhiKernel policy change.** Existing fail-closed and privacy rules are mandatory for any later integration.
- A future POLY-04 must predeclare realistic, authorized test tasks, evaluate against ordinary aggregate/graph-feature baselines, and measure accuracy, time, memory, failure rate and cost per correct result. If no real improvement survives holdout, publish the null.

## Verification

Run in Altermath:

~~~sh
npm run test --prefix site
npm run build --prefix site
~~~

Review \`site/src/polyhedralEnsemble.js\` and \`site/tests/polyhedralEnsemble.test.js\`, plus the detailed [R26 protocol](https://github.com/MichaelWave369/Altermath/blob/research/poly03-exhaustive-cubic-ensemble-r26/docs/polyhedral-ensemble-r26.md).

The exact 19,355 / 35 / 19,320 counts, group frequencies and majority entropies are hard validation gates, not presentation decorations.
