# NBG-AH29 v0.1.0 — Horizon Authorization and Evidence Least Privilege

AH28 made the evidence horizon explicit in the query contract.

AH29 separates:

\[
\text{evidence capability}
\]

from:

\[
\text{evidence authority}.
\]

The substrate can answer all frozen horizon contracts, but roles receive only declared subsets.

Roles:

- `HISTORIAN` → lifetime only
- `OPERATOR` → recent only
- `ADAPTIVE_CONTROLLER` → adaptive only
- `AUDITOR` → lifetime + recent
- `TRI_HORIZON_ANALYST` → lifetime + recent + adaptive, but not `Q_MULTI`
- `ROOT_GOVERNOR` → all contracts including `Q_MULTI`

The experiment tests explicit authorization, refusal receipts, release invariance across unauthorized horizon changes, and information-theoretic residual uncertainty.

The main negative control is important:

> Denying `Q_MULTI` at the interface does not make the multi-horizon answer secret if a role is already authorized for all three component horizons.

This is a finite evidence-authority toy model, not a production access-control or confidentiality proof.
