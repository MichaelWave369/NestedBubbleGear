# NBG-T6 Candidate — Temporal Keyhole Explorer UI

NBG-T5 freezes the headless semantics for governed historical review.

NBG-T6 should expose those semantics in the GitHub Pages research site without weakening the ledger rules.

Candidate UI:

1. knowledge-cutoff slider;
2. evidence-status toggles;
3. relation-type toggles;
4. analyst-hypothesis overlay switch;
5. claim cards with separate source status and review status;
6. provenance drawer showing immutable source record plus visible review events;
7. ambiguity queue requiring explicit reviewer actions;
8. ledger-head / export-hash display;
9. side-by-side comparison of two Temporal Keyholes;
10. export of the selected view plus its full provenance chain.

Acceptance should verify that UI controls are pure projections: changing filters or overlays must never mutate the underlying frozen ledger.

External fact-check/source adapters should remain a later, separate rung so remote evidence retrieval is not confused with local source-map ingest.
