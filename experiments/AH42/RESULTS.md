# AH42 v0.1.0 Qualification Results

## Verdict

**PASS_AH42_QUALIFIED**

- Frozen acceptance checks: **44/44**
- Unit tests: **16/16 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Scenario comparison

| Scenario | Certification | Actual root domains | VERIFY threshold | DECLASSIFY threshold | Advertise independence? |
|---|---|---:|---:|---:|---|
| S1_CERTIFIED_INDEPENDENT | CERTIFIED_INDEPENDENT | 3 | 2 | 3 | True |
| S2_SHARED_AB_OBSERVED | SHARED_CONTROL_OBSERVED | 2 | 1 | 2 | False |
| S3_INDEPENDENT_BUT_UNVERIFIED | INDEPENDENCE_UNVERIFIED | 3 | 2 | 3 | False |
| S4_HIDDEN_SHARED_UNVERIFIED | INDEPENDENCE_UNVERIFIED | 2 | 1 | 2 | False |

## Main findings

- Three logical seats and three named principals are present in every scenario.
- Only complete, distinct observed roots produce `CERTIFIED_INDEPENDENT`.
- Observed A/B root sharing produces `SHARED_CONTROL_OBSERVED` and overrides the declared separation.
- Incomplete root evidence produces `INDEPENDENCE_UNVERIFIED`, even when the hidden ground truth is actually independent.
- Hidden shared control with incomplete evidence is **not falsely certified**.
- Shared A/B control changes the actual root-domain thresholds from verification `2 -> 1` and strict declassification `3 -> 2`.

## Evidence progression

`INDEPENDENCE_UNVERIFIED -> INDEPENDENCE_UNVERIFIED -> SHARED_CONTROL_OBSERVED`

The shared-control ground truth never passes through a fabricated independent state as evidence accumulates.

## Main result

`logical seat count != named-principal count != verified independent control-domain count`

`different account names != independent authority domains`

`missing independence evidence should produce refusal, not optimistic certification`

AH42 is a finite graph/evidence/certification result, not a real organizational, credential, HSM, or hardware-independence theorem.
