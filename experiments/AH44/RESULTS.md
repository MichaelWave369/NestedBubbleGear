# AH44 v0.1.0 Qualification Results

## Verdict

**PASS_AH44_QUALIFIED**

- Frozen acceptance checks: **35/35**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **true**
- Replay exact: **true**

## Event-control comparison

| Control | False-advertisement epochs | Unnecessary-refusal epochs | Revocation latency |
|---|---:|---:|---:|
| TTL_ONLY | 1 | 0 | 1 |
| TRUSTED_IMMEDIATE | 0 | 0 | 0 |
| TRUSTED_DELAYED_1 | 1 | 0 | 1 |
| MISSING_EVENT | 1 | 0 | 1 |
| FALSE_POSITIVE_TRUSTED | 0 | 2 | n/a |
| UNTRUSTED_IMMEDIATE | 1 | 0 | 1 |

## Main witnesses

- `TRUSTED_IMMEDIATE`: at the same epoch as hidden A+B fusion, certification changes to `INDEPENDENCE_REVOKED_PENDING_REVALIDATION`; the old independence claim is no longer advertised, but shared control is not yet claimed.
- `TRUSTED_DELAYED_1`: one epoch of false advertisement remains before the trusted event arrives.
- `MISSING_EVENT`: falls back to TTL-only expiry and retains one false-advertisement epoch.
- `FALSE_POSITIVE_TRUSTED`: conservatively revokes independence for two epochs even though actual topology remains independent; revalidation restores certification.
- `UNTRUSTED_IMMEDIATE`: event is refused and the system falls back to the certificate TTL.

## Arc closure

`TEMPORAL_CERTIFICATION_ARC_COMPLETE_MOVE_TO_META_QUALIFICATION`

## Main result

`certificate freshness != continuous change detection`

`trusted event-driven revocation can reduce the hidden-change window without pretending to know the new topology`

`event provenance is part of revocation authority`

AH44 closes the temporal-certification arc. The next phase is meta-qualification and independent reproduction, not AH45.
