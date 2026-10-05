# NBG-T10 v0.1.0 — Trust Policies + Conflict Resolution Receipts

NBG-T10 takes the disagreement preserved by NBG-T9 and makes conflict handling explicit, inspectable, and replayable.

The central rule:

\`\`\`text
policy != truth
resolution != history rewrite
\`\`\`

Reviewer roles and authority are registered explicitly. Trust policies are hashed data objects with named roles, quorum requirements, thresholds, weighting mode, and effective-time windows.

The same reviewer disagreement can therefore be viewed under multiple governance rules without changing the historical decisions.

## Frozen side-by-side witness

\`\`\`text
input:
  BOB   ACCEPT
  CAROL REJECT

POLICY_WEIGHTED_AUTHORITY -> REJECTED
POLICY_UNANIMOUS          -> ABSTAIN_CONFLICT
POLICY_RESEARCHER_QUORUM  -> INSUFFICIENT_AUTHORITY
\`\`\`

Each outcome gets a separate hashed conflict-resolution receipt containing the exact policy identity and input decision hashes.

## Qualification target

- **24/24 invariant checks PASS**
- **27/27 unit tests PASS**
- stale/tampered policy controls PASS
- historical decisions immutable
- receipt replay exact
- deterministic resolution
