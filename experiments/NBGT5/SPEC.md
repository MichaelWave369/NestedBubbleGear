# NBG-T5 Frozen Specification — Evidence-Linked Review and Temporal Keyholes

## 1. Goal

NBG-T5 turns the NBG-T4 hostile-ingest audit into a governed review model.

The central rule is that **review changes the derived view, not the historical bytes**.

An ambiguity resolution or evidence update is appended as a new review-ledger event. Earlier source records remain intact and earlier knowledge-cutoff Keyholes remain replayable exactly.

## 2. Frozen layers

NBG-T5 keeps three layers distinct:

\`\`\`text
SOURCE_MAP
EXTERNAL_EVIDENCE
ANALYST_HYPOTHESIS
\`\`\`

A source-map claim may remain \`ALLEGED\` while later external evidence produces a derived \`CORROBORATED\` review status. The source layer is never silently rewritten.

## 3. Append-only review ledger

Frozen review event types:

\`\`\`text
RESOLVE_AMBIGUITY
ADD_EXTERNAL_EVIDENCE
\`\`\`

Every event contains:

\`\`\`text
event_id
event_type
target_record_id
known_time
reviewer_id
reason
payload
provenance
prev_hash
event_hash
\`\`\`

The review ledger is hash-chained from \`GENESIS\`.

## 4. Temporal Keyhole

A Temporal Keyhole is evaluated at a chosen \`knowledge_cutoff\`.

Only source records and review events known by that cutoff may affect the derived view.

Later review events must not mutate the byte-for-byte result of an earlier Keyhole.

## 5. Ambiguity resolution

An ambiguous source record begins with an explicit \`UNKNOWN\` field.

A reviewer may resolve it only through a \`RESOLVE_AMBIGUITY\` event. The base record remains unchanged.

## 6. External evidence

External evidence enters only through an \`ADD_EXTERNAL_EVIDENCE\` event.

The payload must include:

\`\`\`text
evidence_id
status
source_id
independence_group
locator
provenance
\`\`\`

Source independence remains explicit and inspectable.

## 7. Filters and overlays

Temporal Keyholes support:

- evidence-status filters;
- relation-type filters;
- analyst-hypothesis overlay on/off.

These controls alter only the derived view. They do not mutate source records or the review ledger.

## 8. Provenance bundles

Any record can produce a provenance bundle containing:

- the immutable base record;
- all visible review events targeting that record;
- base digest;
- ledger head for the selected cutoff;
- bundle hash.

## 9. Export

A governed export contains:

- immutable base records;
- visible review ledger;
- derived Temporal Keyhole view;
- base digest;
- ledger head;
- export hash.

## 10. Frozen qualification

Qualification requires:

- **18/18 invariant checks PASS**;
- **19/19 unit tests PASS**;
- append-only ambiguity resolution;
- no-hindsight Keyhole replay;
- source/review evidence-layer separation;
- status and relation filters;
- analyst overlay separation;
- explicit source independence;
- valid hash-chained review ledger;
- canonical event ordering;
- filters that do not mutate ledger state;
- provenance-preserving export;
- replay exact.

## 11. Claim firewall

NBG-T5 is a finite synthetic review experiment.

It does not certify the motivating historical map, declare external evidence authoritative merely because it exists, or treat reviewer actions as retroactive changes to what earlier observers could have known.
