# M1 Frozen Specification — Spec-Driven Independent Reproduction

## Goal

Independently rederive selected flagship outputs using a second implementation written from frozen public experiment contracts rather than importing historical AH implementations.

Flagships: AH20, AH35, AH42, AH44.

## Independence boundary

M1 may use frozen published specifications, frozen public expected-result contracts, and explicit finite inputs copied into `inputs/flagships.json`.

M1 must not import or execute historical AH source modules.

## AH20

From minimal successful coalitions alone, independently compute inclusion-minimal hitting sets and exhaustive independent-failure reliability at p=0.1.

Required outputs:
- full-task capability cuts `{E2}`, `{E1,E3}`;
- H2/GLOBAL policy cuts `{E1}`, `{E2}`;
- ROUTE policy cuts `{E2}`, `{E3}`;
- alarm capability cut `{E1,E3}`;
- alarm policy cut `{E3}`;
- full capability reliability 0.891;
- pair policy reliability 0.81;
- alarm capability reliability 0.99;
- alarm policy reliability 0.9.

## AH35

Enumerate the full prerequisite-closed three-level profile space, 3^5 = 243. Convert each level profile to an atom set. Define dangerous profiles as those containing at least one published minimal dangerous path.

Required outputs:
- 243 valid profiles;
- 137 dangerous;
- 106 safe by structural complement;
- 10 minimal dangerous paths;
- empty mandatory core;
- 12 inclusion-minimal hitting-set cuts;
- unique minimum cut `{H_L:T,U_L:T}`;
- minimum cut size 2;
- maximum permitted richness under that cut 6;
- no one-atom cut.

This independently reproduces the combinatorial access structure, not the entropy frontier.

## AH42

For each frozen scenario, independently enumerate actual root-domain coalitions, derive 2-seat verification and 3-seat declassification thresholds, calculate p=0.1 root reliability, and certify observed roots.

Required threshold pairs:
- S1 2/3;
- S2 1/2;
- S3 2/3;
- S4 1/2.

Incomplete evidence must never advertise independence.

## AH44

Implement a second temporal state machine:
- issue at t0;
- TTL 2;
- actual fusion at t2 when applicable;
- trusted event revokes prospectively;
- untrusted event has no revocation authority;
- revalidate at t4.

Required false-advertisement counts:
- TTL_ONLY 1;
- TRUSTED_IMMEDIATE 0;
- TRUSTED_DELAYED_1 1;
- MISSING_EVENT 1;
- FALSE_POSITIVE_TRUSTED 0;
- UNTRUSTED_IMMEDIATE 1.

Trusted false positive must cause two unnecessary-refusal epochs.

## Qualification

Freeze before first execution:
- SPEC.md;
- inputs/flagships.json;
- src/m1_reproduce.py;
- tests/test_m1.py.

Require all reproduction checks pass, unit tests pass, hashes unchanged, and replay-exact result bytes.

A PASS establishes only internal implementation independence for these selected finite-model claims.
