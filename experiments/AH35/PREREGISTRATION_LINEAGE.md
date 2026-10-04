# AH35 Preregistration Lineage

## v0.1.0

Frozen before execution.

Result: **FAIL_AH35 — 28/29 checks**.

Independent unit tests: **15/15 PASS**.

Only failed acceptance check:

`cuts:exact`

Observed science was unchanged:

- 243 valid prerequisite-closed upgrade sets;
- 137 dangerous sets;
- 10 minimal dangerous paths;
- 12 inclusion-minimal cut sets;
- empty mandatory core;
- unique minimum cut `{H_L:T, U_L:T}`;
- structural-policy frontier exactly as preregistered.

The failure was deterministic tuple ordering of the same 12 cut sets. The v0.1.0 expected tuple listed those sets in a different order from the enumerator.

## v0.1.1

Changes made before fresh execution:

- version identifier `0.1.0 -> 0.1.1`;
- reorder the already-preregistered 12 expected cut sets to match deterministic enumeration order;
- reorder the prose list in `SPEC.md` to the same enumeration order.

Unchanged:

- panel ensemble;
- task hierarchy;
- upgrade atoms and prerequisite rules;
- danger criterion;
- entropy calculations;
- minimal-path algorithm;
- hitting-set algorithm;
- cut statistics;
- policy frontier algorithm;
- all 15 unit tests.
