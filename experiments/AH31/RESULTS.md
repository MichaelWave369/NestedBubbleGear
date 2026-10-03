# AH31 v0.1.0 Qualification Results

## Verdict

**PASS_AH31_QUALIFIED**

- Frozen acceptance checks: **26/26**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Actor coalitions exhaustively enumerated: **16**

## Minimal dangerous coalitions

- `{ADAPTIVE_CONTROLLER, AUDITOR}`
- `{HISTORIAN, OPERATOR, ADAPTIVE_CONTROLLER}`

## Mandatory core

`ADAPTIVE_CONTROLLER`

## Minimal actor cut sets

- `{ADAPTIVE_CONTROLLER}`
- `{HISTORIAN, AUDITOR}`
- `{OPERATOR, AUDITOR}`

## Information cross-check

Symbolic derivation closure and zero conditional entropy agree for **all 16 coalitions**.

Selected residual entropies:
- `AUDITOR`: **0.393555357451924 bits**
- `AUDITOR_ADAPTIVE`: **0.000000000000000 bits**
- `HISTORIAN_ADAPTIVE`: **0.285714285714286 bits**
- `HISTORIAN_OPERATOR`: **0.393555357451924 bits**
- `HISTORIAN_OPERATOR_ADAPTIVE`: **0.000000000000000 bits**
- `OPERATOR_ADAPTIVE`: **0.679269643166210 bits**

## Unrestricted-pooling impossibility

- baseline grant-removal configurations checked: **32**
- configurations preserving at least one release of L, R, and A: **9**
- coverage-preserving configurations whose grand coalition cannot derive M: **0**

Therefore, under unrestricted pooling, retaining all three raw horizon release classes somewhere in the organization necessarily makes `Q_MULTI` derivable by the grand coalition.

## Main result

`per-actor derivation safety != coalition derivation safety`

`individual least privilege does not compose automatically under pooling`

AH31 is a finite collusion/closure/access-structure result, not a cryptographic collusion-resistance theorem.
