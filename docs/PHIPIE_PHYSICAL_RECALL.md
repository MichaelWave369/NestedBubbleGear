# PhiPie Physical Episode Recall v0.1

Status: **experimental / advisory / non-causal**

This rung adds deterministic similarity retrieval over the governed PhiPie
physical-memory records accepted by NBG.

It does not create a new epistemic origin, does not promote memory to fact, and
does not authorize action.

## Goal

Given one accepted PhiPie host-health episode memory, retrieve structurally
similar prior episodes while preserving the boundary:

```text
similar history != causal proof
```

## Feature channels

v0.1 compares five explicit episode features:

- changed-signal overlap;
- newly observed throttling-flag overlap;
- peak classification proximity;
- close-reason equality;
- episode-duration similarity in PhiPie sequence units.

The weighting is frozen in code for this rung:

```text
signals      0.40
flags        0.20
peak         0.15
close reason 0.10
duration     0.15
```

Unavailable channels are omitted from the denominator rather than being
silently treated as matches.

Signal and flag overlap use Jaccard similarity. Peak classification uses the
declared ordinal ladder `stable < watch < notable`. Duration compares the
ratio of the shorter episode length to the longer one.

The resulting score is a ranking convenience only.

## Default host scope

Recall is same-host only by default.

The query and candidate must have at least one comparable hashed host-identity
field and all comparable fields must match.

Cross-host comparison requires explicit `sameHostOnly: false`.

This prevents a structurally similar episode on another machine from being
quietly treated as the same device history.

## Retrieval boundary

Every query and candidate must already pass the PhiPie physical-memory ingress.

Invalid or tampered candidate memories are placed in the returned `refused`
set instead of entering ranking.

The result always carries:

```text
causalClaim = false
actionAuthorized = false
interpretation = STRUCTURAL_EPISODE_SIMILARITY_ONLY
```

No score, nearest neighbor, repetition count, or high similarity may change
those fields.

## Determinism

Ranking is deterministic:

1. descending similarity score;
2. lexical memory ID as the tie breaker.

Candidate input order therefore cannot change the result ordering.

The query memory is excluded from its own results by default.

## Current non-claims

```text
similar != same cause
nearest != diagnostic truth
repetition != verification
same host != same operating context
high score != maintenance prescription
recall != action authority
```

This rung deliberately stops before maintenance recommendation.

A later rung may use retrieved episodes to produce an explanation such as
"these prior episodes share temperature drift and undervoltage evidence," but
that explanation must remain evidence-linked and non-causal unless a separate
causal qualification supports stronger language.
