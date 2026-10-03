# AH29 v0.1.0 Qualification Results

## Verdict

**PASS_AH29_QUALIFIED**

- Frozen acceptance checks: **23/23**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen panels: **7**

## Authority matrix

| Role | Directly authorized contracts |
|---|---|
| ADAPTIVE_CONTROLLER | Q_ADAPTIVE |
| AUDITOR | Q_LIFETIME, Q_RECENT |
| HISTORIAN | Q_LIFETIME |
| OPERATOR | Q_RECENT |
| ROOT_GOVERNOR | Q_LIFETIME, Q_RECENT, Q_ADAPTIVE, Q_MULTI |
| TRI_HORIZON_ANALYST | Q_LIFETIME, Q_RECENT, Q_ADAPTIVE |

## Information-theoretic checks

- `H(M | AUDITOR lifetime+recent)` = **0.393555357451924 bits**
- `H(M | TRI all three singles)` = **0.000000000000000 bits**
- `H(recent | lifetime)` = **0.749301785405219 bits**
- `H(lifetime | recent)` = **1.142857142857143 bits**
- `H(M | adaptive)` = **1.142857142857143 bits**

## Release-invariance witnesses

- historian F/G same authorized release while recent differs: **True**
- operator C/D same authorized release while lifetime differs: **True**
- adaptive-controller C/F same authorized release while lifetime differs: **True**
- auditor A/B same lifetime+recent projection while adaptive differs: **True**

## Negative control

- TRI_HORIZON_ANALYST `Q_MULTI` denied on every panel: **True**
- TRI_HORIZON_ANALYST reconstructs the multi answer from authorized singles on every panel: **True**

So the frozen result is:

`interface denial != informational non-derivability`

and:

`evidence capability != evidence authority`

AH29 therefore treats least privilege as a property of released information and its derivation closure, not merely permission bits on an endpoint.

## Claim boundary

This is a finite authorization/information-partition result. It is not a cryptographic secrecy proof, production IAM validation, or side-channel noninterference theorem.
