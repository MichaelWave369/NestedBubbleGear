# NBG-T2 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT2**

- Frozen invariant checks: **12/12 PASS**
- Unit tests: **12/12 PASS**
- Replay exact: **True**
- Input/source ordering canonicalization: **True**
- Unsupported relation composition refusal: **True**

## Typed relation witness

The frozen graph keeps the following relation types distinct:

```text
OCCURRED_BEFORE
MEMBER_OF
FUNDED_BY
OPERATED_BY
DOCUMENTED_INTERACTION
INFERRED_INFLUENCE
ALLEGED_LINK
CONTRADICTS
SUPERSEDES
```

Chronology composes only through the one frozen rule:

```text
A OCCURRED_BEFORE B
B OCCURRED_BEFORE C
--------------------
A OCCURRED_BEFORE C
```

The result remains `OCCURRED_BEFORE`; it is never promoted to `INFERRED_INFLUENCE`.

## Allegation / evidence witness

The frozen synthetic graph contains an `ALLEGED_LINK` from `ORG_X` to `ORG_Y`.

At knowledge cutoff 2, the allegation exists with evidence state `ALLEGED`.

At knowledge cutoff 4, a later corroborating record exists with evidence state `CORROBORATED`, but the relation remains:

```text
ALLEGED_LINK
```

The evidence state can improve without silently rewriting the semantic relation into `DOCUMENTED_INTERACTION`.

## Contradiction witness

A separate `CONTRADICTS` assertion becomes known at time 3. Both the original allegation and the contradiction coexist with distinct provenance. Neither record deletes the other.

## Keyhole witness

The full late replay retains all qualified assertions. An explicit Keyhole projection retaining only:

```text
DOCUMENTED_INTERACTION
OCCURRED_BEFORE
```

produces a reduced view. Coarsening therefore requires an explicit projection step.

## Counterfactual witness

Removing `T03_ALLEGED_LINK` produces a separate receipt:

```text
mode = COUNTERFACTUAL
excluded_assertion_ids = ["T03_ALLEGED_LINK"]
```

The observed receipt remains unchanged.

## Frozen artifact hashes

```text
result.json     3ad39e959f68169b580addf4db1ec145eecf4a3ab76e20f8688a99c25bcf2ef0
assertions.json 3e5dbdf8e26f3f92d1e94286a419b269db30f8b5bdc70ee6214b3a37cc55bd95
```

## Claim boundary

NBG-T2 is a finite synthetic typed-graph experiment. It does not establish the truth of any real historical claim, infer causation from chronology, upgrade allegations through repetition, or certify that a counterfactual branch describes what actually would have happened.

## Next phase

NBG-T3 should test contradictory-source reconciliation without forced collapse, including source independence, duplicate-source detection, support/opposition ledgers, unresolved states, and provenance-preserving confidence updates.