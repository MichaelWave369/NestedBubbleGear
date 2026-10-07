# PhiPie Physical-Memory Ingress v0.1

Status: **experimental / governed import boundary**

This module is the NBG-side counterpart to PhiPie's
`phipie-nbg-memory-bridge/v0.1`.

It accepts only the narrow physical-health episode memory shape that PhiPie
currently emits and routes it into NBG's existing epistemic-memory semantics
without promoting it into factual or action-authorizing memory.

## Accepted contract

The importer currently accepts only memories that satisfy all of these
conditions:

- `schemaVersion = NBG_EPISTEMIC_1`;
- memory ID begins with `phipie:host-health:`;
- epistemic origin is exactly `INFERRED`;
- authority is exactly:
  - `retainable = true`;
  - `reasoningUsable = true`;
  - `actionAuthorized = false`;
- content kind is `PHIPIE_HOST_HEALTH_EPISODE`;
- producer system is `PhiPie`;
- bridge contract is `phipie-nbg-memory-bridge/v0.1`;
- the producer pins the expected NBG schema source and blob SHA;
- the episode remains `suggested_memory_role = evidence`;
- `authority_effect = none`;
- semantic boundaries continue to state:
  - episode is not automatically a fault;
  - stable is not automatically safe;
  - no action authority is granted;
- at least one qualifying PhiPie episode-journal observation evidence object is
  present with a SHA-256-shaped journal record hash;
- the complete NBG record fingerprint validates under the existing epistemic
  provenance implementation.

Anything outside that narrow compatibility envelope is refused rather than
silently coerced.

## Routing

A valid PhiPie episode remains:

```text
origin        = INFERRED
logicalRegion = DERIVED_MEMORY
factualStatus = UNVERIFIED_INFERENCE
```

It may therefore be retained and used for reasoning, similarity search,
explanation, and later evidence-bearing derivation.

It is not returned as factual observed/verified memory merely because its
underlying source telemetry was observed.

That distinction matters:

```text
observed telemetry
    !=
observed episode interpretation
```

The episode boundary, drift label, peak class, and recovery boundary are derived
objects.

## Import status

The in-memory ingress store returns explicit outcomes:

```text
IMPORTED
DUPLICATE
CONFLICT
REFUSED
```

An identical memory ID + fingerprint is idempotent and returns `DUPLICATE`.

The same memory ID with a different fingerprint returns `CONFLICT`; NBG does
not use last-write-wins for competing physical-history records.

## Fail-closed cases

The importer refuses, among other things:

- invalid NBG record fingerprints;
- origin promotion from `INFERRED` to `OBSERVED`;
- action-authorized memories;
- unknown PhiPie bridge revisions;
- unexpected NBG schema pins;
- missing PhiPie journal evidence;
- semantic claims that stable means safe;
- semantic claims that an episode is automatically a hardware fault.

## Current boundary

This rung imports and validates the memory object. It does not yet implement:

- episode similarity;
- nearest-history retrieval;
- maintenance recommendations;
- causal attribution;
- automatic promotion to `OBSERVED` or `VERIFIED`;
- any physical action.

Those belong to later, separately tested layers.

## Core invariant

```text
physical memory can inform reasoning
physical memory cannot authorize action
```

This extends NBG's existing provenance rule:

```text
MEMORY != FACT
```

with the physical-host boundary:

```text
PHYSICAL HISTORY != PHYSICAL AUTHORITY
```
