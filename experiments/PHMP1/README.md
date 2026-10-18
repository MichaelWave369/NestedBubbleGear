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

## PHMP-2 Stage 3 · Finite unitary quotient Keyholes

The [quotient experiment](PHMP2_UNITARY_QUOTIENTS.md) demonstrates a composition-preserving but **information-losing** map from native `SL(2,Z)` to permutation unitaries `U(3)` and `U(8)`. It reproduces AH9/AH10 connector-composition identities, quantifies which naive-composition failures each observer hides, and verifies complex roots-of-unity modes. Read the [Stage 3 decision ledger](PHMP2_STAGE3_LEDGER.md). Run `npm run test:phmp2-quotients`.

## PHMP-3 E0 · Frozen task before performance scoring

The [PHMP-3 protocol](PHMP3_PROTOCOL.md) specifies a deterministic streaming-memory benchmark and mandatory classical sufficient-statistic baseline. The [generator](../../scripts/phmp3_contract.mjs) supports two typed causal histories and four post-commit modular questions per history. `npm run test:phmp3-contract` checks training/validation fixtures and the mathematical oracle without scoring the reserved split or any candidate memory model.

## PHMP-3 E1 · Bounded memory model comparisons

The [E1 report and audit](PHMP3_E1.md) specify exact classical, typed-connector, quotient, last-event and whole-interleaving memory policies. Train/validation only, with the classical two-byte exact baseline as a mandatory 100% ceiling. Run `npm run test:phmp3-memories`. No held-out results or new physical claims.

## PHMP-3 E2 · Source-pinned reserved evaluation (not yet executed)

The [E2 gate protocol](PHMP3_E2_GATE.md) introduces a deliberately non-automatic first-pass scorer for reserved seed 203. The runner checks E1's frozen source hashes, requires an explicit one-time CLI gate and new receipt path, and does not score reserved histories during `npm test`. Outcome currently **NOT_EVALUATED**.

## Optical Keyholes · proposed separate baseline

The [optical-observer note](OPTICAL_KEYHOLES_NOTE.md) records conventional Jones-vector and polarization-projection mathematics relevant to PHMP-1, with no new NBG or physical claim and no effect on E2 frozen scoring.

## Optical Keyhole O1 · Exact Jones/Stokes tests

The [O1 protocol](OPTICAL_KEYHOLES_O1.md) makes the original optical-observer analogy reproducible: matched component intensities can conceal relative phase, but diagonal and circular analyzers reveal appropriate distinctions. It verifies global `π` / `2π` phase controls and unit Poincaré coordinates. Run `npm run test:phmp-optical-o1`. This remains classical optics, outside PHMP-3 E2 held-out scoring.

## Read next

- [PHMP-1 protocol](SPEC.md)
- [PHMP-2 native AH correspondence audit plan](PHMP2_AUDIT.md)
- [Existing AH dossiers](../AH2-AH10_DOSSIERS.md)
- [AH9 frozen spec](../AH9/SPEC.md) and [AH10 frozen spec](../AH10/SPEC.md)
- [Claim firewall](../../CLAIMS.md)

**Important:** A pair of delayed-distinguishable states does not by itself establish nontrivial connection holonomy. This demonstration is established complex linear algebra, not evidence for a new physical law, energy recovery, or an advantage over conventional neural networks.
