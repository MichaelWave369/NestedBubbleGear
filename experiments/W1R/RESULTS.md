# NBG-W1R v0.1.0 — Reviewed First Execution

## Status

**Reviewed frozen execution. Verdict: `FAIL_W1R_NO_RESIDUE`.**

This is the first valid frozen W1R execution. It is retained exactly as-run.

No rerun was used to select or repair the outcome.

## Execution provenance

- workflow: `W1R Execute Frozen Protocol`
- workflow run: `37399206259`
- run number: `1`
- branch: `main`
- implementation commit: `cedf77b921a067aabdc659d44555a6b8b8a05fd1`
- workflow conclusion: `success`
- artifact name: `nbg-w1r-unreviewed-execution-37399206259`
- artifact ZIP SHA-256: `68f35a86d23d2c8bcdc50bfad68ac6592244da47db4ad5d76ac7a8e54d9ecff6`
- inner result JSON SHA-256: `91de22b3d4c40e161282eae766283b941f25f94fd430445180d26dddf6e290d0`
- frozen `SPEC.md` SHA-256 recorded by execution: `9d943da93506326788cb195ffdf47546177c9b3bb2b3073413d30d753ab3c44e`
- frozen `EXECUTION.md` SHA-256 recorded by execution: `d2fdf091c806c735489d9f142bb19623526f1d8bfc9165caed54293d73438e87`
- implementation source SHA-256 recorded by execution: `186bd8fc91290d6902058925ca27ca06810ea70f9733a6a252bfb4228e5a214e`
- Python: `3.13.15`
- NumPy: `2.2.6`
- BLAS thread caps: 1

The ZIP digest and inner JSON digest cover different objects and are intentionally recorded separately.

## Structural validity

W1R was **not VOID**.

The static preflight passed:

[
oxed{	ext{PASS_W1R_STATIC}}
]

including:

- exactly 4,456 trainable parameters;
- no learned `K.*` parameters;
- byte-identical Keyholes for equal-(P_2) Panel-A pairs;
- identical READY Keyhole for every Panel-B route;
- frozen 48-row AH11 order;
- frozen 6/3/3/2 lineage split;
- canonical AH11 hard witness present;
- K0 unable to separate any residue-required hard pair;
- K0 unable to separate the reserved lineage pair;
- no forbidden epistemic/provenance fields in learner inputs.

The frozen controls also behaved correctly after training.

For **every seed**, the coarse-blind learned control RB had:

[
S_{m sep}^{RB}=0
]

on the Panel-A hard set and:

[
A_{m route,reserved}^{RB}=0.
]

Therefore the result is not explained by a Keyhole leak or coarse-blind control leak.

## Machine result class

The artifact reported:

[
oxed{	exttt{FAIL_W1R_NO_RESIDUE}}
]

with median-performance seed:

[
s_{m median}=2.
]

The classification is supported by the frozen precedence rule.

## Committed residue result

For **all five seeds** on Panel A:

[
C_{m hard}^{R}=1,
]

therefore:

[
S_{m sep}^{R}=0.
]

Also:

[
U_R=0.
]

The committed residue did not separate any of the 18 residue-required AH11 hard pairs.

Panel-A residue gates were closed for every seed:

[
	ext{gate_keep_rate}_A=0.
]

Thus the committed active memory used only the 32-byte deterministic Keyhole slot on Panel A.

## Reserved lineage result

For **every seed**:

[
A_{m route,reserved}^{R}=0,
]

and:

[
	ext{reserved_pair_any_gate_open}=	ext{false}.
]

The frozen `NORTH` / `SOUTH` witness was therefore not retained in committed residue.

This alone is sufficient for the frozen `FAIL_W1R_NO_RESIDUE` class.

## Held-out lineage result

The frozen held-out lineage criterion also did not pass.

| Seed | train route separation | validation | test | reserved |
|---:|---:|---:|---:|---:|
| 0 | 0.333333 | 0.000000 | 0.666667 | 0.000000 |
| 1 | 0.000000 | 0.000000 | 0.000000 | 0.000000 |
| 2 | 0.600000 | 0.666667 | 0.000000 | 0.000000 |
| 3 | 0.600000 | 0.666667 | 0.000000 | 0.000000 |
| 4 | 0.333333 | 0.000000 | 0.000000 | 0.000000 |

Because residue necessity fails earlier in the frozen precedence rule, the reviewed result class remains `FAIL_W1R_NO_RESIDUE`, not `FAIL_W1R_GENERALIZATION`.

## Continuous-training / commit mismatch

The most informative detail is that the training-time continuous residue sometimes learned separation that did **not** survive the frozen gate and int8 commit.

Frozen final training terms:

| Seed | (L_{A,m separate}) | (L_{B,m separate}) | (L_{m keep}) | committed Panel-A gate rate |
|---:|---:|---:|---:|---:|
| 0 | 0.000000 | 0.066597 | 0.045003 | 0.000000 |
| 1 | 1.000000 | 1.000000 | 0.000079 | 0.000000 |
| 2 | 0.499971 | 0.000000 | 0.055133 | 0.000000 |
| 3 | 0.833299 | 0.066659 | 0.040242 | 0.000000 |
| 4 | 0.499998 | 0.069123 | 0.039779 | 0.000000 |

In seed 0, for example:

[
L_{A,m separate}=0
]

during continuous training, yet:

[
S_{m sep}^{R}=0
]

after committed gating and quantization.

This shows that at least one frozen run found a continuous pre-commit residue representation satisfying the Panel-A separation loss, while the commit rule still discarded it.

The reviewed W1R failure is therefore more specific than “the trainable branch could not encode the distinction.”

It is:

> **The frozen W1R training/gating/commit system did not retain the learned distinction as committed active residue.**

This distinction is important and does not change the failure class.

## Revocation result

Revocation remained clean.

For every seed:

[
L_{m revoke}=0.
]

Every seed also satisfied:

- `REVOKED_BUT_STALE_RESIDUE_PRESENT` refusal;
- `STALE_RESIDUE_REFUSED` injection refusal;
- authorized rematerialization current-view alignment;
- exact ledger prefix immutability.

Thus W1R did **not** fail its governance/revocation layer.

## Control result

The controls behaved exactly as intended.

K0:

[
S_{m sep}^{K0}=0.
]

RB, for all five seeds:

[
S_{m sep}^{RB}=0,
qquad
A_{m route,reserved}^{RB}=0.
]

Therefore:

[
oxed{	ext{NO CONTROL-LEAK VOID}}
]

and:

[
oxed{	ext{NO KEYHOLE-LEAK VOID}}.
]

## Compression firewall

W1R still has:

[
B_X^A=8	ext{ bytes},
qquad
B_X^B=5	ext{ bytes},
]

with:

[
B_{m capacity}=64	ext{ bytes}.
]

No compression claim is permitted.

## Authorized reviewed result sentence

> On the frozen W1R toy ensembles, the structurally coarse Keyhole and negative controls behaved as preregistered and revocation produced zero unauthorized readouts, but the learned residue did not survive the frozen gate/commit contract: the committed residue separated none of the 18 AH11 hard pairs, every seed kept the reserved NORTH/SOUTH residue gate closed, and the reviewed result is `FAIL_W1R_NO_RESIDUE`; no compression claim is made.

## What W1R establishes

W1R establishes a finite negative result under the frozen architecture:

- forcing the Keyhole to the declared coarse observer successfully removed the W1 bypass;
- the K0 and RB controls remained unable to recover hidden distinctions;
- the current frozen learned residue/gate/commit system did not retain the required hidden distinction;
- interface revocation continued to pass.

## What W1R does not establish

W1R does not establish:

- that learned causal residue is impossible;
- that the encoder could never represent the hidden distinction;
- that a different preregistered gating or capacity architecture would fail;
- that all memory systems should use hard gates;
- storage compression;
- machine unlearning;
- secure deletion;
- biological memory;
- consciousness;
- fundamental physics.

## Next question named by the result

The next experiment should isolate the observed **continuous-to-committed residue mismatch** rather than rerunning W1R.

A new protocol may test whether a preregistered gate/commit mechanism can retain a distinction already present in the continuous residue representation while preserving the same forced coarse Keyhole, controls, revocation semantics and no-leakage rules.

That is a new experiment/version. W1R itself is closed and is not rerun.
