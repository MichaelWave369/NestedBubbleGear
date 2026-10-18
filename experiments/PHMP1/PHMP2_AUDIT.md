# PHMP-2 | Native NBG correspondence audit (prospective, not executed)

**Status:** PROPOSED audit. This file records existing-source observations and a falsifiable procedure, **not** a positive correspondence or experimental NBG result.

## Prior native evidence

- [AH4–AH8 frozen dossiers](../AH2-AH10_DOSSIERS.md) describe hidden phase, noncommuting order, closed commutator loops, oriented inverse cancellation, and two plaquettes with local nontriviality but trivial outer boundary. Their original frozen ZIP hashes and documented outcomes must be honored. The dossier alone is not an operator-by-operator code review of those archive bytes.
- [AH9 specification](../AH9/SPEC.md): native **row-vector** states, traversal-order multiplication, and matrices in `SL(2,Z)`. It computes a correct outer boundary `T B T^-1 A` versus naive `BA`, including a 12-connector suite and conjugacy invariants.
- [AH10 specification](../AH10/SPEC.md): native row-vector `SL(2,Z)` three-plaquette composition with explicit connectors `T1,T2`. It checks `T1 T2 C T2^-1 B T1^-1 A` against transported local composition across 16 connector pairs.
- [PHMP-1](SPEC.md) uses **column-vector** complex unitary matrices `H,S in U(2)` and a separate H/S commutator word. Similar terminology is not an established representation equivalence.

### Early mathematical obstruction, not a failure of NBG

Native AH9/AH10 use `A=[[1,1],[0,1]]`, a nonidentity unipotent with a nontrivial Jordan block. A finite-dimensional unitary matrix is diagonalizable over complex numbers. Therefore **no similarity transform** takes this native 2x2 `A` to a unitary matrix in the same 2-dimensional positive-definite complex inner-product representation. Replacing A by H or S does not preserve the frozen native operator.

This is a specific obstruction to a simple 2x2 unitarization-by-basis-change, **not** a proof that all alternative representations, embeddings, or other nonunitary connections are impossible.

## Required audit gates

1. Obtain and hash-verify actual AH4–AH8 frozen archives before claiming an operator-level map. Existing dossier text is insufficient for that claim.
2. For AH9 and AH10, independently enumerate actual native edge, connector, and loop operations; preserve their row convention and composition order.
3. Define a candidate map on objects (state spaces), arrows (typed interfaces), composition, identities, reversals where defined, and observer projections. Show exact equations for which structures commute under that map.
4. First test ordinary **GL(2)** or **SL(2,Z)** discrete-connection analogues in the native matrices; do not presume every connection is unitary.
5. Separately test a proposed phase-valued/unitary representation, and state whether it is faithful, loses information, changes dimension, requires additional state, or fails.
6. Verify basepoint conjugacy, the difference between local and global loops, orientation reversal, the commuting controls, and AH8 local-cancellation controls. Preserve both successful and failed mappings.
7. Only then formulate a new frozen, NBG-specific held-out predictive test against standard group-connection, matrix, and causal-memory baselines at matched observational and resource budgets.
8. Keep NBG authorization/revocation and anti-hindsight rules as **additional engineering policy constraints**, not gauge axioms.

## Result categories

- `EXACT_CORRESPONDENCE`: a faithful map and all specified commuting diagrams/checks verified.
- `PARTIAL_CORRESPONDENCE`: specified subset maps; obstructions explicitly retained.
- `OBSTRUCTION`: a required map cannot exist under stated assumptions; retain counterexample.
- `NOT_EVALUATED`: missing archive, unimplemented test, or inaccessible evidence.

No category implies discovery of new physics. An elementary linear-algebra mapping is not by itself an NBG-specific predictive advance.

## Ledger rule

No original frozen artifacts or result hashes are to be rewritten or reinterpreted as physical evidence. New read-only overlays must carry their own provenance, checksums, null controls, and failed-case receipts. A future PHMP-2 experiment must be frozen *before* held-out scoring.
