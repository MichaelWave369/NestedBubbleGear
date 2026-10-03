# AH32 Candidate — Coalition-Safe Release Design and Non-Composable Evidence

AH31 proves a finite impossibility under unrestricted pooling:

If lifetime, recent, and adaptive evidence are each released somewhere, and all holders may pool their releases, the grand coalition can derive `Q_MULTI`.

AH32 should relax the composability assumption rather than merely deleting one horizon.

Candidate directions:

1. replace one or more raw horizon states with task-sufficient coarsenings;
2. search for releases that preserve each actor's declared task while preventing coalition reconstruction of `Q_MULTI`;
3. compare direct utility loss against restored residual uncertainty;
4. introduce pairwise release-composition constraints or trusted mediation;
5. distinguish "cannot derive the denied target" from "cannot collude operationally."

A useful frozen problem would be:

> Can we find the coarsest task-sufficient per-role releases whose pooled descriptor still leaves positive entropy about `Q_MULTI`?

This would turn AH31's impossibility result into an information-design problem rather than a permission-bit problem.
