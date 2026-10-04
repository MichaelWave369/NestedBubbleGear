# NBG-AH35 v0.1.1 — Upgrade Access Structures and Privacy-Critical Distinctions

AH34 showed that privacy collapse depends on which task distinctions are jointly released, not only total task richness.

AH35 treats task-refinement permissions themselves as an access structure.

Each of five grants has two prerequisite-aware refinement atoms:

- `:T` — COMMON_ONLY -> TRIAGE
- `:F` — TRIAGE -> FULL_STATUS

Across the 243 valid upgrade sets, AH35 finds 137 exact-reconstruction states, 10 minimal collapsing paths, an empty mandatory core, and 12 inclusion-minimal cuts.

The unique minimum cut is:

```text
{H_L:T, U_L:T}
```

Blocking both lifetime TRIAGE refinements prevents every frozen exact-reconstruction path while still permitting maximum task richness 6 with at least 0.4 bits of residual privacy.

Preregistration lineage is explicit: v0.1.0 failed 28/29 because the same 12 correct cuts were listed in a different tuple order than the deterministic enumerator. v0.1.1 changes only that ordering and version metadata.

This is a finite prerequisite/access-structure/cut-set toy model, not a production authorization or cryptographic privacy theorem.
