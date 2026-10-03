# AH32 v0.1.0 Qualification Results

## Verdict

**PASS_AH32_QUALIFIED**

- Frozen acceptance checks: **30/30**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Exhaustive release designs: **32**
- Coalition-safe task-exact designs: **8**

## Unique minimum coalition-safe design

- `HISTORIAN:Q_LIFETIME` -> **RISK**
- `OPERATOR:Q_RECENT` -> **RAW**
- `ADAPTIVE_CONTROLLER:Q_ADAPTIVE` -> **RAW**
- `AUDITOR:Q_LIFETIME` -> **RISK**
- `AUDITOR:Q_RECENT` -> **RAW**

Transformed grants: **2**

Grand-coalition residual entropy: **0.2857142857142857 bits**

Pooled descriptor classes: **5**

All frozen actor task errors remain zero.

## Frozen witness

Panels C and F produce the same pooled hardened release but different multi-horizon targets.

```text
Z_grand(C) = Z_grand(F)
M_state(C) != M_state(F)
```

Exactly 8/32 designs are safe in the frozen model, and a design is safe iff both lifetime-status carriers use the RISK coarsening.

## Information reduction

- lifetime raw-status entropy: **1.3787834934861753 bits**
- lifetime task-bit entropy: **0.863120568566631 bits**
- status detail removed per transformed lifetime release: **0.5156629249195444 bits**

## Main result

```text
task-sufficient release != raw state release
coalition safety can be restored by coarsening information without deleting the declared task capability
```

AH32 is a finite information-release design result, not a cryptographic, differential-privacy, or auxiliary-information guarantee.
