# NBG-T7 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT7**

- frozen invariant checks: **18/18 PASS**
- unit tests: **19/19 PASS**
- replay exact: **True**
- canonical input ordering: **True**
- offline receipt replay: **True**
- receipt tamper detection: **True**
- source-version drift detection: **True**

## Frozen witness

```text
k4 -> ALLEGED
k5 -> ALLEGED
k6 -> CORROBORATED
k7 -> CORROBORATED
k8 -> CORROBORATED
k9 -> DISPUTED
```

Interpretation of the synthetic witness:

- at k5, support has been captured but not accepted;
- at k6, the reviewer explicitly accepts the supporting capture;
- at k7, the same source locator returns changed bytes and drift is recorded;
- that changed version is not silently substituted;
- at k8, an independent opposing source is captured but still not applied;
- at k9, the opposing capture is explicitly accepted and the derived result becomes `DISPUTED`;
- the source-map status remains `ALLEGED` throughout.

## Frozen file hashes

```text
SPEC.md             01efbd01b971e0c092ca5d8bfa778159908c9c2e5fd78ec732d306b26885056a
src/nbgt7.py        e9b32539b476a7cc36ea5f22a346379e777fea4fb013918a584bc8e2a719a719
tests/test_nbgt7.py 0de3acec3f31c724516371383958eb493bba5d6ad00306a9b8535b3b4e67b8f5
```

## Generated artifact hashes

```text
result.json           ebc8eed0a831b0b014983e2b81859175778cce122ccb20deef41c0c88a437d0b
base_claim.json       1c74c68656129dcf63fa4dacd11a4ddaf88adc5d6824c43995d62e5ea187dab6
capture_receipts.json 7c8215a42c7a1d48e0dd2d23962414d650e339006dc0764db6362ad034587fe5
review_decisions.json a8d1802a9c0cc53ae605f5385922623db2ea39dcf7d4a2ff40c2523d6b4e939e
drift_report.json      cc7e87d601176e6d24090846c7834b0d7eb9860198da657815cb3b111013610c
```

## Claim boundary

All source material in the harness is synthetic. This qualification demonstrates evidence-capture and review semantics only; it is not evidence for or against any real historical claim.
