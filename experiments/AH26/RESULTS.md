# AH26 v0.1.0 Qualification Results

## Verdict

**PASS_AH26_QUALIFIED**

- Frozen acceptance checks: **24/24**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Sequential batches: **6**

## Raw evidence sequence

```text
INSUFFICIENT_EVIDENCE
-> INDEPENDENCE_COMPATIBLE
-> COMMON_MODE_EVIDENCE
-> COMMON_MODE_EVIDENCE
-> INDEPENDENCE_COMPATIBLE
-> INDEPENDENCE_COMPATIBLE
```

## Governed state sequence

```text
NO_ALERT
-> NO_ALERT
-> PENDING_ESCALATION
-> ACTIVE_ALERT
-> ACTIVE_PENDING_CLEAR
-> CLEARED_AFTER_PERSISTENCE
```

The persistence rule delays both escalation and clearing by one confirming batch relative to a naive raw-status mirror.

At B4, the marginal-only independence assumption remains **0.84816** while the observed joint trace gives **0.769090909091**, an overstatement of **0.079069090909**.

Supported operational statements:

```text
evidence state != governance transition
persistence can prevent one-batch alert flapping
```

Claim boundary: AH26 is a deterministic sequential-evidence toy model, not a universal repeated-testing procedure or production alerting policy.
