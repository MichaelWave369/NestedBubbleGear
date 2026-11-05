# NBG-BD03 · Compositional Rule Synthesis and Distribution Shift

**Version:** 0.1.0 · **Origin:** SIMULATED · **Authority:** NONE

## Research question

Can a constrained observer synthesize candidate six-site ring transition rules from a bounded mathematical expression language, rank hypotheses by structural complexity, and score *frozen* predictions against unseen input states and different input distributions?

This continues NBG-BD01/BD02 without modifying frozen evidence or claiming a new law. Unlike BD02, rule descriptions are **constructed from primitive expressions**, not selected by names like `TRIPLE_PRODUCT` or `MAJORITY_THREE`.

## The predeclared grammar (the real scope)

Each site has neighbors `L = s_(i-1)`, `C=s_i`, `R=s_(i+1)`, with signed values ±1. The grammar permits:

- leaves `L`, `C`, and `R`, each costing one expression-tree node;
- `NOT(x) = -x`, costing one additional node;
- `MUL(x,y) = x*y`, costing one additional node;
- `MAJ(x,y,z) = sign(x+y+z)`, costing one additional node.

Enumerate all expression trees up to `maxCost` (1–6 nodes). Normalize exact local behavior using the complete 8-row truth table for L,C,R. Retain the shortest then lexicographically first expression per table. This is **finite enumerative synthesis with exact semantic deduplication**. It is not arbitrary programming, a neural learner or open-ended inference. A 3-neighbor rule cannot encode a global six-site parity dependency or a position-specific exception. Test those as hostile oracles.

## Two Keyholes

- `SUM`: sum of all six next-site signs. Different local operators may have the same aggregate for all 64 inputs.
- `ANCHOR_0`: sign of next-state site 0. This can separate some operators that `SUM` cannot.

Under `SUM`, `LEFT_PAIR` and `RIGHT_PAIR` remain task-equivalent despite producing different full next states on some inputs. Do **not** identify the generating mechanism from coarse-equivalent predictions.

## Two predeclared input splits

- `INTERLEAVED`: 48 training input states where `state % 4 !== 0`; 16 reserved input states with `state % 4 === 0`.
- `PARITY_SHIFT`: train on the 32 inputs with an even number of positive sites; reserve the other 32 states for holdout. This is a deliberate distribution shift, not random IID sampling.

Each input state is unique and fully pinned before any oracle responses are read. All model selection and probe selection use only the training portion. The synthetic ground-truth oracle is visible to the **researcher** through UI settings but is **never passed to probe selection**.

## Observation and selection

With budget 0–48, repeatedly choose an unused train-state input. The `ENTROPY` policy maximizes Shannon entropy of predictions across surviving local truth tables, using equal weighting of each surviving semantic rule. Ties prioritize Hamming-distance novelty from previous queries, then lowest input ID. The `FIXED` control requests increasing input IDs with the same budget.

After the input is chosen, the oracle returns one coarse next-state measurement. Filter the candidate expression tables to those matching *all* observed outputs. This is noise-free, exact consistency, not statistical hypothesis testing.

If the grammar has no survivors, refuse further predictions and report `GRAMMAR_REJECTED`. If no queries were made, report `NO_TRAINING`. If all surviving rules agree on the selected task across all 64 full states, report `TASK_PREDICTION_IDENTIFIED_WITHIN_GRAMMAR`, which is **not** mechanism identification. Otherwise choose the minimum-node-count, lexicographically first training-consistent expression as a `PROVISIONAL_MDL` prediction.

An MDL preference is not a guarantee of generalization. Complexity is measured in declared expression-tree nodes, not hardware or runtime cost.

## Reserved holdout (no leakage)

Freeze the selected rule **before** any target labels from holdout states are accessed. Then score exact match and mean absolute error against the untouched held-out oracle outputs. Never adjust or promote the rule based on the score.

Conventional controls: fixed right-neighbor product, no-change observation, and the mode of observed *training* readings. Separately compare `ENTROPY` and `FIXED` input policies with identical budgets, splits and DSL.

The `GLOBAL_PARITY` oracle returns next-state all-positive iff the signed product of all six current sites is positive. In `PARITY_SHIFT`, every training label is +6 under the `SUM` task, while every holdout label is −6. A synthetically perfect training fit can therefore produce a total holdout failure. **This is an intentional negative control, not evidence that NBG discovered a universal failing of learning.**

The `POSITIONAL_FLIP` oracle flips one fixed output site after right-pair update. This violates the homogeneous local-rule assumption.

## Reproduce

    npm run test:bd03
    npm test
    npm run build
    npm run dev

After merging and deploying, open **Recovery → Rule Synthesis · BD-03** on the NBG Research Atlas and export JSON evidence. Every row contains the training probe order, its response, remaining hypothesis count, the frozen expression, held-out predictions, baseline predictions, scores and claim boundary.

## Explicit limitations and next rung

This module can only construct rules from the predeclared DSL. It relies on a perfect deterministic synthetic oracle; it does **not** account for measurement noise or actual hardware. The parity-shift split is adversarial and artificially constructed. A holdout success cannot establish universal predictive validity; an observed failure is preserved.

A future BD04 should compare against Bayesian program synthesis and decision-tree baselines, test a family of independently sampled dynamics rather than one fixture, include measurement noise and sensor trust, preregister stopping criteria, and preserve unknown/unidentifiable outcomes. No rule here establishes a physical extra dimension, Saturnian connection, spiritual imprisonment or computational awareness.
