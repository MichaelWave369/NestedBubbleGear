# AH17 v0.1.2 Qualification Results

## Verdict

**PASS_AH17_QUALIFIED**

- Frozen acceptance checks: **28/28**
- Unit tests: **13/13 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**

## Preregistration lineage

- v0.1.0: failed 27/28 because one preregistered expected conditional entropy was wrong.
- v0.1.1: harness passed 28/28, but qualification failed because one independent unit-test expectation was copied incorrectly.
- v0.1.2: corrected only those bookkeeping expectations; the split-authority construction itself is unchanged.

## Split authority Keyholes

- E1 = `H2[0][0]`: 2 classes / 0.811278124459 bits
- E2 = `H2[1][0]`: 2 classes / 0.811278124459 bits
- joint: 3 classes / 1.500000000000 bits
- H2: 3 classes / 1.500000000000 bits

`H(H2 | E1,E2) = 0`.

## Threshold grants

| Grant | Baseline | +E1 | +E2 | +E1+E2 | Release |
|---|---:|---:|---:|---:|---|
| DOWNSTREAM_TO_ROUTE | 0.547180468885 | 0.250000000000 | 0.250000000000 | 0.000000000000 | P2 |
| ROUTE_TO_GLOBAL | 0.250000000000 | 0.125000000000 | 0.125000000000 | 0.000000000000 | residue |

## Main result

Neither authority Keyhole alone resolves either frozen reauthorization target, even when combined with actor-local memory.

The authorized pair collapses target uncertainty to zero in both grants.

After reconstruction, only the target-role descriptor is released. Raw authority shares and reconstructed H2 are not part of the frozen handoff.

Selected release memory retains zero excess leakage relative to the target role's authorized answer, and the grant receipt adds no information beyond the release.

## Interpretation

`one insufficient Keyhole + second insufficient Keyhole -> jointly sufficient authorized parallax`

This is a finite information-partition result, not cryptographic secret sharing.
