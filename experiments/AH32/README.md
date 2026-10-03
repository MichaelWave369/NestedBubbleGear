# NBG-AH32 v0.1.0 — Coalition-Safe Release Design and Task-Sufficient Coarsening

AH31 proved an impossibility for raw horizon releases under unrestricted pooling.

AH32 changes the release representation instead of deleting a horizon.

Each of the five frozen AH31 grants can expose either:

- `RAW`: exact AH28 evidence status;
- `RISK`: only `COMMON` versus `NOT_COMMON`.

The actors' frozen tasks require only common-mode detection at their authorized horizons.

Exhaustive synthesis across all 32 release designs finds:

- all 32 preserve the declared tasks exactly;
- exactly 8/32 prevent exact grand-coalition reconstruction of `Q_MULTI`;
- every safe design coarsens both lifetime-status carriers;
- the unique minimum safe design changes only:
  - `HISTORIAN:Q_LIFETIME`
  - `AUDITOR:Q_LIFETIME`.

The selected design restores 0.2857142857142857 bits of residual uncertainty while keeping zero task error.

This is a finite information-release toy model, not a cryptographic secrecy or differential-privacy result.
