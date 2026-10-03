# AH15 v0.1.0 Qualification Results

## Verdict

**PASS_AH15**

- Frozen acceptance checks: **21/21**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**

## Monotone downgrade chain

`FULL -> ROUTE_DOWNSTREAM -> DOWNSTREAM`

- FULL: 15 classes / 3.875 bits
- ROUTE_DOWNSTREAM: 13 classes / 3.625 bits
- DOWNSTREAM: 9 classes / 3.077819531114783 bits

Direct `FULL -> H3` and sequential `FULL -> P2 -> H3` produce identical final H3 memories and byte-identical final-state receipts.

## Reauthorization barriers

`GLOBAL -> ROUTE` is not locally realizable from retained global residue alone:

`H(P2 | RΓ) = 0.25 bits`

`ROUTE -> GLOBAL` is also not locally realizable from P2 alone:

`H(G | P2) = 0.25 bits`

An earlier downgrade can therefore remove distinctions a later lateral role switch would need. Reauthorization requires a higher-authority source or recomputation.

## Intermediate receipt hazard

`H(P2 | H3) = 0.5471804688852168 bits`

A final-state-only receipt adds no information beyond H3:

`H(P2 | H3, R_final) = 0.5471804688852168 bits`

But the intermediate P2 commitment has one unique hash per frozen P2 class:

`unique hashes = 13/13`

and exhaustive lookup in this tiny domain yields:

`H(P2 | H3, R_mid) = 0.0 bits`

This is an enumeration result, not a SHA-256 inversion result.

## Interpretation

AH15 shows that monotone downgrade can be path-independent, lateral reauthorization can be blocked by prior forgetting, and intermediate provenance can preserve distinctions later revoked.

These are representation-level properties in a finite frozen ensemble, not proofs of physical erasure or cryptographic revocation.
