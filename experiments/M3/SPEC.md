# M3 Frozen Specification — Mutation Testing

## 1. Goal

Deliberately inject wrong implementations and verify that the qualification system detects them.

Freeze exactly 12 non-equivalent mutants.

Mutation score:

\[
score=\frac{killed}{total}.
\]

Qualification target:

\[
\boxed{12/12=1.0}.
\]

## 2. Mutation policy

A mutant is valid for M3 only if:

1. it changes observable behavior on at least one finite input;
2. the intended invariant is explicit;
3. the harness produces a concrete kill witness;
4. no mutant is counted as killed merely because it raises an unrelated exception.

## 3. M01 — Cut destruction uses ANY instead of ALL

Correct:

```text
a failed set destroys capability iff it intersects every minimal success coalition
```

Mutant:

```text
intersects any minimal success coalition
```

Frozen witness family:

```text
{E1,E2}, {E2,E3}
```

Failure `{E1}` must not destroy capability because `{E2,E3}` survives.

## 4. M02 — Hitting set uses subset instead of intersection

Correct candidate cut must intersect every minimal success set.

Mutant requires each success coalition to be a subset of the candidate cut.

Expected to miss valid minimal cut `{E2}` in the frozen witness.

## 5. M03 — Fusion incorrectly creates a new independent root

Correct domain fusion cannot increase distinct root-domain count.

Mutant replaces one merged principal with a fresh unique root.

Frozen witness starts with:

```text
P0->R0
P1->R1
P2->R2
```

and attempts to fuse `R0,R1`.

Correct root count becomes 2.
Mutant root count remains 3 or increases independence instead of reducing it.

## 6. M04 — Physical threshold increases after fusion

Correct minimum root threshold for the same logical-seat target cannot increase when authority domains merge.

Mutant adds 1 to the derived post-fusion threshold when possible.

Frozen witness:

```text
3 principals
seat threshold = 2
```

independent threshold 2, fused A+B threshold 1.

## 7. M05 — Incomplete evidence certifies independence

Correct incomplete evidence:

```text
INDEPENDENCE_UNVERIFIED
advertise=false
```

Mutant treats missing observations as distinct placeholder roots and certifies.

## 8. M06 — Duplicate observed roots certify independence

Correct complete duplicate roots:

```text
SHARED_CONTROL_OBSERVED
advertise=false
```

Mutant checks only completeness and certifies.

## 9. M07 — Untrusted event revokes authority

Correct:

```text
UNTRUSTED event -> refuse event authority
```

Mutant treats all delivered events as trusted.

Frozen witness requires certification to remain fresh at the event epoch.

## 10. M08 — Trusted event directly certifies shared topology

Correct trusted event state:

```text
INDEPENDENCE_REVOKED_PENDING_REVALIDATION
```

Mutant jumps directly to:

```text
SHARED_CONTROL_OBSERVED
```

without revalidation evidence.

## 11. M09 — Coarsening implemented as refinement

Correct many-to-one coarsening cannot create more descriptor classes.

Mutant returns descriptor:

```text
(fine_descriptor, coarse_bucket)
```

which preserves/refines the fine distinction instead of coarsening it.

Frozen witness requires a strict reduction from 4 fine classes to 2 coarse classes.

## 12. M10 — Refinement drops the coarse coordinate

Correct refinement:

```text
R=(C,D)
```

Mutant uses only:

```text
R=D
```

which need not refine C and can increase residual conditional entropy.

Frozen witness is chosen where:

\[
H(Y|D)>H(Y|C).
\]

## 13. M11 — Quorum threshold off by one

Correct policy:

```text
authorize iff controlled_seats >= threshold
```

Mutant authorizes at:

```text
controlled_seats >= threshold - 1
```

Frozen strict-declassification witness:

```text
threshold=3
controlled seats=2
```

must refuse.

## 14. M12 — Refusal leaks protected evidence

Correct refusal schema contains no:

```text
epoch0_snapshot
tag
key
digest
public_output
```

Mutant adds:

```text
tag = "OLD_AUTHENTICATOR"
```

Frozen oracle must detect the leak.

## 15. Kill receipts

Every mutant result records:

```text
mutant_id
family
description
killed
witness
baseline
mutant
violated_invariant
```

No killed mutant may have a null witness.

No surviving mutant may be omitted.

## 16. Qualification

Freeze before first execution:

- this specification;
- source;
- tests.

Qualification requires:

- 12/12 mutants killed;
- mutation score exactly 1.0;
- all kill receipts present;
- unit tests PASS;
- frozen hashes unchanged;
- replay-exact report bytes.

## 17. Claim firewall

M3 does not prove the tests detect all possible bugs.

A 1.0 score means only that the frozen 12 non-equivalent deliberately wrong implementations were all detected.

The next phase should test **metamorphic invariants** under representation changes, because mutation coverage and representation robustness are different questions.
