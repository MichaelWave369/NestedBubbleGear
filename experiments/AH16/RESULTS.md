# AH16 v0.1.0 Qualification Results

## Verdict

**PASS_AH16**

- Frozen acceptance checks: **43/43**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**

## External authority store

- descriptor: `action = (H2,H3)`
- classes: **15**
- entropy: **3.875 bits**
- unique escrow commitment hashes: **15**

## Frozen grant barriers

| Grant | Local barrier | With escrow | Released descriptor |
|---|---:|---:|---|
| GLOBAL → ROUTE | 0.25 bits | 0 | P2 |
| ROUTE → GLOBAL | 0.25 bits | 0 | residue |
| INTERFACE → GLOBAL | 2.375 bits | 0 | residue |
| DOWNSTREAM → ROUTE | 0.5471804688852168 bits | 0 | P2 |

Every released descriptor answers the newly authorized query exactly.

The selected release has zero excess leakage relative to the target role's authorized answer, while returning the full escrow action over-retains **0.25 bits** for GLOBAL and ROUTE targets.

## Escrow degradation controls

```text
H(P2 | H3 escrow)      = 0.5471804688852168 bits
H(P2 | residue escrow) = 0.25 bits
H(G  | P2 escrow)      = 0.25 bits
```

So reauthorization capability depends on what the higher-authority store actually retained.

## Receipt control

Grant receipts commit only to the released descriptor and public grant metadata. They add no information beyond the release.

A negative-control commitment to the 15-class escrow action state has 15/15 unique hashes in the tiny enumerable domain and restores unauthorized distinctions by exhaustive lookup.

This is not a SHA-256 inversion result.

## Interpretation

```text
forgotten locally != unrecoverable under later authorized escalation
```

provided a separately governed higher-authority source retained the needed distinction.

The handoff should release only the newly authorized causal residue rather than restore full-capability memory by default.
