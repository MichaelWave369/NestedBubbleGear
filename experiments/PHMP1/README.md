# PHMP-1 | Complex phase / holonomy sanity gate

**Status:** exploratory, independent mathematical sanity benchmark. **Origin:** SIMULATED. **Authority:** NONE. **NBG validation:** NOT CLAIMED.

This additive research track preserves the corrected H/S witness from the October 2026 multi-model discussion. It is separate from the existing frozen AH2–AH44 packages and does not alter their specifications, hashes, results, or software.

## Run

```sh
npm run test:phmp1
```

No runtime dependencies, network, model weights, quantum hardware, or external API required. The script is plain Node.js and exits nonzero if any frozen numerical identity/control fails.

## Established results checked

- Two histories `X = HSv` and `X' = SHv` have identical magnitude-squared Keyhole `(1/2, 1/2)`.
- A common future probe `H` separates those histories as `(1,0)` and `(1/2,1/2)`.
- The loop word `U = H† S† H S` is unitary and nonidentity. **Corrected** trace is `1`, not `0`; determinant is `1`, trace of its square is `-1`, and eigenvalues are `exp(±iπ/3)`.
- Conjugation preserves loop trace and determinant; inverse transport cancels.
- Commuting identity control has loop `I` and trace `2`.
- Noncommuting real-orthogonal control has loop `-I`: a nontrivial central holonomy invisible to magnitude-only state measurement, so nontrivial loop transport is not sufficient for every observer to detect a difference.

The corrected trace discrepancy is retained as part of the discussion's error record rather than retroactively erased.

## Native PHMP-2 Stage 1

[PHMP-2 exact AH9/AH10 transport audit](PHMP2_NATIVE_AUDIT.md) independently reproduces the native integer-matrix loop/connector identities; [decision ledger](PHMP2_FINDINGS.md) records the supported correspondence and the unproven phase/Dirac bridge. Run `npm run test:phmp2`. No frozen AH input was changed.

## PHMP-2 Stage 2 · Independent local frames

The [finite edge-gauge covariance study](PHMP2_GAUGE_COVARIANCE.md) covers 6 vertex-frame assignments across all 12 AH9 and 16 AH10 native cases and intentionally inconsistent-edge controls. See the [Stage 2 ledger](PHMP2_STAGE2_LEDGER.md), and run `npm run test:phmp2-gauge`. This is ordinary group-valued transport, not new physical or NBG-specific validation.

## Read next

- [PHMP-1 protocol](SPEC.md)
- [PHMP-2 native AH correspondence audit plan](PHMP2_AUDIT.md)
- [Existing AH dossiers](../AH2-AH10_DOSSIERS.md)
- [AH9 frozen spec](../AH9/SPEC.md) and [AH10 frozen spec](../AH10/SPEC.md)
- [Claim firewall](../../CLAIMS.md)

**Important:** A pair of delayed-distinguishable states does not by itself establish nontrivial connection holonomy. This demonstration is established complex linear algebra, not evidence for a new physical law, energy recovery, or an advantage over conventional neural networks.
