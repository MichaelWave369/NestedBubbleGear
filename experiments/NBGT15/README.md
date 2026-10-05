# NBG-T15 v0.1.0 — Adaptive Keyhole Synthesis

NBG-T15 turns the observer into an explicit synthesis problem.

The question:

\`\`\`text
Given histories that are still indistinguishable,
what is the smallest admitted observer that separates them?
\`\`\`

T15 supports:

\`\`\`text
POLICY-only observation
OUTCOME-only observation
JOINT policy/outcome observation
\`\`\`

and two observer contracts:

\`\`\`text
STATIC
  choose the smallest fixed Keyhole family

ADAPTIVE
  choose the next Keyhole from the observations already seen
\`\`\`

## Refusal is part of the result

The full nine-history family contains the T14 pair that remains behaviorally identical across all 144 frozen Governance Keyholes.

T15 therefore returns:

\`\`\`text
REFUSE_UNSEPARABLE
\`\`\`

rather than inventing another distinction.

The restricted witness also demonstrates observer-language dependence:

\`\`\`text
I_DELAY_ACTIVATE_EMERGENCY_7
vs
I_REMOVE_SUPERSEDE_NORMAL1

POLICY  -> separable
OUTCOME -> unseparable
\`\`\`

## Cost boundary

The frozen resource proxy is:

\`\`\`text
observer_cost = known_cutoff + valid_time
\`\`\`

It is used only after minimizing Keyhole cardinality.

Cost is not epistemic value.

## Qualification target

- **42/42 invariant checks PASS**
- **48/48 unit tests PASS**
- browser observer synthesizer PASS
- production build PASS
- deterministic static and adaptive replay
