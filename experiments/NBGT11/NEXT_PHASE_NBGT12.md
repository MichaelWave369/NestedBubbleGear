# NBG-T12 Candidate — Governance Branches + Counterfactual Policy Replay

NBG-T11 makes observed governance history bitemporal and replayable.

NBG-T12 should introduce explicit counterfactual governance branches without mixing them with the observed policy ledger.

Candidate scope:

1. observed policy ledger remains immutable;
2. counterfactual branch declares an explicit fork receipt;
3. remove / delay / alter one policy event;
4. replay the same evidence and reviewer decisions;
5. compare observed and counterfactual Governance Keyholes;
6. branch-specific resolution receipts;
7. no claim that counterfactual governance is what history would actually have done;
8. branch provenance through export/import;
9. deterministic branch replay;
10. divergence summary identifying the first policy event that changes the governance outcome.

Observed and counterfactual governance must remain separate products.
