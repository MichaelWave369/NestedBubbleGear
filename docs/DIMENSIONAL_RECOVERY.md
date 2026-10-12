# NBG-G2 · Dimensional Recovery
Version: **0.1.0** · Model: **FINITE / EXACT / SIMULATED** · Authority: **NONE**

## Motivation and relationship to G1
G1 proved an elementary information-loss witness: two *different* 4D hypercube vertices share the same projection onto three coordinates. G2 **does not** assume hidden dimensions exist in our world; instead, it asks exactly what observation capabilities are needed to distinguish finite abstract states, how task choice changes recovery, and when an honest observer must refuse an answer.

The finite experiment is based on GF(2) linear algebra, not a physics engine or a continuous geometric reconstruction algorithm. The "4D" object here is only the four-bit vertex-state labeling of G1's abstract tesseract graph.

## Frozen state space
- Uniform state prior: the sixteen binary words s in {0,1}^4.
- The coordinates X,Y,Z,W map 0 -> -1 and 1 -> +1 as in G1.
- A probe with integer bit mask m in [1,15] returns p_m(s) = parity(s & m), one bit.
- Initial observer K_d reads the first d coordinates, d=0,1,2,3,4.
- The observer's compatible set is all vertices producing the same probe outputs. No hidden state is guessed.
- H(FULL_STATE | K) = 4 - rank_GF2(K) bits under this fixed uniform prior.
- H(W | K) is 0 if W's basis mask belongs to the linear span of the observed masks and 1 otherwise.
- This is *conditional Shannon entropy for a fixed finite uniform state distribution*. It is not measured physical entropy.

## Task families
1. FULL_STATE: reveal all four coordinate bits. Success exactly when the mask span has rank four.
2. HIDDEN_W: reveal the W bit alone. Success when e_W belongs to the span, even if other coordinates remain unknown. Hence identifying the task does **not** imply full state reconstruction.

## Frozen observer libraries and synthetic costs
All weights are invented arbitrary **probe-credit costs**, and MUST NOT be presented as hardware, money, runtime, physical energy, or a measured resource.

| Probe | Binary mask | Credits |
|---|---|---|
| X / Y / Z / W | 1 / 2 / 4 / 8 | 3 each |
| X XOR W / Y XOR W / Z XOR W | 9 / 10 / 12 | 2 each |
| X XOR Y XOR Z XOR W | 15 | 1 |
| X XOR Y XOR Z | 7 | 0.25 |

Profiles:
- DIRECT allows just the four elementary coordinate probes.
- HYBRID allows all nine probes.
- BLIND allows X,Y,Z and XYZ only. It never observes W and thus cannot reconstruct W under d<4, even at arbitrary budget.

Probes already supplied by the baseline are excluded from the paid library to avoid charging twice. Other linearly dependent probes are *permitted* but add no information.

## Predeclared algorithm, outcomes and refusal gates
- Exhaustively examine every permitted subset, not just greedy choices.
- Primary objective: minimize total credits **subject to full resolution of the declared task**.
- If many subsets have equal cost, select fewer probes, then deterministic lexicographic IDs. This is only a tie break.
- If sufficient subsets exist but exceed the selected credit budget, return BUDGET_INSUFFICIENT and expose the most informative affordable subset.
- If the available library cannot span the task even with unlimited budget, return UNOBSERVABLE_LIBRARY.
- If resolved within budget, return RECOVERED.
- For budget-limited fallback: minimize task residual entropy, then cost, then number of probes, then lexicographic probe IDs.
- Recalculate compatible state sets after each selected probe by replaying the selected true synthetic state. The planner itself is constructed without knowledge of the selected state and the system has no probabilistic measurement noise.

Known exact controls, for FULL_STATE and unlimited budget:

| Initial depth | Base residual bits | DIRECT min credits | HYBRID min credits |
|---|---:|---:|---:|
| 0 | 4 | 12 | 5.25 |
| 1 | 3 | 9 | 3.25 |
| 2 | 2 | 6 | 1.25 |
| 3 | 1 | 3 | 1 |
| 4 | 0 | 0 | 0 |

Important context control: the inexpensive XYZ parity probe is redundant under a K3 baseline, where X, Y and Z are already known, but is useful when those are not all known. Cheap does not automatically mean informative.

Negative controls:
- With a K3 baseline, adding XYZ alone leaves W unresolved.
- A BLIND profile with d<4 cannot recover FULL_STATE or W.
- At K3 and HYBRID, budget 0.5 cannot afford any sufficient probe, so recovery is refused even though a 1-credit sufficient probe exists.

## Acceptance criteria
- 16 distinct four-bit vertices and correct +/- coordinate mapping.
- Baseline K_d yields 2^(4-d) compatible vertices for every state.
- Exact rank invariance to query order and duplication.
- 3D -> 4D witness distinguishes the W-flipped pair after one allowed independent query.
- The exact direct/hybrid cost table matches the frozen expectations.
- Rank-based recovery equals brute-force pairwise distinguishability for **all 512 subsets** of the HYBRID library, for both task families.
- All sixteen witness states correctly reproduce the predicted compatible-set sizes at every projection depth.
- Finite invalid input and impossible cases are rejected; receipts remain deterministic, with origin=SIMULATED and authority=NONE.

## Execute
    npm run test:g2
    npm run dev

In the Pages interface, visit the Dimensional Recovery panel. Vary depth/profile/task/budget, choose the hidden state, step through compatible-state refinements, and export the deterministic JSON receipt.

## Interpretation and limits
This exact finite example shows **task-relative observability** and how observer restrictions and probe costs can create a recovery/refusal frontier. The outcome cannot establish a new physical dimension, a cosmic prison, Saturnian control, consciousness manipulation, physical reversibility, topology change, cube-foldability, or historical religious causation. The cost model is artificial. There is no statistical inference or empirical dataset.

Related source: [G1 protocol](GEOMETRY_KEYHOLE.md) and [claim firewall](../CLAIMS.md). The model, tests and visualizer are in src/dimensionalRecovery.js, scripts/test_dimensional_recovery.mjs and src/DimensionalRecoveryLab.jsx. Existing G1, AH, BR and historical frozen records are not edited.
