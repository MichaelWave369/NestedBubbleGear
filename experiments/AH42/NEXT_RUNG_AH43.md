# AH43 Candidate — Independence Evidence Decay, Revalidation, and Certificate Expiry

AH42 makes independence an evidence-bearing claim and refuses optimistic certification when control-domain evidence is missing.

AH43 should make that certification temporal.

Candidate sequence:

1. certify three distinct control domains at time \(t_0\);
2. advance through evidence-age epochs;
3. expire one or more independence attestations;
4. refuse to continue advertising the old independent quorum once freshness bounds are crossed;
5. revalidate and restore certification;
6. negative control: discover shared control during revalidation and downgrade to `SHARED_CONTROL_OBSERVED`.

Core questions:

- Does certification have a freshness horizon?
- Can stale independence evidence silently outlive the control relation it was meant to justify?
- Should a Reality Ledger distinguish `CERTIFIED`, `STALE`, `REVOKED`, and `CONTRADICTED`?

Core principle:

\[
\text{independence certified once}
\neq
\text{independence certified forever}.
\]
