# NBG-W1G v0.1.0 — Reviewed First Execution

## Status

**Reviewed frozen execution. Verdict: `FAIL_W1G_GATE_ALIGNMENT`.**

This is the first valid frozen W1G execution. It is retained exactly as-run.

No rerun was used to select or repair the outcome.

## Execution provenance

- workflow: `W1G Execute Frozen Protocol`
- workflow run: `37411224406`
- run number: `1`
- branch: `main`
- implementation commit: `7f46d712f6bc0d1f927e62eebce5fbe02794b637`
- workflow conclusion: `success`
- artifact name: `nbg-w1g-unreviewed-execution-37411224406`
- artifact ZIP SHA-256: `28b71c9e8de12f372d1d8c577b237d316a2a707cd907d4e3a9b49dc717085039`
- inner result JSON SHA-256: `982a76adda9bd80a29d604f34c28b4394c163d36ff663d6aa9e724991c5c0d5d`
- frozen `SPEC.md` SHA-256 recorded by execution: `143f6268ae031bac04c81154e1e6a41ee909d68fe430c45f76ec0378fcff56b6`
- frozen `EXECUTION.md` SHA-256 recorded by execution: `461062d94aac9dca2b3ac07851284a065853d718e6646a265f0895ef510eb3ed`
- implementation source SHA-256 recorded by execution: `c81cd47be5acffe4dcfb9cc65ac3edbbb08025787154edb417e7fd73c9182c41`
- Python: `3.13.15`
- NumPy: `2.2.6`
- BLAS thread caps: 1

The artifact ZIP digest and inner JSON digest cover different objects and were independently rechecked during review.

## Structural validity

W1G was **not VOID**.

The static preflight reported:

`PASS_W1G_STATIC`

All frozen structural checks passed, including:

- 4,416 trainable parameters for FORCED_OPEN;
- 4,456 trainable parameters for COMMIT_STE;
- 4,456 trainable parameters for RB_STE;
- no learned `K.*` parameters;
- frozen 48-row AH11 order;
- frozen 6/3/3/2 lineage split;
- byte-identical coarse Keyholes where required;
- canonical hard witness membership;
- forbidden provenance/identity fields absent from learner inputs;
- K0 unable to separate the frozen hard or reserved witnesses;
- byte-identical shared E/R initialization across arms;
- byte-identical G initialization between COMMIT_STE and RB_STE;
- frozen hard-gate and quantizer STE semantics.

Every final forward/commit identity audit also passed for every evaluated row in every arm.

Therefore the run is not a Keyhole-leak, control-failure, or contract-drift VOID.

## Machine candidate and reviewed class

The raw artifact remained:

- `status = UNREVIEWED_EXECUTION`
- `result_language_authorized = false`
- `compression_claim_authorized = false`

and reported machine candidate:

`FAIL_W1G_GATE_ALIGNMENT`

Independent review of the frozen precedence rule confirms the same class.

FORCED_OPEN median seed:

`1`

COMMIT_STE median seed:

`2`

## FORCED_OPEN positive-control result

FORCED_OPEN passed the preregistered representation + int8 commit role.

For all five seeds:

- `S_sep_R = 1`
- `A_route_test_R = 1`
- `A_route_reserved_R = 1`
- `L_revoke = 0`
- gate rate = 1 by construction
- final task-forward residue matched committed int8 residue exactly

Panel-A same-target nonminimality remained seed-dependent:

| Seed | C_eq_R |
|---:|---:|
| 0 | 0.543860 |
| 1 | 0.175439 |
| 2 | 0.000000 |
| 3 | 0.192982 |
| 4 | 0.122807 |

Thus W1G demonstrates that, in this frozen toy architecture, the residue encoder plus actual int8 commit **can** retain the preregistered hidden distinctions when the gate is forced open.

It does not demonstrate that the representation is minimal.

## COMMIT_STE result

COMMIT_STE failed the learned-gate alignment criterion cleanly and uniformly.

For **all five seeds**:

- `S_sep_R = 0`
- `U_R = 0`
- `A_route_train_R = 0`
- `A_route_validation_R = 0`
- `A_route_test_R = 0`
- `A_route_reserved_R = 0`
- Panel-A hard gate keep rate = 0
- train / validation / test / reserved gate keep rate = 0
- `reserved_pair_any_gate_open = false`
- mean committed payload use = 32 bytes

The largest final COMMIT_STE gate probability observed anywhere across Panel A and all Panel-B splits was:

`0.02840813808143139`

which is far below the frozen hard-open threshold `p >= 0.5`.

The learned gate therefore closed on every evaluated row.

The median COMMIT_STE seed 2 has:

- `S_sep_R = 0`
- `U_R = 0`

so the frozen scientific precedence stops at:

`FAIL_W1G_GATE_ALIGNMENT`

The later generalization class is not used, even though held-out route separation is also zero, because gate-alignment failure occurs first.

## What changed relative to W1R

W1R left an ambiguity: continuous residue sometimes separated the hidden state, but the distinction did not survive gating and commit.

W1G removes the representation/commit part of that ambiguity.

FORCED_OPEN used the actual int8 task-forward value and passed the hard and held-out witnesses.

COMMIT_STE used the same commit-aligned residue representation, but the learned hard gate collapsed closed on every seed.

The supported interpretation is therefore narrower and stronger than the W1R result:

> Under the frozen W1G objective and architecture, int8 committed residue was sufficient when forced open, while the learned commit-aligned gate failed to retain that residue.

This does **not** show that every learned gating method must fail.

## Negative controls

The controls behaved as preregistered.

K0:

- `S_sep_K0 = 0`
- reserved NORTH/SOUTH not separated

RB_STE for every seed:

- `S_sep_R = 0`
- `A_route_reserved_R = 0`

The coarse-blind learned control did not manufacture hidden-state separation.

## Forward / commit identity

All FORCED_OPEN, COMMIT_STE and RB_STE final-evaluation identity audits passed.

For every audited row:

- final task-forward gate matched committed gate where applicable;
- final task-forward residue matched committed residue exactly;
- mismatch counts were zero.

This matters because W1G was designed specifically to eliminate a training-forward / commit mismatch as an explanation.

## Revocation

Revocation remained clean for every scientific arm and every seed.

For FORCED_OPEN and COMMIT_STE:

- `L_revoke = 0`
- stale read refused;
- stale injection refused;
- authorized rematerialization aligned to the current view;
- ledger prefix immutability held.

W1G did not fail the governance/revocation layer.

## Compression firewall

W1G still has:

- Panel A `B_X = 8 bytes`
- Panel B `B_X = 5 bytes`
- active capacity = 64 bytes

COMMIT_STE used 32 bytes only because its learned residue gate was closed.

That is **not** a storage-compression result.

No compression claim is authorized.

## Authorized reviewed result sentence

> On the frozen W1G toy ensembles, the forced-open residue arm preserved the preregistered AH11 hard distinctions and held-out lineage distinctions through the actual int8 commit path with zero unauthorized readouts, while the commit-aligned learned gate closed on every evaluated row across all five seeds; controls and forward/commit identity audits passed, the reviewed result is `FAIL_W1G_GATE_ALIGNMENT`, and no compression claim is made.

## What W1G establishes

W1G establishes a finite frozen toy-model result:

- the forced coarse Keyhole remained structurally clean;
- actual int8 committed residue can carry the preregistered hidden distinctions in the frozen FORCED_OPEN arm;
- the coarse-blind learned control cannot recover those distinctions;
- the frozen COMMIT_STE learned gate closes rather than retaining the useful residue;
- interface revocation remains clean;
- forward and commit semantics are aligned exactly.

## What W1G does not establish

W1G does not establish:

- that learned gating is impossible;
- that every keep-cost objective collapses;
- that a different separately frozen gate objective would succeed;
- optimal sparsity;
- storage compression;
- machine unlearning;
- secure deletion;
- biological memory;
- consciousness;
- fundamental physics.

## Next question named by the result

Do not rerun W1G.

A new experiment/version may isolate the **gate-retention objective itself** while holding fixed the forced coarse Keyhole, commit-aligned int8 residue path, negative controls, revocation semantics and provenance firewall.

That successor must be frozen before execution. W1G itself is closed.
