# AH43 v0.1.0 Qualification Results

## Verdict

**PASS_AH43_QUALIFIED**

- Frozen acceptance checks: **30/30**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen certificate TTL: **2 epochs**

## Stable independence timeline

| Event | Epoch | Certificate status | Advertise independence? | Actual VERIFY / DECLASSIFY |
|---|---:|---|---|---|
| S0 | 0 | CERTIFIED_FRESH | True | 2 / 3 |
| S1 | 1 | CERTIFIED_FRESH | True | 2 / 3 |
| S2 | 2 | CERTIFIED_FRESH | True | 2 / 3 |
| S3 | 3 | CERTIFICATE_STALE | False | 2 / 3 |
| S4 | 4 | CERTIFIED_FRESH | True | 2 / 3 |

## Hidden-fusion timeline

| Event | Epoch | Certificate status | Advertise? | Actual VERIFY / DECLASSIFY | Ground-truth relation |
|---|---:|---|---|---|---|
| F0 | 0 | CERTIFIED_FRESH | True | 2 / 3 | FRESH_CERTIFICATE_MATCHES_GROUND_TRUTH |
| F1 | 1 | CERTIFIED_FRESH | True | 2 / 3 | FRESH_CERTIFICATE_MATCHES_GROUND_TRUTH |
| F2 | 2 | CERTIFIED_FRESH | True | 1 / 2 | FRESH_CERTIFICATE_BUT_GROUND_TRUTH_CHANGED |
| F3 | 3 | CERTIFICATE_STALE | False | 1 / 2 | NO_FRESH_INDEPENDENCE_CLAIM |
| F4 | 4 | SHARED_CONTROL_OBSERVED | False | 1 / 2 | FRESH_SHARED_CONTROL_EVIDENCE |

## Frozen negative result

At `F2 / t2`, the old certificate is still policy-fresh at age 2 and still advertises independent thresholds `2 / 3`, but the hidden actual topology has already fused A+B and the true root-domain thresholds are `1 / 2`.

At `F3 / t3`, the certificate expires and the old independence advertisement is refused.

At `F4 / t4`, revalidation observes the shared root and changes state to `SHARED_CONTROL_OBSERVED`.

## TTL sensitivity control

| TTL | False-advertisement epochs after hidden fusion and before revalidation |
|---:|---:|
| 0 | 0 |
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |

## Main result

`independence certified once != independence certified forever`

`stale evidence should remove an independence advertisement until revalidated`

`fresh certificate != proof that control topology has not changed since observation`

AH43 is a finite temporal-certification/expiry/revalidation toy model, not continuous attestation or a real-world TTL recommendation.