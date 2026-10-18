# PHMP-2 Stage 2 finding ledger

Date: 2026-10-18. Origin: `SIMULATED`. Authority: `NONE`. No prior AH result is promoted or revised.

- **Hypothesis audited:** Native AH9/AH10 group-valued edge transport obeys local vertex-gauge covariance under `E(u→v) -> Q(u)^-1 E(u→v) Q(v)` (row-vector convention).
- **Observed in independently implemented finite calculations:** 72/72 AH9 and 96/96 AH10 exact assignments preserve basepoint-conjugated loops; correctly transported local reconstruction agrees with the direct outer edge path.
- **Negative controls:** Omit a destination frame factor on one bottom edge. All 60 nonidentity AH9 and 80 nonidentity AH10 constructed cases violate the expected transformed outer loop.
- **Evidence scope:** Exact, conventional group-valued discrete transport on specified finite matrices. A group connection interpretation is established mathematics, not a new NBG-specific prediction.
- **Unresolved:** Hash-verified AH4–AH8 operator-level maps, actual complex/unitary representation, observable phase memory advantages, and external physical validation.
- **Error discipline:** Any counterexample or failing held-out comparison must be preserved; do not retrofit old frozen signatures or change the Keyhole after seeing the test results.

Reproduce with `npm run test:phmp2-gauge`. Source and frozen originals are separate.
