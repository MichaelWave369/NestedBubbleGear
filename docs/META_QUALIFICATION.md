# Meta-Qualification

The AH experimental ladder closes at **AH44**. Work after AH44 is organized as a separate meta-qualification program rather than continuing the AH numbering.

## M1 — Spec-Driven Independent Reproduction

**Status:** candidate PR

M1 independently reimplements selected published contracts without importing the historical AH experiment source modules.

Flagships:

- AH20 — cut-set/reliability duality;
- AH35 — upgrade access structure;
- AH42 — control-domain certification;
- AH44 — temporal/event revocation.

Local frozen qualification:

- 59/59 reproduction checks PASS;
- 10/10 unit tests PASS;
- frozen hashes unchanged;
- replay exact.

M1 is an internal implementation-independence test, not external replication.

## Planned sequence

- M2 — property-based generated universes;
- M3 — mutation testing;
- M4 — metamorphic invariants;
- M5 — external reproduction bundle;
- M6 — falsification report.
