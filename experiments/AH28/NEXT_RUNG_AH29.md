# AH29 Candidate — Horizon Authorization and Evidence Least Privilege

AH28 makes the evidence horizon explicit in the query contract.

AH29 should separate **which horizons the substrate can answer** from **which horizons an actor is authorized to inspect**.

Candidate roles:

- HISTORIAN: lifetime only;
- OPERATOR: recent only;
- AUDITOR: lifetime + recent;
- ADAPTIVE_CONTROLLER: discounted only;
- ROOT_GOVERNOR: multi-horizon arbitration.

Questions:

1. Can an actor authorized for lifetime evidence be prevented from inferring recent-hazard state?
2. Can receipts prove which horizon was released without committing to unauthorized horizon values?
3. Does granting `Q_MULTI` leak more than the union of individually authorized horizon answers?
4. Can horizon-specific authorization be minimized the same way AH13 minimized query memory?
5. Should an underspecified request be refused even when the actor technically has access to multiple horizons?

Core principle:

`evidence capability != evidence authority`

This would fuse AH28 directly back into the authority/memory ladder.
