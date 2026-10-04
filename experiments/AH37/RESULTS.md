# AH37 v0.1.0 Qualification Results

## Verdict

**PASS_AH37_QUALIFIED**

- Frozen acceptance checks: **18/18**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Epoch observer comparison

| Observer | Residual privacy (bits) | Descriptor classes |
|---|---:|---:|
| FRESH_E1 | 0.400000000000000 | 7 |
| LEGACY_E0_E1 | 0.000000000000000 | 9 |
| PUBLIC_COMMITMENT_E0_E1 | 0.000000000000000 | 9 |
| METADATA_ONLY_E0_E1 | 0.400000000000000 | 7 |
| PUBLIC_COMMITMENT_ONLY | 0.000000000000000 | 9 |
| EPOCH0_ONLY | 0.000000000000000 | 9 |

## Public commitment enumeration

- frozen candidate panels: **10**
- distinct Epoch-0 rich snapshots: **9**
- distinct public SHA-256 commitments: **9**
- every public digest maps to exactly one target class: **True**

## Main result

`forward privacy boundary != historical erasure`

`public deterministic commitment != non-disclosure in a tiny enumerable domain
Fresh Epoch-1 observers retain **0.4 bits** of residual privacy only when old panel-dependent disclosure does not cross the epoch boundary. Legacy observers and observers given the enumerable public digest remain at **0 bits**.

The metadata-only seal is a control, not a commitment to old data and not a secure-erasure claim.
