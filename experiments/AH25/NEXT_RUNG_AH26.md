# AH26 Candidate — Sequential Failure Auditing and Evidence Accumulation

AH25 classifies one frozen contingency table. AH26 should make the evidence temporal.

Candidate design:

1. reveal deterministic failure events in batches;
2. recompute the joint-failure audit after every batch;
3. track transitions among INSUFFICIENT_EVIDENCE, INDEPENDENCE_COMPATIBLE, COMMON_MODE_EVIDENCE, and DEPENDENCE_OTHER_DIRECTION;
4. require evidence persistence or hysteresis before escalating a governance warning;
5. test whether sparse early data can look independence-compatible before common-mode evidence accumulates.

Core question:

> When should a governed system change its redundancy belief as evidence arrives?

This should remain an evidence-tracking toy model, not a universal sequential-testing procedure.
