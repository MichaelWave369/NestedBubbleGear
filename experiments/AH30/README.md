# NBG-AH30 v0.1.0 — Derivation Closure and Authority-Safe Release Synthesis

AH29 showed that `Q_MULTI` can be denied at the interface while remaining exactly reconstructible from the three authorized single-horizon releases.

AH30 makes deterministic derivation part of the authority model:

```text
effective authority = derivation closure(direct authority)
```

Frozen derivation rules:

- `Q_MULTI -> Q_LIFETIME + Q_RECENT + Q_ADAPTIVE`
- `Q_LIFETIME + Q_RECENT + Q_ADAPTIVE -> Q_MULTI`

For `TRI_HORIZON_ANALYST`, direct authority excludes `Q_MULTI` but effective authority contains it.

A constrained hardening problem then requires lifetime + recent evidence to remain available while making `Q_MULTI` non-derivable. The unique minimum solution withholds `Q_ADAPTIVE` only.

This is a finite derivation/authority toy model, not a cryptographic secrecy or production IAM proof.
