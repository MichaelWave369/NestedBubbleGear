# NBG-T8 Candidate — Live Adapter Integration + Review Queue

NBG-T7 qualifies the adapter receipts and reviewer gate with synthetic sources.

NBG-T8 should connect the already-qualified contract to optional live adapters while preserving deterministic replay.

Candidate scope:

1. one or more allow-listed read-only adapter implementations;
2. retrieval performed only on explicit operator request;
3. captured bytes + SHA-256 + retrieval timestamp persisted before review;
4. network failure / auth failure / ambiguity receipts;
5. source-version drift surfaced in the Temporal Keyhole Explorer;
6. reviewer queue for ACCEPT / REJECT;
7. accepted support/opposition shown without rewriting source-map status;
8. cached offline replay with network disabled;
9. import/export of evidence bundles;
10. adapter-specific security and rate-limit boundaries.

Live adapters should remain optional. The frozen synthetic harness must continue to replay without network access.
