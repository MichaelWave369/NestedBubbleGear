# NBG-T7 Candidate — External Evidence Adapters

NBG-T6 exposes the local governed review model through the site.

NBG-T7 should add optional external evidence adapters without allowing remote retrieval to contaminate the immutable source-map layer.

Candidate scope:

1. adapter contract for external source retrieval;
2. retrieved source stored as a new evidence object, never as source-map truth;
3. exact URL / document locator / retrieval time / content digest;
4. explicit source-independence group;
5. reviewer acceptance step before a retrieved item changes review status;
6. retrieval failure and ambiguity states;
7. source-version drift detection;
8. contradiction-preserving evidence bundles;
9. offline replay from captured evidence receipts;
10. no-network mode that still reproduces the frozen review ledger.

A later rung may ingest a larger real historical dataset only after these adapter receipts are qualified.
