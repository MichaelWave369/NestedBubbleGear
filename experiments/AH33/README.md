# NBG-AH33 v0.1.0 — Task Richness versus Coalition Privacy Frontier

AH32 showed that task-sufficient coarsening can preserve frozen actor utility while preventing exact grand-coalition reconstruction of `Q_MULTI`.

AH33 varies how rich the authorized task itself is.

A frozen negative-dependence control expands the evidence alphabet so three task levels are genuinely distinct:

1. `COMMON_ONLY`
2. `TRIAGE`
3. `FULL_STATUS`

Five direct grants independently choose one of those three release modes, producing:

\[
3^5=243
\]

release designs.

For each global task profile, AH33 filters task-sufficient designs and measures grand-coalition residual entropy about the full multi-horizon target.

Main frontier:

| Task profile | Task information | Maximum residual privacy | Coalition-safe feasible? |
|---|---:|---:|---|
| COMMON_ONLY | 1.9609640474436811 bits | 1.160964047443681 bits | yes |
| TRIAGE | 2.721928094887362 bits | 0.4 bits | yes |
| FULL_STATUS | 3.1219280948873624 bits | 0 bits | no |

This is a finite information-partition toy model, not a general privacy-utility theorem.
