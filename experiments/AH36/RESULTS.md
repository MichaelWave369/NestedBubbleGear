# AH36 v0.1.0 Qualification Results

## Verdict

**PASS_AH36_QUALIFIED**

- Frozen acceptance checks: **31/31**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Dynamic disclosure trace

| Event | Operation | Authority privacy | Current privacy | Ledger privacy | Alignment |
|---|---|---:|---:|---:|---|
| E0 | INITIAL_RELEASE | 1.160964047443681 | 1.160964047443681 | 1.160964047443681 | AUTHORITY_AND_CURRENT_ALIGNED |
| E1 | GRANT_H_L_TRIAGE_AND_REFRESH | 0.675488750216347 | 0.675488750216347 | 0.675488750216347 | AUTHORITY_AND_CURRENT_ALIGNED |
| E2 | GRANT_ADAPTIVE_TRIAGE_AND_REFRESH | 0.400000000000000 | 0.400000000000000 | 0.400000000000000 | AUTHORITY_AND_CURRENT_ALIGNED |
| E3 | GRANT_ADAPTIVE_FULL_AND_REFRESH | 0.000000000000000 | 0.000000000000000 | 0.000000000000000 | AUTHORITY_AND_CURRENT_ALIGNED |
| E4 | REVOKE_H_L_TRIAGE_ONLY | 0.400000000000000 | 0.000000000000000 | 0.000000000000000 | REVOKED_BUT_STALE_DISCLOSURE_PRESENT |
| E5 | DOWNGRADE_H_L_CURRENT_AND_REFRESH | 0.400000000000000 | 0.400000000000000 | 0.000000000000000 | AUTHORITY_AND_CURRENT_ALIGNED |

## Main witness

At E3 the granted refinements cross a minimal AH35 collapse path and all three views reach **0 bits** residual privacy.

At E4, revoking historian lifetime TRIAGE restores the **authority-view** privacy to **0.4 bits**, but the already materialized current value remains TRIAGE, so current and historical views stay at **0 bits**.

At E5, explicit downgrade/rematerialization restores the current view to **0.4 bits**, while the append-only historical ledger remains at **0 bits**.

Fresh observer at E5:

**0.400000000000000 bits**

Historical observer through E5:

**0.000000000000000 bits**

Toy history-projection control:

**0.400000000000000 bits**

## Main result

`permission revoked != current disclosure coarsened != historical disclosure erased`

`current-view privacy can recover while append-only historical-view privacy cannot`

AH36 is a finite disclosure-history result. It does not claim secure deletion, forward secrecy, cache invalidation, or retroactive secrecy.