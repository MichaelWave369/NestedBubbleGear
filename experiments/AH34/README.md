# NBG-AH34 v0.1.0 — Mixed Task Profiles and Authority-Aware Privacy Budgets

AH33 upgraded every grant to the same task-richness level.

AH34 allows each of the five frozen grants to request its own task richness:

- `COMMON_ONLY`
- `TRIAGE`
- `FULL_STATUS`

That yields **243 mixed task profiles**.

Main qualified results:

- **106/243** profiles retain positive residual privacy;
- **137/243** exactly reconstruct the frozen `Q_MULTI` target;
- no single grant upgrade from all-`COMMON_ONLY` collapses privacy;
- the minimum total richness score that collapses privacy is **3**, achieved by exactly two profiles;
- the maximum richness score that still retains positive privacy is **7**;
- under a frozen privacy floor of **0.4 bits**, 71 profiles are feasible and two distinct allocations tie for maximum richness.

AH34 shows that privacy cost depends on **which distinctions become jointly available**, not merely on the number of task upgrades.

This is a finite mixed-task information-partition toy model, not a production privacy-budget or access-control theorem.
