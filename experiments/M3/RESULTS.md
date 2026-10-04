# M3 v0.1.0 Qualification Results

## Verdict

**PASS_M3_QUALIFIED**

- Frozen qualification checks: **9/9**
- Unit tests: **10/10 PASS**
- Mutants killed: **12/12**
- Mutants survived: **0**
- Mutation score: **1.000**
- Frozen hashes unchanged: **True**
- Replay exact across result, kill receipts, and survivor ledger: **True**

## Mutation families

| Family | Killed | Total |
|---|---:|---:|
| certification | 2 | 2 |
| control_domains | 2 | 2 |
| cut_sets | 2 | 2 |
| event_authority | 2 | 2 |
| information | 1 | 1 |
| observation | 1 | 1 |
| output_schema | 1 | 1 |
| quorum | 1 | 1 |

## Kill ledger

`results/kill_receipts.json` records the concrete witness that killed every mutant.

`results/survivors.json` is empty for the frozen suite.

## Main result

`all 12 deliberately non-equivalent governance/property mutants were detected`

This is evidence that the targeted qualification checks are sensitive to these specific wrong implementations. It is not evidence that every possible bug would be detected.

## Next phase

M4 will test metamorphic invariants under renaming, reordering, equivalent-state duplication, and irrelevant metadata.
