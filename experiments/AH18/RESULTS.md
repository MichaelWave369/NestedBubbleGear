# AH18 v0.1.0 Qualification Results

## Verdict

**PASS_AH18_QUALIFIED**

- Frozen acceptance checks: **51/51**
- Unit tests: **14/14 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen histories: **48**

## Three Keyholes

| Share | Classes | Entropy | H(H2 | share) |
|---|---:|---:|---:|
| E1 | 2 | 0.811278124459 | 0.688721875541 |
| E2 | 2 | 0.811278124459 | 0.688721875541 |
| E3 | 2 | 0.811278124459 | 0.688721875541 |

## Coalition topology

| Coalition | Classes | Entropy | H(H2 | coalition) | Capable |
|---|---:|---:|---:|---|
| E1+E2 | 3 | 1.500000000000 | 0.000000000000 | True |
| E1+E3 | 2 | 0.811278124459 | 0.688721875541 | False |
| E2+E3 | 3 | 1.500000000000 | 0.000000000000 | True |

Minimal capable coalitions:

- `{E1,E2}`
- `{E2,E3}`

`{E1,E3}` is equally large but remains insufficient because E1 and E3 induce the same two-class partition of H2.

## Grant results

### DOWNSTREAM_TO_ROUTE

- authorized pair: `E2+E3`
- mathematically capable but policy-denied pair: `E1+E2`
- insufficient pair: `E1+E3`
- baseline conditional entropy: `0.5471804688852168` bits
- insufficient-pair conditional entropy: `0.25` bits
- release: `P2`
- release excess leakage: `0.0` bits

### ROUTE_TO_GLOBAL

- authorized pair: `E1+E2`
- mathematically capable but policy-denied pair: `E2+E3`
- insufficient pair: `E1+E3`
- baseline conditional entropy: `0.25` bits
- insufficient-pair conditional entropy: `0.125` bits
- release: `residue`
- release excess leakage: `0.0` bits

## Main result

`two authorities` is not by itself a sufficient quorum rule.

The access structure is coalition-specific, and policy authorization can be stricter than mathematical capability.

Operationally:

`quorum = access structure, not merely a count`

This remains an information-partition result, not cryptographic threshold security.
