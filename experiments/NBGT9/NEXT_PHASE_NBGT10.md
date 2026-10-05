# NBG-T10 Candidate — Trust Policies + Conflict Resolution Receipts

NBG-T9 preserves imported evidence and reviewer disagreement without silently collapsing either.

NBG-T10 should qualify explicit trust-policy and conflict-resolution semantics.

Candidate scope:

1. explicit reviewer-role registry;
2. trust policy as data rather than code branches;
3. policy-scoped reviewer weights or quorum rules;
4. conflict states preserved until a named policy is applied;
5. resolution receipt containing policy ID, inputs, outcome, and hash;
6. policy changes never rewrite historical review decisions;
7. side-by-side outcomes under multiple admissible policies;
8. abstain / insufficient-authority outcomes;
9. malicious or stale policy input controls;
10. deterministic replay of conflict resolution from portable T9 bundles.

No policy should be described as objective truth; it is an explicit governance rule over preserved evidence and reviewer decisions.
