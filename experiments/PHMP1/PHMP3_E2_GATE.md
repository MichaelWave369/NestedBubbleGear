# PHMP-3 E2 | Gated first-pass reserved evaluation

**Status: E2_SCORER_PREPARED / RESERVED_NOT_YET_SCORED.** **Origin: SIMULATED. Authority: NONE.**

This adds an explicit, opt-in held-out scorer after merged E1 (#132). The benchmark [protocol](PHMP3_PROTOCOL.md), train/validation [E1 comparison](PHMP3_E1.md), candidate implementations, data generator, and scoring task definitions are **unchanged**.

## Freeze invariants

The E2 runner verifies these E1 source Git blobs **before** generating any reserved history:

| Frozen path | Git blob SHA-1 |
| --- | --- |
| `scripts/phmp3_contract.mjs` | `f7f3a3a9a2a02f760a138839016a48b3d791fb9e` |
| `scripts/phmp3_memories.mjs` | `94f359dac804865ae7d3e9ab71238615c1305adc` |
| `scripts/test_phmp3_memories.mjs` | `f43fe2fe4ad355d58b8d16cbdc5791427e51b177` |
| `experiments/PHMP1/PHMP3_PROTOCOL.md` | `1509182be329a2f52d94efbce2793ee6e6c5786d` |

E1 source baseline: merge of [PR #132](https://github.com/MichaelWave369/NestedBubbleGear/pull/132), SHA `ad4ba96eebb006e088cb8704a4f96ab430785826`.

If a pinned file has changed, the scorer **refuses reserved evaluation**. The E2 runner includes no tuning or adaptive candidate selection.

## Default CI never scores held-out data

```sh
npm run test:phmp3-e2-gate
npm test
```

Only `--verify-freeze` is used by normal CI. This checks the fingerprints and rejects incomplete/accidental scoring commands; it **does not** call `generateSplit('holdout')`.

## Explicit one-time evaluation after code review and merge

Review the E2 runner and freeze its source commit **first**. Run the scorer intentionally with:

```sh
npm run phmp3:e2:reserved -- --execute-reserved --ack-once --out phmp3-e2-reserved-20261018.json
```

It refuses to overwrite a file, produces one canonical SHA-256 result receipt plus separate timing metadata, and prints that the previously reserved split has been *spent*.

The public reserved seed is 203 and the cohort is **512 histories / 2,048 late queries per model**. Each model is evaluated at applicable 1/2/4-byte capacities. Results are by memory budget and query modulus; the 95% bootstrap interval resamples **histories**, not individual correlated queries, using a fixed resampling seed 1099 and 1,000 draws.

The exact two-byte conventional baseline **must be 100%** on all reserved queries. The NBG-inspired typed-interface version intentionally retains the **same sufficient statistic** and must tie. Any baseline failure invalidates the model comparison, and all failures must be retained.

## Research status

No E2 outcome has been observed, inferred, or claimed in this PR. Scoring after reviewing the source will convert the reserved split into a **used evaluation set**. Do not adjust E1 models and then reuse seed 203 as though it were fresh. For any future modified algorithm or scoring code, prepare a new independently selected reserved dataset.

This remains a toy software study. The two-byte group-state solution already attains the mathematical accuracy ceiling for these exact tasks. A tie supports only equivalence on these tests, not a new NBG-specific advantage.

Because the total JavaScript runtime and codebook allocation are not isolated for each candidate, this study cannot claim improved total memory or energy efficiency.

The optional [classical optics Keyhole note](OPTICAL_KEYHOLES_NOTE.md) is **prospective inspiration** and must not modify PHMP-3's frozen test.

**Ledger Above Ego.**
