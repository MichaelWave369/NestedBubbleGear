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

## Observed validation outcome (GitHub CI)

The `CI` workflow [run 39162447649](https://github.com/MichaelWave369/NestedBubbleGear/actions/runs/39162447649) finished **successfully** on the E1 branch, executing the complete repository test suite and build. The E1 benchmark used Node.js v22.23.3 on Linux and emitted deterministic receipt SHA-256:

`0129f6844a8b63498b99db81d10269875238f82efcb11824ffe838d838243913`

At the **2-byte active-state cap**, the **128-history validation** report was:

| Candidate | Correct queries / 512 | Exact accuracy | Abstained queries |
| --- | ---: | ---: | ---: |
| `classical-exact` | 512 | 100% | 0 |
| `nbg-typed-interfaces` | 512 | 100% | 0 |
| `mod2-only` | 256 | 50% | 256 |
| `mod3-only` | 256 | 50% | 256 |
| `recent-events-packed` | 118 | 23.046875% | 0 |
| `recent-events-two-byte` | 118 | 23.046875% | 0 |
| `whole-interleaving` | 142 | 27.734375% | 0 |

Both exact competitors also met the mandatory 100% ceiling at four bytes. The `mod2-only` and `mod3-only` accuracies **include abstentions as incorrect**; their selected-modulus accuracy is 100%. The `whole-interleaving` candidate is an intentionally invalid causal summary and does not demonstrate a meaningful model alternative.

These are **programmed finite task results**, not independent measurements of real learned memory or practical total memory savings. The codebook figures are minimum logical payloads, not fully measured runtime allocations. The four queries per history are correlated and must not be treated as 512 independent trials. No reserved evaluation was run.

## Meaning of a pass

The exact classical and typed-interface policies can both answer all valid declared tasks with two active bytes. This is standard modular group theory. The scientific null hypothesis here is **no NBG-specific gain**.

A PASS qualifies the implementation as a **simulation-side pilot**. It is not independent evidence for NBG as a new law, learned neural memory, U(2) hardware, energy recovery, or field physics.

### Future E2 held-out gate

After model code and protocol are frozen and reviewed, perform one separate reserved evaluation at seed 203, record source commit hashes, exact per-history outcomes, history-level uncertainty, timing environment, and any failure. Do not modify the models after seeing reserved results and then reuse the same seed as unseen. Since the seed is public, this is a procedural holdout, not cryptographically blinded external validation.

**Ledger Above Ego.**
