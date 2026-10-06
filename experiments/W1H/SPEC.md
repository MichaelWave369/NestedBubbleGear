# NBG-W1H v0.1.0 — Gate Retention Without Keep Pressure

Status: protocol freeze candidate. **Not a result. No W1H training has been run.**

Parent result: reviewed NBG-W1G v0.1.0 = `FAIL_W1G_GATE_ALIGNMENT`.

W1H is a **new experiment**. It does not rerun, repair, or overwrite W1G.

## 1. Motivation

W1G resolved an ambiguity left by W1R.

Its FORCED_OPEN arm showed that the frozen residue encoder plus the actual int8 commit path can preserve the preregistered hidden distinctions:

- Panel-A `S_sep_R = 1` for every seed;
- test route separation = 1 for every seed;
- reserved route separation = 1 for every seed;
- forward/commit identity passed;
- revocation remained clean.

But COMMIT_STE closed every learned gate across all five seeds.

The maximum final gate probability observed anywhere in W1G COMMIT_STE was:

[
p_{max}=0.02840813808143139,
]

far below the frozen hard-open threshold:

[
p_g ge 0.5.
]

Therefore W1G supports a narrower conclusion than “the representation cannot work.”

The residue/commit path can work when forced open.

The unresolved question is whether the **learned gate-retention objective** collapses because of its hard keep pressure, or whether the hard-gate credit path still fails even when that pressure is removed.

## 2. Single changed scientific variable

W1H changes exactly one scientific objective term relative to W1G COMMIT_STE:

[
oxed{L_{m keep} 	ext{is removed}}
]

Everything else remains frozen unless a separate W1H execution-freeze document later resolves implementation-only details without changing the scientific question.

W1H does **not** change:

- data grammar;
- train/validation/test/reserved splits;
- forced coarse Keyhole;
- source bytes;
- residue encoder architecture;
- gate architecture;
- parameter counts;
- hard gate threshold;
- gate STE;
- int8 quantizer;
- quantizer STE;
- pair losses;
- optimizer family;
- learning rate;
- seed family;
- step count;
- forward/commit identity rule;
- controls;
- revocation semantics;
- provenance firewall;
- compression firewall.

## 3. Questions

### Q1 — representation + commit sanity

> Does the same FORCED_OPEN positive-control arm still preserve the frozen hard and held-out distinctions through the actual int8 commit path?

This is an execution-sanity positive control, not a new claim about W1G.

### Q2 — gate retention without keep pressure

> If the W1G learned hard gate is trained on the same commit-aligned task losses but receives no keep-cost gradient, can it retain the preregistered hidden distinctions?

This is the W1H scientific question.

A W1H pass would show only that the frozen hard gate can retain useful residue **when sparsity pressure is absent**.

It would not establish sparse gating, optimal memory cost, or compression.

## 4. Frozen data and Keyhole

W1H inherits the W1G/W1R data grammar and forced coarse Keyhole unchanged.

### Panel A

48 AH11 histories in frozen order:

~~~text
U = I,A,B,S
V = I,A,B,S
k = -1,0,1
~~~

with `k` varying fastest.

Authorized pre-collapse residue source:

~~~text
rowmajor(T1) || rowmajor(T2)
~~~

exactly 8 signed int8 values, padded to 64.

Deterministic Keyhole:

[
z_A=operatorname{pad}_{32}(operatorname{rowmajor}(P_2)).
]

Residue-required hard set:

[
mathcal H_R=
{(i,j):P_{2,i}=P_{2,j},,G_i
e G_j}.
]

Same-coarse/same-target collapse set:

[
mathcal E_R=
{(i,j):P_{2,i}=P_{2,j},,G_i=G_j}.
]

The canonical ((I,A,0)) versus ((A,I,0)) witness must remain in (mathcal H_R).

### Panel B

Frozen route split:

~~~text
R00-R05  train
R06-R08  validation
R09-R11  test
NORTH     reserved
SOUTH     reserved
~~~

Every route uses the same deterministic READY Keyhole:

~~~text
zB = int8[1] || int8[31](0)
~~~

Route bits remain MSB-first:

~~~text
0 -> -1
1 -> +1
~~~

Authority projections remain:

~~~text
COMMON_ONLY -> [1, 0,  0,  0,  0]
TRIAGE      -> [1, b3, b2, 0,  0]
FULL_STATUS -> [1, b3, b2, b1, b0]
~~~

Any Keyhole distinction among same-coarse Panel-A pairs or among Panel-B routes yields:

~~~text
VOID_W1H_KEYHOLE_LEAK
~~~

## 5. Architecture

The shared residue encoder remains:

[
E_	heta:64ightarrow32ightarrow32
]

with ReLU after each linear layer, followed by:

[
R_phi:39ightarrow32.
]

Residue head input:

~~~text
[h32, authority_onehot3, query_onehot4]
~~~

Shared E/R trainable parameters:

~~~text
4416
~~~

The learned gate remains:

[
G_phi:39ightarrow1
]

with 40 parameters.

Therefore:

~~~text
FORCED_OPEN         = 4416 trainable parameters
NO_KEEP_STE         = 4456 trainable parameters
RB_NO_KEEP_STE      = 4456 trainable parameters
~~~

Per seed, shared E/R initialization bytes must be identical across all three arms.

Per seed, G initialization bytes must be identical between NO_KEEP_STE and RB_NO_KEEP_STE.

There are no learned `K.*` parameters.

## 6. Quantizer and hard gate

The forward quantizer remains:

[
q_8(x)=
operatorname{int8}
left(
operatorname{clip}
(operatorname{rint}(x),-127,127)
ight).
]

Ties are round-to-nearest, ties-to-even.

Task-forward numeric residue uses the actual quantized value:

[
q_{m fwd}(x)=operatorname{float32}(q_8(x)).
]

Quantizer backward remains the strict STE:

[
rac{partial q_{m STE}}{partial x}
=
egin{cases}
1,&-127<x<127\
0,&	ext{otherwise}.
end{cases}
]

For learned-gate arms:

[
p_g=sigma(ell_g)
]

and hard forward gate:

[
g_{m fwd}=mathbf 1[p_gge0.5].
]

The threshold remains inclusive.

Gate backward remains:

[
rac{partial g_{m STE}}{partial ell_g}
=
p_g(1-p_g).
]

No temperature, Gumbel noise, annealing, slope multiplier, alternate threshold, or post-hoc calibration is permitted.

## 7. Arms

### FORCED_OPEN

Same positive-control role as W1G.

No learned gate parameters.

For authorized FULL_STATUS task rows:

[
g_{m fwd}=1.
]

Task-forward residue:

[
r_{m task}=q_{m fwd}(r_{m raw}).
]

Committed residue:

[
r_{m commit}=q_8(r_{m raw}).
]

There is no keep loss.

### NO_KEEP_STE

This is the W1H scientific arm.

It is identical to W1G COMMIT_STE except that `L_keep` is absent.

Task-forward residue:

[
r_{m task}=g_{m fwd},q_{m fwd}(r_{m raw}).
]

Commit:

[
r_{m commit}=
egin{cases}
q_8(r_{m raw}),&g_{m fwd}=1\
0,&g_{m fwd}=0.
end{cases}
]

The task-forward gate and residue must remain numerically identical to the committed gate and residue.

### RB_NO_KEEP_STE

Coarse-blind learned control.

Architecture, initialization, optimizer, hard gate, quantizer, task losses and **absence of keep loss** are identical to NO_KEEP_STE.

Only source differs.

Panel A source:

~~~text
deterministic P2 Keyhole padded to 64
~~~

Panel B source:

~~~text
int8[1] || int8[63](0)
~~~

It must separate no Panel-A hard pair and no reserved NORTH/SOUTH pair.

A violation yields:

~~~text
VOID_W1H_CONTROL_FAILURE
~~~

### K0

Unchanged zero-residue control:

~~~text
g = 0
r_commit = int8[32](0)
~~~

It must separate no hard or reserved witness.

## 8. Losses

All task losses operate on commit-aligned forward residue.

Distance:

[
d^2(r_i,r_j)=
operatorname{mean}_k(r_{ik}-r_{jk})^2.
]

Margin:

[
Delta=1.
]

Collapse:

[
operatorname{COLLAPSE}(r,mathcal P)
=
operatorname{mean}_{(i,j)inmathcal P}
d^2(r_i,r_j).
]

Separate:

[
operatorname{SEPARATE}(r,mathcal P)
=
operatorname{mean}_{(i,j)inmathcal P}
max(0,1-d^2(r_i,r_j)).
]

Panel A:

[
L_A=
operatorname{COLLAPSE}(r,mathcal E_R)
+
operatorname{SEPARATE}(r,mathcal H_R).
]

Panel B:

[
L_B=
operatorname{SEPARATE}(r,mathcal P_{m train}).
]

For all three trainable arms:

[
oxed{
L=L_A+L_B
}
]

There is **no** `L_keep` term in W1H.

There is no replacement sparsity term, gate entropy term, open-gate reward, bias term, regularizer, reconstruction loss, decoder loss, or manual gate supervision.

Validation, test and reserved routes never enter any loss.

## 9. Optimizer

Inherited unchanged:

~~~text
seeds        = 0,1,2,3,4
steps        = 500
full_batch   = true
dtype        = fp32
AdamW
lr           = 1e-3
betas        = (0.9,0.999)
eps          = 1e-8
weight_decay = 0
~~~

No schedule, clipping, early stopping, checkpoint selection, reroll, seed replacement, or held-out-driven tuning.

## 10. Metrics

All scientific task metrics use committed residue bytes.

Panel A:

[
C_{m hard}^R
=
rac{
#{(i,j)inmathcal H_R:r_i=r_j}
}{
|mathcal H_R|
}
]

[
S_{m sep}^R=1-C_{m hard}^R
]

[
C_{m eq}^R
=
rac{
#{(i,j)inmathcal E_R:r_i
e r_j}
}{
|mathcal E_R|
}
]

For learned-gate arms:

[
U_R
=
rac{
#{(i,j)inmathcal H_R:
r_i
e r_j
land
(g_i=1lor g_j=1)}
}{
|mathcal H_R|
}.
]

Panel B per split:

[
A_{m route}^R(S)
=
1-
rac{
#{	ext{distinct-route pairs with equal committed residue}}
}{
#{	ext{distinct-route pairs}}
}.
]

Report for every arm/seed:

~~~text
C_hard_R
C_eq_R
S_sep_R
A_route_train_R
A_route_validation_R
A_route_test_R
A_route_reserved_R
G_heldout_R
mean_B_used per split
~~~

Additionally for learned-gate arms:

~~~text
p_gate_min / mean / max per panel/split
gate_keep_rate per panel/split
reserved_pair_any_gate_open
U_R
q8_saturation_fraction
q8_zero_fraction
r_raw_abs_mean
r_raw_abs_max
~~~

These diagnostics do not alter acceptance.

## 11. Forward/commit identity audit

Final scientific evaluation must use a fresh no-gradient forward on the post-step-500 parameter state.

For every evaluated row:

FORCED_OPEN:

~~~text
int8(final_task_forward_residue)
==
committed_residue
~~~

NO_KEEP_STE / RB_NO_KEEP_STE:

~~~text
final_task_forward_gate
==
committed_gate
~~~

and:

~~~text
int8(final_task_forward_residue)
==
committed_residue
~~~

A single mismatch yields:

~~~text
VOID_W1H_CONTRACT_DRIFT
~~~

## 12. Positive-control acceptance

FORCED_OPEN is evaluated first.

Choose its median-performance seed by sorting:

[
(C_{m hard}^R,C_{m eq}^R,s)
]

ascending and taking index 2.

FORCED_OPEN passes only if:

1. median `S_sep_R = 1`;
2. median `A_route_test_R = 1`;
3. every seed `A_route_reserved_R = 1`;
4. every seed `L_revoke = 0`.

Otherwise:

~~~text
FAIL_W1H_REPRESENTATION_COMMIT
~~~

## 13. NO_KEEP_STE acceptance

If FORCED_OPEN passes, choose the NO_KEEP_STE median-performance seed using the same frozen ordering.

Gate-retention success requires:

1. median `S_sep_R = 1`;
2. median `U_R = 1`;
3. every seed has `reserved_pair_any_gate_open = true`;
4. every seed `L_revoke = 0`.

If any of 1–3 fails:

~~~text
FAIL_W1H_GATE_RETENTION_WITHOUT_KEEP
~~~

If gate-retention succeeds, held-out generalization additionally requires:

1. median `A_route_test_R = 1`;
2. every seed `A_route_reserved_R = 1`.

If held-out criteria fail:

~~~text
FAIL_W1H_GENERALIZATION
~~~

If all criteria pass:

~~~text
PASS_W1H_GATE_RETENTION_WITHOUT_KEEP
~~~

This PASS would not authorize a sparsity or compression claim because the experiment removed the keep objective entirely.

## 14. Structural precedence

Before scientific classification:

~~~text
1. VOID_W1H_KEYHOLE_LEAK
2. VOID_W1H_CONTROL_FAILURE
3. VOID_W1H_CONTRACT_DRIFT
~~~

A VOID is never converted into a scientific FAIL.

## 15. Scientific precedence

Assuming no VOID:

~~~text
1. FAIL_W1H_REVOCATION
2. FAIL_W1H_REPRESENTATION_COMMIT
3. FAIL_W1H_GATE_RETENTION_WITHOUT_KEEP
4. FAIL_W1H_GENERALIZATION
5. PASS_W1H_GATE_RETENTION_WITHOUT_KEEP
~~~

Revocation failure has first scientific precedence.

A workflow success is not itself a scientific PASS.

## 16. Revocation

Use the same frozen NORTH/SOUTH authority transition and stale-memory checks as W1G.

For every seed and each scientific arm:

1. materialize NORTH and SOUTH under FULL_STATUS;
2. append authorized active-memory receipt;
3. revoke to COMMON_ONLY without refresh;
4. stale read must refuse;
5. re-read currently authorized source;
6. rematerialize;
7. current NORTH/SOUTH memories must align;
8. stale FULL_STATUS injection must refuse;
9. ledger must remain exact byte-prefix append-only.

Every scientific-arm seed requires:

[
L_{m revoke}=0.
]

W1H remains an interface-revocation test, not parameter unlearning.

## 17. Compression firewall

Frozen source sizes remain:

[
B_X^A=8	ext{ bytes},
qquad
B_X^B=5	ext{ bytes}.
]

Active capacity remains:

[
B_{m capacity}=64	ext{ bytes}.
]

No W1H result authorizes a storage-compression claim.

A gate staying open more often because keep pressure was removed is not evidence of efficient memory.

## 18. Historical W1G comparison boundary

The reviewed W1G execution may be cited as historical motivation.

Its observed COMMIT_STE result is not rerun as a W1H arm and is not used to tune W1H after execution.

W1H acceptance depends only on the preregistered W1H criteria above.

After W1H is executed, comparing the reviewed W1H result with reviewed W1G may support a **scoped cross-experiment interpretation** of whether removing keep pressure changed gate retention.

It may not be used to rewrite either experiment.

## 19. Epistemic provenance boundary

W1H is a finite simulated toy experiment.

Epistemic origin, confidence, evidence ids, review receipts, lineage ids, provenance hashes and authority-history metadata remain forbidden learner inputs.

A reviewed result may later enter live NBG memory only through an external wrapper:

~~~text
origin = SIMULATED
retainable = true
reasoningUsable = true
actionAuthorized = false
~~~

The wrapper never rewrites the raw execution artifact.

## 20. No-rerun rule

The first valid frozen W1H execution is retained.

Do not rerun because:

- gates remain closed;
- gates open too often;
- FORCED_OPEN fails;
- one seed is ugly;
- generalization fails;
- the result disagrees with the keep-pressure hypothesis.

Retry without a new protocol/version is allowed only for documented infrastructure failure where scientific execution did not complete, or a provably corrupt/unreadable artifact.

## 21. Result boundary

This file freezes the scientific protocol only.

No W1H optimizer step is authorized until:

1. this protocol is merged;
2. a separate W1H execution freeze is merged;
3. a separate implementation is merged green;
4. a manual main-only W1H workflow is dispatched.

No result sentence is authorized by this PR.

## 22. Claim firewall

A W1H pass would support only:

> Within the frozen W1H toy architecture, the commit-aligned learned hard gate retained the preregistered hidden distinctions when the W1G keep-cost term was removed.

A W1H failure would support only the corresponding finite negative result under the frozen no-keep objective.

Neither outcome would establish:

- a universal gating law;
- optimal sparsity;
- storage compression;
- machine consciousness;
- biological memory;
- physical law;
- secure deletion;
- machine unlearning.
