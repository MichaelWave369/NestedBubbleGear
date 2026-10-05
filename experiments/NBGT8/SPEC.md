# NBG-T8 Frozen Specification — Live Adapter Integration + Review Queue

## 1. Goal

NBG-T8 connects the qualified NBG-T7 capture contract to an operator-triggered read-only retrieval path and a governed review queue.

The governing rule remains:

```text
capture first
persist second
review third
derived state last
```

Retrieval itself is never acceptance.

## 2. Read-only live adapter

The optional HTTP adapter:

- runs only when explicitly invoked by the operator;
- supports only `http` and `https`;
- requires an explicit host allow-list;
- refuses literal private, loopback, link-local, and reserved IPs;
- uses a bounded timeout;
- enforces a maximum captured byte size;
- records the final locator after redirects;
- never runs during CI qualification.

The live helper is:

```text
python scripts/nbgt8_capture.py ...
```

## 3. Persist-before-review rule

A successful capture must be persisted as:

```text
<capture_id>.receipt.json
<content_sha256>.bin
```

before it may be reviewed.

The content bytes must match the receipt SHA-256 exactly.

## 4. Retrieval states

Frozen states remain:

```text
CAPTURED
AMBIGUOUS
FAILED
```

Non-captured items enter the review queue as `BLOCKED`.

## 5. Review queue

Every visible capture has a queue state:

```text
PENDING
ACCEPT
REJECT
BLOCKED
```

Only `CAPTURED` receipts may receive `ACCEPT` or `REJECT`.

Review decisions are separate hashed records.

## 6. Source firewall

The source-map claim remains immutable.

For the frozen witness:

```text
source_status = ALLEGED
```

at every cutoff.

Accepted support may change the derived review status to `CORROBORATED`. Accepted independent opposition may change it to `DISPUTED`.

## 7. Version drift

Same adapter + same logical locator + different content SHA-256 values produce:

```text
DRIFT_DETECTED
```

A drifted version remains a separate queue item and requires its own reviewer decision.

## 8. Browser review queue

The GitHub Pages Temporal section surfaces:

- capture status;
- evidence stance;
- explicit independence group;
- content digest;
- drift badge;
- queue state;
- session ACCEPT / REJECT controls;
- derived source/review status;
- JSON export of the current review proposal.

Browser decisions are session projections only. They do not mutate the frozen repository ledger.

## 9. Offline replay

Captured receipts + review decisions + base claim are sufficient to reproduce the frozen derived state without a network connection.

Tampered receipts or bundles must fail verification.

## 10. Frozen witness

```text
k4 -> ALLEGED
k5 -> ALLEGED       support captured, pending
k6 -> CORROBORATED  support accepted
k7 -> CORROBORATED  changed source version detected, still pending
k8 -> CORROBORATED  drift version rejected; opposition captured, pending
k9 -> DISPUTED      independent opposition accepted
```

## 11. Qualification

Requires:

- 18/18 Python invariant checks PASS;
- 20/20 Python unit tests PASS;
- browser review-queue acceptance PASS;
- Vite production build PASS;
- host allow-list enforcement;
- private-address refusal;
- exact receipt/content persistence;
- retrieval failure and ambiguity preservation;
- retrieval not equal to acceptance;
- source status immutable;
- drift surfaced;
- rejection explicit;
- contradiction preserved;
- offline replay exact;
- no hindsight;
- canonical ordering;
- replay exact.

## 12. Claim firewall

NBG-T8 does not use live historical sources in CI and does not certify any external claim.

The live adapter is an optional operator tool whose output must still pass the same capture, persistence, review, and provenance rules.
