# NBG-T4 Candidate — Hostile Dense Timeline Ingest

NBG-T1 froze temporal lineage and bitemporal replay.

NBG-T2 froze typed relation semantics.

NBG-T3 froze contradictory-source reconciliation and explicit independence accounting.

NBG-T4 should be the first **hostile dense-ingest** rung.

The target is not to certify a real-world timeline as true. The target is to ingest a deliberately messy graph-like source and prove that the pipeline refuses to erase uncertainty.

Candidate invariants:

1. every imported arrow becomes a typed claim, never a generic causal edge;
2. every imported claim receives provenance linking back to its exact source location;
3. unreadable or ambiguous labels become `UNKNOWN`, not guessed text;
4. unsupported relation types are refused rather than coerced;
5. source duplicates do not create independent corroboration;
6. contradictions remain inspectable;
7. temporal order does not imply influence or causation;
8. a claim with no source support remains `ALLEGED`/`UNKNOWN` according to the frozen ingest policy;
9. graph density does not change evidence semantics;
10. ingest order does not change canonical output;
11. observed ingest and analyst-added hypotheses remain separate;
12. a machine-readable audit report lists every rejected, ambiguous, disputed, and accepted record.

The conspiracy-style timeline map that motivated NBG-T can serve as a hostile fixture only if its copyright/provenance handling is clean. If the image itself cannot be redistributed, use a small derived synthetic fixture that reproduces its failure modes instead of copying the work wholesale.