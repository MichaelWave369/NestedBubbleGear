# M2 v0.1.0 Qualification Results

## Verdict

**PASS_M2_QUALIFIED**

- Frozen qualification checks: **11/11**
- Unit tests: **10/10 PASS**
- Generated cases: **1500**
- Counterexamples: **0**
- Frozen hashes unchanged: **True**
- Replay exact across result, counterexample ledger, and case receipts: **True**

## Generated property suite

| Property | Passed | Total |
|---|---:|---:|
| P1_SUCCESS_FAILURE_DUALITY | 250 | 250 |
| P2_CONTROL_DOMAIN_FUSION | 250 | 250 |
| P3_INCOMPLETE_EVIDENCE_REFUSAL | 250 | 250 |
| P4_EVENT_REVOKE_NOT_CERTIFY | 250 | 250 |
| P5_COARSENING_DISTINGUISHABILITY | 250 | 250 |
| P6_REFINEMENT_ENTROPY | 250 | 250 |

## Counterexample ledger

`results/counterexamples.json` is empty for the frozen suite.

Every generated case has a deterministic case seed and receipt hash in `results/case_receipts.json`, so any future failure can be replayed exactly.

## Main result

`six structural claims survived 1500 deterministic generated finite universes with zero counterexamples`

This is stronger than hand-picked examples but weaker than formal proof.

## Next phase

M3 will mutate the governance/property machinery deliberately and require the qualification harness to kill the mutants.
