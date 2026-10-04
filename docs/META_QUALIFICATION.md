# Meta-Qualification

The AH experimental ladder closes at **AH44**. Work after AH44 is organized as a separate meta-qualification program rather than continuing the AH numbering.

## M1 — Spec-Driven Independent Reproduction

**Status:** QUALIFIED · merged in PR #41

M1 independently reimplements selected published contracts without importing the historical AH experiment source modules.

Flagships:

- AH20 — cut-set/reliability duality;
- AH35 — upgrade access structure;
- AH42 — control-domain certification;
- AH44 — temporal/event revocation.

Frozen qualification:

- 59/59 reproduction checks PASS;
- 10/10 unit tests PASS;
- frozen hashes unchanged;
- replay exact.

M1 is an internal implementation-independence test, not external replication.

## M2 — Property-Based Generated Universes

**Status:** QUALIFIED locally · PR candidate

Frozen generation:

```text
MASTER_SEED = 369042
CASES_PER_PROPERTY = 250
TOTAL_CASES = 1500
```

Properties tested:

1. minimal failure cuts equal minimal hitting sets of minimal success coalitions;
2. fusing control domains never increases independent-root count or physical root threshold;
3. incomplete independence evidence never certifies independence;
4. trusted revocation events revoke prospectively without certifying a new topology;
5. observer coarsening never increases exact distinguishability;
6. adding observer distinctions never increases residual conditional entropy.

Frozen local result:

- 1500/1500 generated cases PASS;
- 0 counterexamples;
- 10/10 unit tests PASS;
- frozen hashes unchanged;
- replay exact.

Every generated case has a deterministic derived seed and replayable case receipt. Any future failure is written to a deterministic counterexample ledger.

M2 is finite generated testing, not formal proof.

## Planned sequence

- M3 — mutation testing;
- M4 — metamorphic invariants;
- M5 — external reproduction bundle;
- M6 — falsification report.
