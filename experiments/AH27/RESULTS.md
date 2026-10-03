# AH27 v0.1.0 Qualification Results

## Verdict

**PASS_AH27_QUALIFIED**

- Frozen acceptance checks: **25/25**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Primary horizon comparison

Lifetime:

```text
INDEPENDENCE_COMPATIBLE
INSUFFICIENT_EVIDENCE
INSUFFICIENT_EVIDENCE
INSUFFICIENT_EVIDENCE
INSUFFICIENT_EVIDENCE
```

Recent two-batch window:

```text
INDEPENDENCE_COMPATIBLE
COMMON_MODE_EVIDENCE
COMMON_MODE_EVIDENCE
COMMON_MODE_EVIDENCE
INDEPENDENCE_COMPATIBLE
```

Discounted memory, lambda=0.1:

```text
INDEPENDENCE_COMPATIBLE
COMMON_MODE_EVIDENCE
COMMON_MODE_EVIDENCE
INSUFFICIENT_EVIDENCE
INDEPENDENCE_COMPATIBLE
```

## Same-lifetime / different-recent witness

```text
H_A = [C,C,I,I]
H_B = [I,I,C,C]
```

Both finish with the exact same lifetime table:

```text
[64258, 19342, 19342, 7058]
```

and the same lifetime status:

```text
INSUFFICIENT_EVIDENCE
```

But:

```text
H_A recent2    = INDEPENDENCE_COMPATIBLE
H_B recent2    = COMMON_MODE_EVIDENCE
H_A discounted = INDEPENDENCE_COMPATIBLE
H_B discounted = COMMON_MODE_EVIDENCE
```

## Main result

```text
same lifetime aggregate != same recent-hazard state
evidence memory is horizon-relative
```

Result SHA-256:

`ae6485e7909c150900e684c48d58748cf6d76fafb9ab8095378c4d30a4d2d3b0`

Claim boundary: AH27 does not establish an optimal window, decay factor, field horizon, or universal change-point detector.
