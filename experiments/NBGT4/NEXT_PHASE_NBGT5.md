# NBG-T5 Candidate — Evidence-Linked Review and Temporal Keyholes

NBG-T4 proves that hostile dense ingest can preserve ambiguity, provenance, typed relations, source/analyst separation, and machine-readable rejection buckets.

NBG-T5 should turn that audit trail into an interactive evidence-review layer.

Candidate scope:

1. every accepted/disputed claim can open its provenance bundle;
2. every ambiguous record can be resolved only through an explicit reviewer action;
3. reviewer edits create new ledger events rather than overwriting ingest history;
4. source-map claims and externally verified evidence remain distinct layers;
5. temporal Keyholes can render what was knowable at a chosen knowledge cutoff;
6. filters can show only `OBSERVED`, `CORROBORATED`, `DISPUTED`, `ALLEGED`, or `UNKNOWN` records;
7. graph views can toggle relation types without changing the underlying ledger;
8. analyst hypotheses can be enabled/disabled as a separate overlay;
9. source independence remains explicit and inspectable;
10. exports preserve the exact audit/provenance chain.

A later rung can add optional external-source adapters for fact-checking selected claims. That verification layer should remain separate from source-map ingest so the original artifact is never mistaken for its own evidence.
