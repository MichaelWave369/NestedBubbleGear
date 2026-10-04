# NBG-T1 Frozen Specification — Temporal Lineage and Bitemporal Provenance

## 1. Goal

Extend Nested Bubble/Gear with a minimal temporal model that can represent:

- time-indexed world state;
- distinct **valid time** (when an event belongs in the modeled world) and **known time** (when evidence enters the ledger);
- explicit evidence status and relation type;
- hidden lineage that may collapse under a coarse Keyhole;
- admissible future probes that can reveal lineage residue;
- deterministic counterfactual replay without confusing the counterfactual with observed history.

NBG-T1 is a finite synthetic qualification experiment. It is not a historical claim engine and does not establish causation in real-world datasets.

## 2. Event schema

Every event contains:

```text
event_id
valid_time
known_time
kind
payload
provenance
```

Historical-evidence events additionally contain:

```text
evidence_status
sources
```

with evidence status drawn from:

```text
OBSERVED
CORROBORATED
INFERRED
DISPUTED
ALLEGED
REFUTED
UNKNOWN
```

`known_time >= valid_time` is required in this frozen toy model.

## 3. Bitemporal semantics

A query at `(world_cutoff, knowledge_cutoff)` may use only events satisfying:

```text
valid_time <= world_cutoff
known_time <= knowledge_cutoff
```

Late evidence may change a later reconstruction of the past, but it must not mutate the bytes of an earlier knowledge-cutoff replay.

## 4. Keyholes and lineage residue

The coarse Keyhole exposes only the macro state.

Two histories qualify as a lineage-residue witness when:

1. their coarse projections are exactly equal at the witness cutoff;
2. their full latent states or lineage digests differ;
3. the same admissible future probe produces different observations.

This demonstrates temporal hidden residue in the synthetic model. It does not prove that any real historical system has such residue.

## 5. Claims are evidence-bearing, not magic causal edges

`ASSERT_CLAIM` records a typed relation:

```text
subject
predicate
object
evidence_status
sources
```

The claim layer is provenance-bearing metadata. Merely asserting a relation does not make it a dynamical cause.

## 6. Counterfactual replay

Counterfactuals are produced only by explicit event exclusion.

Every counterfactual receipt must include:

```text
mode = COUNTERFACTUAL
excluded_event_ids
```

Observed replay uses:

```text
mode = OBSERVED
```

Counterfactual outputs must never be silently merged into the observed ledger.

## 7. Frozen witness

History A and History B both expose:

```text
macro.status = READY
```

at the witness cutoff.

Their latent route memories differ:

```text
A -> NORTH
B -> SOUTH
```

A later `PROBE_LATENT(route)` must reveal the difference.

History A also contains a claim whose valid time is earlier than the time at which the claim becomes known. The claim must be absent from the earlier knowledge snapshot and present in the later reconstruction.

## 8. Qualification

Freeze before first execution:

- this specification;
- source;
- tests.

Qualification requires all frozen checks to pass:

- schema validation;
- coarse-equivalent witness;
- latent/lineage non-equivalence;
- future probe divergence;
- late-evidence visibility rule;
- no hindsight mutation of an earlier replay;
- deterministic counterfactual separation;
- replay-exact canonical output.

## 9. Claim firewall

NBG-T1 establishes only that the frozen synthetic implementation obeys the stated temporal and provenance invariants.

It does **not** establish that:

- a historical claim is true because it appears in a graph;
- temporal order alone implies causation;
- correlation implies influence;
- an asserted edge is equivalent to a documented mechanism;
- counterfactual output describes what actually would have happened.
