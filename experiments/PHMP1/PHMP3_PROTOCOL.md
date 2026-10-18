# PHMP-3 E0 | Causal Transport Memory benchmark contract

**Status:** prospective benchmark protocol / scaffold qualification only. **Origin:** SIMULATED. **Authority:** NONE.
**No held-out model scoring is performed in this PR.** Existing AH and PHMP frozen materials remain immutable.

## Scientific question

Given a stream of two independently ordered, interleaved connector histories (typed `lane=0` and `lane=1`), what bounded state suffices to answer a future question about the correctly transported **native AH10 three-plaquette outer loop**?

The stream consists of `{lane, seq, token}` events. Within each lane, `seq` must strictly increase from zero. There is *no causal precedence between lanes*, only their respective internal orders. The interleaving order cannot be treated as part of the physical/mathematical target. This is a **toy causal partial order**, not a relativistic metric.

Tokens are `A,B,S,a,b,s` with lowercase representing the exact inverses of the corresponding native `SL(2,Z)` matrices. The two connector products `T1` and `T2` are accumulated in lane-local order.

The native oracle is

```text
A = [[1,1],[0,1]]; B = [[1,0],[1,1]]; C = A B
G = T1 T2 C T2^-1 B T1^-1 A
```

with matrix multiplication in the frozen row-vector traversal convention. This is the original AH10 transport formula, not a substitute U(2) process.

**Late query:** after a model commits its bounded state, disclose `p in {2,3}` and `v in {(1,0),(0,1)}`. Target is the exact two-component **row-vector** product `v (G mod p)`. Four query variants per history are scored. Queries are withheld until the final commitment, so a model cannot tailor earlier retention to a revealed question.

## Fixed synthetic data/controls

The independent generator and oracle live in [scripts/phmp3_contract.mjs](../../scripts/phmp3_contract.mjs). E0 fixes these values:

| Variable | Contract |
| --- | --- |
| PRNG | LCG: `state = (1664525*state + 1013904223) mod 2^32` |
| Train | seed 201, 256 histories |
| Validation | seed 202, 128 histories |
| Reserved evaluation | seed 203, 512 histories; **not generated or scored in E0 CI** |
| Lane lengths | 5–10 generator tokens, with optional adjacent inverse controls |
| Regimes | random, adjacent inverse-pair, and order-inverse-pair constructions |
| Query family | exactly 2 moduli × 2 basis vectors per history |
| Active-state budgets | **1, 2, 4 bytes** for every competing streaming implementation |
| Split and input rule | no cross-split tuning using reserved evaluation results |

The public reserved seed is **not cryptographically blinded**, and merely reserving it does not establish independence from future human/AI experimentation. Once scored, any subsequent model change requires a **new** independently reserved evaluation rather than rescoring seed 203 as if still unseen.

The present PR tests train/validation *contract invariants*, not model accuracy. Existing canonical frozen AH test hashes and results are not rewritten.

## Mandatory comparison policies (to implement and freeze before first reserved evaluation)

1. **Classical exact group-state baseline:** store each lane's product in `SL(2,Z/6Z)`, canonically encoded. Because `|SL(2,F2)|=6`, `|SL(2,F3)|=24`, and CRT gives 144 states per lane, a two-lane product fits in **two bytes** (144×144 = 20,736 possible joint states). This conventional finite-state implementation *should answer every query exactly* if coded correctly. Its correctness is a **mandatory harness sanity check**, not an NBG result.
2. **Conventional lossy memories:** two-byte last-event and whole-interleaving summaries; a same-budget fixed group/sketch baseline.
3. **Single-modulus quotient memory:** p=2-only or p=3-only, with the other query's ignorance/abstention explicitly scored. These are controlled lossy comparators, not secretly disqualified.
4. **NBG-inspired connector-preserving memory:** preserve typed interface/connector state and causal order under the same cap, with **no privileged oracle, query, or hidden state**. If it uses the same sufficient group state as baseline #1, their tie is acknowledged.

Compare every candidate at **the same** active-state byte budget. Learned parameters, precomputed lookup tables, and model constants must be enumerated separately as total storage, and their read/compute overhead measured. A giant free lookup table is not a claimed memory saving. Store no growing private event log or uncounted history. Measure total execution time and end-to-end resident footprint separately from the hard streaming active-state budget.

## Frozen scoring/acceptance

- **Primary metric:** exact two-component query accuracy, reported by budget and query modulus, averaged by history (four queries per history). Do not compare query entries as four statistically independent samples.
- **Secondary:** task-specific abstentions, worst-regime accuracy, bytes of model/lookup codebook, wall time with stated machine, and memory allocation. Never call a mathematical operation physical energy recovery.
- **Minimum:** 2-byte conventional full group-state baseline must get **100%** on valid synthetic queries, otherwise harness or representation is wrong and model comparison is **INVALID**.
- **Controls:** within-lane reorder can change outcomes; pure cross-lane interleavings must not change the oracle; adjacent inverse insertions preserve the native product; remove/alter a connector to expose a wrong local-to-global reconstruction; randomly permute labels as a leakage check; reject invalid, duplicate or out-of-order lane `seq` values.
- **Failure criteria:** any over-budget active memory, lookahead at query before commit, hidden model-specific oracle cache, changing protocol after held-out observations, unlabeled resource overhead, or a claimed new advantage when an equally budgeted classical baseline ties.
- **Evidence:** immutable source commit, protocol revision, program/runtime versions, train/validation and eventual held-out digests, deterministic receipt, controls and all failed cases. Statistical uncertainty should be estimated by history-level resampling with independent follow-up seeds, not by treating four queries on one history as independent observations.

## Explicit nonclaims

This benchmark cannot establish new physics, gravity, real Dirac-spinor storage, quantum protection, physical power recovery or any universal NBG neural-memory advantage. It tests which **bounded representations** preserve enough typed connector history for a specific declared family of delayed queries. Under the current tasks, classical group-state sufficiency puts a known ceiling on any possible accuracy improvement.

## E0 reproduction

```sh
npm run test:phmp3-contract
node scripts/test_phmp3_contract.mjs --out phmp3-e0-receipt.json
```

Both commands must run **without generating or scoring the reserved split**. `--out` creates a new file only and refuses overwrite. Implement actual candidate implementations in a later additive PR, freeze their configurations, then separately perform a reserved evaluation. **Ledger Above Ego.**
