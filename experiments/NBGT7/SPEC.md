# NBG-T7 Frozen Specification — External Evidence Adapters

## 1. Goal

NBG-T7 qualifies an adapter boundary for bringing externally retrieved material into the temporal review system without letting retrieval itself become truth.

The governing rule is:

```text
retrieved != accepted
accepted != source-map rewrite
```

## 2. Capture receipt

Every retrieval attempt produces a receipt with:

```text
capture_id
adapter_id
provider
adapter_version
independence_group
locator
retrieved_at
retrieval_status
evidence_stance
content_sha256
content_length
network_used
receipt_hash
```

The content digest is SHA-256 over captured bytes.

## 3. Retrieval states

Frozen states:

```text
CAPTURED
AMBIGUOUS
FAILED
```

Only `CAPTURED` receipts may be accepted by a reviewer.

## 4. Reviewer gate

A captured receipt does not alter review status until an explicit reviewer decision references the capture.

The reviewer event contains target claim, known time, decision, reason, reviewer identity, and provenance.

## 5. Source-map firewall

The original source-map status remains immutable.

External evidence changes only the derived review status.

## 6. Source independence

Each adapter declares an explicit `independence_group`.

Different URLs or providers are not automatically treated as independent unless the frozen adapter metadata says so.

## 7. Version drift

Two successful captures from the same adapter + locator with different content SHA-256 values produce:

```text
DRIFT_DETECTED
```

A drifted newer version does not replace an already accepted older capture unless a reviewer separately accepts it.

## 8. Contradiction preservation

Accepted independent support and accepted independent opposition coexist as:

```text
DISPUTED
```

Opposition retrieval alone is not enough. The opposing capture must also pass the reviewer gate.

## 9. Offline replay

Captured receipts and review decisions are sufficient to reproduce the frozen derived status with no network access.

Receipt or bundle tampering must fail hash verification.

## 10. Frozen witness

```text
k4 -> ALLEGED
k5 -> ALLEGED       (support retrieved, not accepted)
k6 -> CORROBORATED  (support accepted)
k7 -> CORROBORATED  (new source version drift detected, not accepted)
k8 -> CORROBORATED  (opposition retrieved, not accepted)
k9 -> DISPUTED      (independent opposition accepted)
```

## 11. Qualification

Requires:

- 18/18 invariant checks PASS;
- 19/19 unit tests PASS;
- exact locator/time/content digest capture;
- explicit independence group;
- failure and ambiguity preservation;
- reviewer-gated status changes;
- immutable source status;
- source-version drift detection;
- contradiction preservation;
- no-hindsight snapshots;
- offline receipt replay;
- tamper detection;
- canonical ordering;
- replay exact.

## 12. Claim firewall

NBG-T7 is a finite synthetic adapter experiment.

It does not retrieve, verify, or certify any real historical claim. The synthetic support/opposition documents exist only to qualify adapter semantics.
