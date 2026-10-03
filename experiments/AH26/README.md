# NBG-AH26 v0.1.0 — Sequential Failure Auditing and Evidence Persistence

AH25 classified one completed failure table.

AH26 reveals evidence in deterministic batches and separates the raw cumulative evidence state from the governed alert state.

The raw classifier can change immediately. The governed alert requires persistence:

- two consecutive `COMMON_MODE_EVIDENCE` states to activate;
- two consecutive `INDEPENDENCE_COMPATIBLE` states to clear.

Frozen raw sequence:

```text
INSUFFICIENT_EVIDENCE
-> INDEPENDENCE_COMPATIBLE
-> COMMON_MODE_EVIDENCE
-> COMMON_MODE_EVIDENCE
-> INDEPENDENCE_COMPATIBLE
-> INDEPENDENCE_COMPATIBLE
```

Frozen governed sequence:

```text
NO_ALERT
-> NO_ALERT
-> PENDING_ESCALATION
-> ACTIVE_ALERT
-> ACTIVE_PENDING_CLEAR
-> CLEARED_AFTER_PERSISTENCE
```

This is a finite sequential-evidence toy model, not a universal sequential statistical test or production alert policy.
