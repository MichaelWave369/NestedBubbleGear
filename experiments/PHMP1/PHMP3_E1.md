# PHMP-3 E1 | Bounded streaming-memory comparison

**Status:** train/validation synthetic benchmark; reserved held-out split remains untouched. **Origin:** `SIMULATED`. **Authority:** `NONE`.

This stage implements the frozen [PHMP-3 E0 protocol](PHMP3_PROTOCOL.md). The purpose is to test a *known* sufficient-statistic ceiling against deliberately lossy representations, not to show that an NBG-inspired memory is better than classical mathematics.

## Run

```sh
npm run test:phmp3-memories
node scripts/test_phmp3_memories.mjs --out phmp3-e1-local.json
```

The `--out` form creates a new JSON receipt and refuses to overwrite an existing path. The digest is calculated from deterministic data, source hashes, and query outcomes. Unstable wall-clock/RSS telemetry is printed separately and excluded from replay-identical receipts.

**E1 does not call `generateSplit('holdout')`**. It generates only train (256 histories) and validation (128 histories), and answers each history's four post-commit queries. E1's model designs and assertions were formulated from the public protocol and exact algebra; no tuning against the reserved evaluation occurred.

## Candidate policies

| Candidate | Minimum budget | Actual information bytes | What it remembers | What it can answer |
| --- | ---: | ---: | --- | --- |
| `classical-exact` | 2 | 2 | Two independent products in `SL(2,Z/6Z)` | All four queries exactly |
| `nbg-typed-interfaces` | 2 | 2 | **Exactly the same sufficient pair** of typed connector products | Same answers; this is a mathematical tie, not an independent new algorithm |
| `mod2-only` | 1 | 1 | Two lane products in `SL(2,F2)`, jointly encoded in 36 possible states | Exact mod-2 queries; explicitly abstains on mod-3 |
| `mod3-only` | 2 | 2 | Two lane products in `SL(2,F3)` | Exact mod-3 queries; explicitly abstains on mod-2 |
| `recent-events-packed` | 1 | 1 | Only the most recent event token on each lane | Lossy approximation |
| `recent-events-two-byte` | 2 | 2 | Most recent token of each lane in separate bytes | Same lossy information, larger encoding |
| `whole-interleaving` | 2 | 1 + 1 padding | A single aggregate product ignoring lane identity | Intentionally invalid under arbitrary legal interleavings |

All candidates receive the same prevalidated event stream and must commit an actual `Uint8Array` of exactly 1, 2 or 4 bytes **before** the late-query label is disclosed. A model is included only when its declared minimum capacity fits the budget. At higher budgets, buffers are padded; actual information bytes are separately reported. Model query functions read only the committed byte array and static mathematical constants, not hidden histories or the task oracle.

The `classical-exact` and `nbg-typed-interfaces` paths intentionally use **the same underlying implementation**, rather than feigning algorithmic independence. Any equal score is a tie by construction.

## Fixed acceptance and safeguards

- The two-byte `classical-exact` baseline must achieve 100% on **both** train and validation, separately for mod 2 and mod 3. Its modulo-6 lane states have 144 possibilities, stored as one byte each.
- The typed-interfaces candidate must match the exact baseline, including no prohibited post-commit writes.
- Mod-2-only must get 100% on its selected modulus and explicitly abstain on every mod-3 query; analogously for mod-3-only.
- Enforce exact buffer capacity; no append-only private growing event log, no scoring before commit, no query-time access to `row.events`.
- Check native interleaving invariance, deliberate sensitivity of the invalid whole-interleaving summary, and non-constant label-shuffle controls.
- Provide accuracy and abstention separately by budget, modulus, and regime, plus mean/min per-history accuracy. Four queries from the same history are **not** counted as independent observations.
- Report model source and fixture-source byte sizes. Lookup-table `minimumCodebookPayloadBytes` reports only a **lower bound** (4 bytes of matrix entries + 1 index byte per finite-group state). Runtime JS Maps, strings, program interpreter overhead and execution RSS are **not fully byte-attributed to each individual model**. E1 therefore cannot substantiate a total-resource superiority claim.

## Meaning of a pass

The exact classical and typed-interface policies can both answer all valid declared tasks with two active bytes. This is standard modular group theory. The scientific null hypothesis here is **no NBG-specific gain**.

A PASS qualifies the implementation as a **simulation-side pilot**. It is not independent evidence for NBG as a new law, learned neural memory, U(2) hardware, energy recovery, or field physics.

### Future E2 held-out gate

After model code and protocol are frozen and reviewed, perform one separate reserved evaluation at seed 203, record source commit hashes, exact per-history outcomes, history-level uncertainty, timing environment, and any failure. Do not modify the models after seeing reserved results and then reuse the same seed as unseen. Since the seed is public, this is a procedural holdout, not cryptographically blinded external validation.

**Ledger Above Ego.**
