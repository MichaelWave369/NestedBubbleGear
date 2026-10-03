# AH33 v0.1.0 Qualification Results

## Verdict

**PASS_AH33_QUALIFIED**

- Frozen acceptance checks: **39/39**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Frozen panels: **10**

## Task richness / coalition privacy frontier

| Profile | Task information (bits) | Task-sufficient designs | Coalition-safe designs | Best residual privacy (bits) |
|---|---:|---:|---:|---:|
| COMMON_ONLY | 1.960964047443681 | 243 | 106 | 1.160964047443681 |
| FULL_STATUS | 3.121928094887362 | 1 | 0 | 0.000000000000000 |
| TRIAGE | 2.721928094887362 | 32 | 4 | 0.400000000000000 |

## Selected frontier

- `COMMON_ONLY`: all five grants COMMON_ONLY; residual **1.160964047443681 bits**.
- `TRIAGE`: all five grants TRIAGE; residual **0.4 bits**.
- `FULL_STATUS`: all five grants FULL_STATUS; residual **0 bits** and no coalition-safe task-sufficient design.

## Information accounting

Full target entropy: **3.121928094887362 bits**.

For each selected profile, `task information + residual privacy = full target entropy` exactly within numerical tolerance.

## TRIAGE structure

Exactly four TRIAGE-task-sufficient designs remain coalition-safe. In every one, both recent-status carriers and adaptive evidence remain TRIAGE. Either lifetime carrier may be upgraded to FULL_STATUS without fully reconstructing the target on the frozen ten-panel ensemble.

## Main result

`task richness and coalition privacy trade off through retained distinctions`

`some authorized task contracts are too rich to support the desired deny under unrestricted pooling`

AH33 is a finite partition/entropy/design result, not a universal privacy-utility theorem.
