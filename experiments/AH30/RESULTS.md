# AH30 v0.1.0 Qualification Results

## Verdict

**PASS_AH30_QUALIFIED**

- Frozen acceptance checks: **31/31**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Direct vs effective authority

| Role | Direct | Effective closure |
|---|---|---|
| HISTORIAN | Q_LIFETIME | Q_LIFETIME |
| OPERATOR | Q_RECENT | Q_RECENT |
| ADAPTIVE_CONTROLLER | Q_ADAPTIVE | Q_ADAPTIVE |
| AUDITOR | Q_LIFETIME, Q_RECENT | Q_LIFETIME, Q_RECENT |
| TRI_HORIZON_ANALYST | Q_LIFETIME, Q_RECENT, Q_ADAPTIVE | Q_LIFETIME, Q_RECENT, Q_ADAPTIVE, Q_MULTI |
| ROOT_GOVERNOR | all four | all four |

## Hardening

Baseline TRI deny audit:

`INTERFACE_ONLY_DENY`

Frozen task requirement preserves lifetime + recent.

Unique minimum hardening:

- remove **Q_ADAPTIVE**
- direct authority becomes `Q_LIFETIME + Q_RECENT`
- effective authority becomes `Q_LIFETIME + Q_RECENT`
- `Q_MULTI` is no longer derivable
- deny audit becomes **DERIVATION_SAFE_DENY**

## Residual information

```text
H(M | L,R,A) = 0
H(M | L,R)   = 0.39355535745192405 bits
H(M | L,A)   = 0.2857142857142857 bits
H(M | R,A)   = 0.6792696431662097 bits
```

Main operational statements:

```text
authority must be closed under derivation
meaningful denies must be checked against effective authority, not only direct grants
```

Claim boundary: finite deterministic closure/authority model only; no cryptographic secrecy, side-channel noninterference, or production IAM claim.
