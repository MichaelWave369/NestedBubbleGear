# AH13 v0.1.0 Qualification Results

## Verdict

**PASS_AH13**

- Frozen acceptance checks: **41/41**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **true**
- Replay exact: **true**
- Frozen histories: **48**

## Capability memory

The full-capability query family is `(G,H2,H3,P2)`.

Frozen coarsest sufficient preregistered descriptor:

`action = (H2,H3)`

- classes: **15**
- entropy: **3.875 bits**

## Authorized-role memories

| Role | Authorized query | Memory | Classes | Entropy | Reduction vs full | Selected excess leakage | Full-action excess leakage |
|---|---|---|---:|---:|---:|---:|---:|
| GLOBAL_OPERATOR | G | residue | 13 | 3.625 | 0.25 | 0 | 0.25 |
| INTERFACE_INSPECTOR | H2 | H2 | 3 | 1.5 | 2.375 | 0 | 2.375 |
| DOWNSTREAM_INSPECTOR | H3 | H3 | 9 | 3.077819531115 | 0.797180468885 | 0 | 0.7971804688852169 |
| ROUTE_AUDITOR | P2 | cumulative | 13 | 3.625 | 0.25 | 0 | 0.25 |
| FULL_AUDITOR | G,H2,H3,P2 | action | 15 | 3.875 | 0 | 0 | 0 |

## Main result

For each restricted role, the selected role memory is sufficient for every authorized answer and strictly coarser than full-capability memory.

Selected role memories have zero **excess** unauthorized leakage in the frozen model:

`I(Y_unauthorized ; D_selected) - I(Y_unauthorized ; Q_authorized) = 0`

This does **not** mean zero unauthorized information is revealed. Authorized answers can already be correlated with unauthorized answers. The metric subtracts that unavoidable correlation floor.

By contrast, retaining full-capability `action` memory creates positive excess leakage for every restricted role.

## Capability-versus-authority witness

For `INTERFACE_INSPECTOR`:

`H(H2 | H2) = 0`

but:

`H(G | H2) = 2.375 bits`

For `GLOBAL_OPERATOR`:

`H(G | RΓ) = 0`

while:

`H(H2 | RΓ) = 0.25 bits`

and:

`H(P2 | RΓ) = 0.25 bits`

## Claim boundary

AH13 is a retention-policy result, not a proof of:

- secure deletion;
- cryptographic access control;
- noninterference;
- differential privacy;
- resistance to inference attacks;
- universal least-privilege memory.

The supported conclusion is limited to the frozen ensemble and preregistered descriptor family.
