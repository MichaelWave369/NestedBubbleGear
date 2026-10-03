# NBG-AH28 v0.1.1 — Multi-Horizon Governance and Evidence Arbitration

AH27 showed that lifetime, recent-window, and discounted memories can disagree because they answer different temporal questions.

AH28 makes the evidence horizon part of the governance contract.

Frozen query contracts:

- `Q_LIFETIME`
- `Q_RECENT`
- `Q_ADAPTIVE`
- `Q_MULTI`

A request without a declared horizon is refused as `REFUSE_UNDERSPECIFIED_HORIZON`.

The multi-horizon arbitrator can emit:

- `CONSISTENT`
- `RECENT_RISK_ONLY`
- `LIFETIME_RISK_ONLY`
- `HORIZON_CONFLICT`

Accepted receipts always name their horizon. No horizon-specific evidence output is promoted to the unqualified word `SAFE`.

v0.1.0 remains preserved as a failed preregistration. v0.1.1 corrects only Panel D's adaptive expected state and version identifiers.

This is a finite governance-contract toy model, not a production safety decision system.
