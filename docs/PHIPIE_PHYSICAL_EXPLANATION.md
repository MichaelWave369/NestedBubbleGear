# PhiPie Physical Recall Explanation v0.1

Status: **experimental / advisory / evidence-linked / non-causal**

This rung explains why one governed PhiPie physical episode matched another.

It consumes only memories that already pass the PhiPie physical-memory ingress
and comparisons produced by the physical episode recall layer.

## Goal

Turn a similarity score into an inspectable explanation without turning
similarity into diagnosis, causation, safety judgment, maintenance prescription,
or action authority.

For each recalled episode, the explanation can identify:

- shared changed signals;
- shared throttling flags;
- differences in changed signals and flags;
- peak-classification relationship;
- close-reason relationship;
- episode-duration relationship;
- what the prior episode recorded as its peak, close reason, and duration;
- the exact query/candidate record fingerprints;
- the supporting evidence IDs carried by each memory.

## Evidence linkage

Every explanation carries both source memory fingerprints and evidence IDs.

The explanation therefore answers two different questions:

```text
Why was this episode ranked as similar?
Which retained evidence records support the compared memories?
```

Those are kept separate from:

```text
What caused the current condition?
What should the machine do?
```

v0.1 does not answer either of those stronger questions.

## Fixed boundaries

Every explanation returns:

```text
causalClaim = false
diagnosticConclusion = false
maintenanceRecommendation = false
actionAuthorized = false
explanationMode = EVIDENCE_LINKED_STRUCTURAL_COMPARISON
```

No high similarity score can change those values.

## Prior outcomes

The explainer may report that a recalled episode, for example, reached
`notable` and later closed with `stable_recovery`.

That is a description of the retained episode record, not a prediction that the
current episode will behave the same way and not a recommendation to repeat any
past intervention.

## Determinism

The explanation is template-based and deterministic.

It does not use an LLM to invent a narrative between stored facts. This keeps
the first rung auditable and gives a later PhiBot a clean evidence object to
summarize in natural language while preserving the underlying boundaries.

## Non-claims

```text
shared signals != shared cause
same close reason != same mechanism
past recovery != predicted recovery
evidence link != verified diagnosis
explanation != maintenance prescription
explanation != action authority
```
