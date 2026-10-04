# NBG-AH43 v0.1.0 — Independence Evidence Decay, Revalidation, and Certificate Expiry

AH42 made independence an evidence-bearing claim.

AH43 makes that evidence **temporal**.

A frozen independence certificate has a freshness TTL of **2 epochs**. Two timelines are compared:

1. `STABLE_INDEPENDENCE` — the actual three-root topology remains independent;
2. `HIDDEN_FUSION_DURING_FRESH_WINDOW` — A and B silently move under one root at epoch 2, before the old certificate expires.

Main results:

- a fresh certificate may be relied on only inside its frozen freshness policy;
- once age exceeds the TTL, the system emits `CERTIFICATE_STALE` and stops advertising independent quorum thresholds;
- revalidation can restore `CERTIFIED_FRESH` when independence still holds;
- revalidation can instead discover `SHARED_CONTROL_OBSERVED` and downgrade the effective root thresholds;
- a certificate can remain policy-fresh for a short interval even after hidden reality has changed.

Therefore:

\[
\text{independence certified once}
\neq
\text{independence certified forever}
\]

and also:

\[
\text{fresh certificate}
\neq
\text{guarantee that topology did not change between checks}.
\]

AH43 is a finite temporal-certification toy model, not a real PKI, attestation, identity, HSM, or continuous-monitoring theorem.