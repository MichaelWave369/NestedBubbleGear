# AH28 Candidate — Multi-Horizon Governance and Evidence Arbitration

AH27 shows that lifetime, recent-window, and discounted memories can disagree because they answer different temporal questions.

AH28 should make that disagreement explicit in governance.

Candidate contracts:

- `Q_LIFETIME`
- `Q_RECENT`
- `Q_ADAPTIVE`

Candidate arbitration states:

- `CONSISTENT`
- `RECENT_RISK_ONLY`
- `LIFETIME_RISK_ONLY`
- `HORIZON_CONFLICT`

Every receipt should name the horizon used for its evidence claim.

A policy request that omits its horizon should be eligible for an `UNDERSPECIFIED_HORIZON` refusal.

Core candidate principle:

```text
evidence without a declared time horizon is an incomplete governance claim
```
