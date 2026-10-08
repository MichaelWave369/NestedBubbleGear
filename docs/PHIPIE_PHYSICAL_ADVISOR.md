# PhiPie Physical Experience Advisor v0.1

Status: **experimental / advisory / read-only**

This rung sits on top of the governed physical-memory ingress, structural recall,
and evidence-linked explanation layers.

Its job is narrow: turn repeated shared episode evidence into conservative
questions and read-only observation suggestions.

It does not diagnose hardware, declare safety, prescribe maintenance, or
authorize physical action.

## Input path

```text
PhiPie host-health memory
        |
        v
NBG governed ingress
        |
        v
same-host structural recall
        |
        v
evidence-linked explanation
        |
        v
Physical Experience Advisor
```

## Output shape

The advisor may emit prompts such as:

- Is temperature drift still present under a comparable observed workload?
- Is an under-voltage flag still present in current read-only telemetry?
- Did recalled episodes and the current episode share a similar load pattern?
- Is reduced available memory present near the same episode stage?

Each prompt includes:

- the signal or flag being discussed;
- how many recalled episodes support the prompt;
- mean structural-similarity score;
- supporting memory IDs;
- supporting evidence IDs;
- a read-only observation suggestion;
- an explicit boundary statement.

## Fixed boundary

Every advisory fixes:

```text
causalClaim = false
diagnosticConclusion = false
safetyConclusion = false
maintenanceRecommendation = false
physicalActionRecommendation = false
actionAuthorized = false
hardwareCommand = null
```

The only allowed output category in v0.1 is:

```text
READ_ONLY_OBSERVATION_QUESTIONS_AND_EVIDENCE_REVIEW_ONLY
```

## Same-host rule

Advisor recall is same-host only.

Cross-host recall may be useful for later comparative research, but v0.1 does
not use another machine's history to generate operator-facing prompts.

## Uncertainty

The advisor reports explicit uncertainty markers including:

- `INSUFFICIENT_SIMILAR_HISTORY`;
- `SPARSE_HISTORY_ONE_MATCH`;
- `NO_SHARED_SIGNAL_OR_FLAG_EVIDENCE`;
- `SOME_CANDIDATE_MEMORIES_REFUSED`.

It does not manufacture confidence from an empty or weak history.

## Why suggestions remain read-only

A historical similarity can help identify what evidence to inspect next. It
cannot prove what caused the current condition.

For example:

```text
prior episode:
  temperature drift + under-voltage flag

current episode:
  temperature drift + under-voltage flag
```

supports asking whether the under-voltage flag is still present.

It does not justify changing a power source, disabling a protection mechanism,
or issuing a hardware command.

## Non-claims

```text
question != diagnosis
observation suggestion != maintenance instruction
repeated pattern != root cause
historical recovery != predicted recovery
advisor != safety controller
advisor != actuator authority
```

This is the first rung where NBG turns physical memory into bounded operator
investigation support while preserving the full capability/authority firewall.
