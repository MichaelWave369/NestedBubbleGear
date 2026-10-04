# AH44 Candidate — Event-Driven Independence Revocation and Change Detection

AH43 shows that certificate expiry limits how long old evidence may be relied on, but a hidden topology change can still occur inside a policy-fresh window.

AH44 should compare **polling-only freshness** against **event-driven revocation**.

Candidate controls:

1. TTL-only certification;
2. trusted change event delivered immediately when root ownership changes;
3. delayed change event;
4. missing change event;
5. false positive change event.

Questions:

- How much does trusted event delivery reduce the false-advertisement window?
- What is the effect of event latency?
- Can the system revoke an independence advertisement immediately without yet knowing the new topology?
- Should the intermediate status be:
  `INDEPENDENCE_REVOKED_PENDING_REVALIDATION`?
- What happens when event provenance is untrusted?

Core distinction:

\[
\text{certificate freshness}
\neq
\text{continuous change detection}.
\]

This should be the final temporal-certification rung before the planned meta-qualification and independent-reproduction phase.