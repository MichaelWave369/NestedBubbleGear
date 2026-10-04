# NBG M1 v0.1.0 Qualification Results

## Verdict

**PASS_M1_QUALIFIED**

- Reproduction checks: **59/59 PASS**
- Unit tests: **10/10 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Flagship reproductions

### AH20 — cut-set/reliability duality

- Full-task capability cuts reproduced as `{E2}` and `{E1,E3}`.
- Pair-policy reliability at `p=0.1` reproduced as `0.81`.
- Full capability reliability reproduced as `0.891`.
- Alarm capability/policy reliabilities reproduced as `0.99 / 0.9`.

### AH35 — upgrade access structure

- valid prerequisite-closed profiles: **243**
- dangerous profiles: **137**
- safe profiles: **106**
- minimal cuts: **12**
- unique minimum cut: **['H_L:T', 'U_L:T']**
- maximum richness under minimum cut: **6**

### AH42 — control-domain certification

- complete distinct observed roots -> `CERTIFIED_INDEPENDENT`;
- complete shared observed root -> `SHARED_CONTROL_OBSERVED`;
- incomplete root evidence -> `INDEPENDENCE_UNVERIFIED`;
- hidden shared topology reproduces actual physical thresholds `1 / 2` without falsely certifying independence.

### AH44 — temporal/event revocation

- TTL-only false-advertisement window: **1 epoch**;
- trusted immediate event: **0 epochs**;
- trusted one-epoch delay: **1 epoch**;
- trusted false positive: **2 unnecessary-refusal epochs**;
- untrusted immediate event does not gain revocation authority.

## Independence boundary

The M1 source imports no historical AH experiment module and does not execute any historical AH harness. It rederives the selected outputs from frozen public contracts encoded in `inputs/flagships.json`.

## Scope

M1 is an internal implementation-independence test. It is not external replication by an unaffiliated researcher and does not independently reproduce every entropy calculation in the AH program.

## Next phase

`M2 — Property-Based Generated Universes`
