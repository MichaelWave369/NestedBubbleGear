# Frozen Experiment Archive

This directory is reserved for the executable, frozen experiment packages that underpin the AH ladder.

Planned imports:

- `AH2_latent_causal_residue/`
- `AH3_boundary_transfer/`
- `AH4_two_interface_holonomy/`
- `AH5_noncommuting_order/`
- `AH6_closed_commutator_loop/`
- `AH7_oriented_holonomy/`
- `AH8_plaquette_transport/`

Each imported package should preserve its original preregistration, source, tests, result receipts, frozen hashes, and manifest.

Do not silently modify a frozen package after execution. Corrections should land as a new version.


## AH2→AH8 dossier index

The verified frozen package identities and result summaries are now tracked in:

- `archive-index.json` — machine-readable package/result metadata
- `AH2-AH8_DOSSIERS.md` — human-readable evidence ladder
- `FROZEN_PACKAGE_SHA256SUMS.txt` — exact SHA-256 identities of the original ZIP archives

### Binary archive status

The original ZIP files have been independently re-hashed against the values above. They are **not yet committed as binary blobs** because the current connector write path does not accept local binary file paths directly.

This distinction is intentional: an indexed archive hash is not represented as a committed archive byte stream until those exact bytes are uploaded and verified.


## AH14 archive identity

The exact frozen AH14 ZIP was independently hashed and is indexed as:

`NBG-AH14_Revocation_Memory_Downgrade_v0.1.0.zip`

SHA-256:

`921d4e091984fb8d3122d35d2e25f05d436eff2dd9659dd90ea3e968bdb0aa0e`

The runnable frozen core (spec/source/tests) is committed byte-exact and verified by CI before execution. The raw ZIP binary is not claimed as committed by this PR; binary archival backfill is a separate mechanical step.

Older AH2–AH13 ZIPs likewise remain indexed by their independently verified archive hashes unless explicitly backfilled later.
