# NBG-W1G v0.1.0 — Gate / Commit Alignment

Status: protocol freeze candidate. **Not a result. No W1G training has been run.**

Parent result: reviewed NBG-W1R v0.1.0 = \`FAIL_W1R_NO_RESIDUE\`.

W1G is a **new experiment**. It does not rerun, repair, or overwrite W1R.

## 1. Motivation

W1R successfully removed the learned-Keyhole bypass.

Its forced coarse Keyhole, K0 control, RB coarse-blind control, and revocation harness behaved as preregistered.

However, committed residue failed:

- committed Panel-A residue separated 0/18 hard pairs on every seed;
- the reserved \`NORTH\` / \`SOUTH\` residue gate remained closed on every seed;
- every seed retained \`L_revoke = 0\`.

The reviewed artifact also showed a narrower symptom.

For seed 0:

\[
L_{A,\mathrm{separate}}=0
\]

in the continuous training representation, while committed:

\[
S_{\mathrm{sep}}^R=0.
\]

Therefore W1R does not establish that the residue branch was unable to represent the hidden distinction. It establishes that the frozen **training + gate + commit** system did not retain it.

## 2. Mechanism hypothesis

W1R trained with:

\[
r_{\mathrm{train}}=p_g\,r_{\mathrm{raw}}
\]

and:

\[
L_{\mathrm{keep}}=\operatorname{mean}(p_g),
\]

then committed with:

\[
g=\mathbf 1[p_g\ge 0.5].
\]

There was no corresponding frozen norm bound or penalty on \(r_{\mathrm{raw}}\).

Therefore the W1R objective contains a potential scale mismatch: a continuous effective residue can in principle be represented with smaller \(p_g\) and larger \(r_{\mathrm{raw}}\), while the commit rule later discards any sample with \(p_g<0.5\).

W1R did **not** record enough raw internal statistics to prove that this exact scaling trajectory caused the observed failure.

W1G therefore treats it as a **mechanism hypothesis**, not a retroactive W1R result.

## 3. Questions

W1G separates two questions that W1R mixed together.

### Q1 — representation + quantized commit

> If the residue gate is forced open under the authorized FULL_STATUS task, can the same residue encoder preserve the frozen hidden distinctions after the actual int8 commit?

This is the **FORCED_OPEN** positive-control arm.

### Q2 — learned gate aligned to commit

> If training operates on the same hard gate and quantized residue used at commit, can a learned gate retain the required distinction without the W1R continuous/commit mismatch?

This is the **COMMIT_STE** candidate arm.

A positive result requires the positive control to demonstrate that residue representation + quantized commit are sufficient, and the learned commit-aligned gate to retain that result.

## 4. Frozen Keyhole

W1G inherits the W1R forced Keyhole unchanged.

### Panel A

\[
z_A=
\operatorname{pad}_{32}
(\operatorname{rowmajor}(P_2)).
\]

### Panel B

\[
z_B=
\operatorname{pad}_{32}([1]).
\]

Every Panel-B route has the same READY Keyhole.

For every Panel-A equal-\(P_2\) pair:

\[
z_i=z_j
\]

byte for byte.

Any violation yields:

~~~text
VOID_W1G_KEYHOLE_LEAK
~~~

## 5. Frozen data and splits

W1G reuses the exact W1R data grammar.

### Panel A

48 AH11 histories in frozen order:

~~~text
U = I,A,B,S
V = I,A,B,S
k = -1,0,1
~~~

with \`k\` varying fastest.

Authorized pre-collapse source:

~~~text
rowmajor(T1) || rowmajor(T2)
~~~

8 signed int8 values, padded to 64.

Residue-required hard set:

\[
\mathcal H_R=
\{(i,j):P_{2,i}=P_{2,j},\,G_i\ne G_j\}.
\]

Same-coarse/same-target collapse set:

\[
\mathcal E_R=
\{(i,j):P_{2,i}=P_{2,j},\,G_i=G_j\}.
\]

The canonical \((I,A,0)\) versus \((A,I,0)\) witness must be in \(\mathcal H_R\).

### Panel B

Frozen route split:

~~~text
R00-R05  train
R06-R08  validation
R09-R11  test
NORTH     reserved
SOUTH     reserved
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

No route name or split label enters the learner.

## 6. Shared residue encoder

Both learned W1G arms use the W1R residue encoder:

\[
E_\theta:64\rightarrow32\rightarrow32
\]

with ReLU after each linear layer, followed by:

\[
R_\phi:39\rightarrow32.
\]

Residue input:

~~~text
[h32, authority_onehot3, query_onehot4]
~~~

The shared encoder/residue parameter count is:

\[
3136+1280=4416.
\]

Fixed parameter order:

~~~text
E1.weight
E1.bias
E2.weight
E2.bias
R.weight
R.bias
~~~

The COMMIT_STE arm additionally has:

\[
G_\phi:39\rightarrow1
\]

with 40 parameters.

Therefore:

~~~text
FORCED_OPEN trainable parameters = 4416
COMMIT_STE trainable parameters  = 4456
RB_STE trainable parameters      = 4456
~~~

For each seed, the shared E/R arrays of FORCED_OPEN, COMMIT_STE and RB_STE must begin from byte-identical initialization.

COMMIT_STE and RB_STE also begin from byte-identical G arrays.

## 7. int8 quantizer

The commit quantizer remains inherited exactly:

\[
q_8(x)=
\operatorname{int8}
\left(
\operatorname{clip}
(\operatorname{rint}(x),-127,127)
\right).
\]

Ties are round-to-nearest, ties-to-even.

No learned scale, zero point, calibration pass, or post-hoc rescaling is permitted.

## 8. Quantization straight-through estimator

W1G trains on the **forward value of the actual quantizer**.

Define:

\[
q_{\mathrm{fwd}}(x)=\operatorname{float32}(q_8(x)).
\]

Backward surrogate:

\[
\frac{\partial q_{\mathrm{STE}}}{\partial x}
=
\begin{cases}
1,& -127<x<127\\
0,& \text{otherwise}.
\end{cases}
\]

The forward value is always \(q_{\mathrm{fwd}}\).

No continuous unquantized residue is used in the W1G task losses.

This removes the W1R distinction between a continuous task representation and a separately quantized commit representation.

## 9. FORCED_OPEN positive-control arm

Purpose: isolate residue representation + quantized commit from learned gating.

FORCED_OPEN has no learned gate network.

During FULL_STATUS task training/evaluation:

\[
g=1.
\]

Training residue:

\[
r_{\mathrm{train}}=
q_{\mathrm{STE}}(r_{\mathrm{raw}}).
\]

Committed residue:

\[
r_{\mathrm{commit}}=
q_8(r_{\mathrm{raw}}).
\]

Thus the task-loss forward residue and committed residue have identical numeric values.

There is no keep loss in FORCED_OPEN.

Under COMMON_ONLY revocation rematerialization, the arm still materializes with \(g=1\), but both reserved histories receive the same currently authorized source. Current memories must therefore align.

FORCED_OPEN is not a sparsity result. Its purpose is to establish whether the residue representation and int8 commit can carry the frozen task at all.

## 10. COMMIT_STE candidate arm

COMMIT_STE uses the learned W1R gate network.

Gate probability:

\[
p_g=\sigma(\ell_g).
\]

Hard forward gate:

\[
g_{\mathrm{fwd}}=
\mathbf 1[p_g\ge0.5].
\]

Backward gate surrogate:

\[
\frac{\partial g_{\mathrm{STE}}}
{\partial \ell_g}
=
p_g(1-p_g).
\]

The **forward** value used in every task loss is \(g_{\mathrm{fwd}}\), not \(p_g\).

Quantized forward residue:

\[
q=q_{\mathrm{STE}}(r_{\mathrm{raw}}).
\]

Training residue:

\[
r_{\mathrm{train}}=
g_{\mathrm{STE}}\,q.
\]

Its forward value is therefore exactly:

\[
r_{\mathrm{train,fwd}}
=
g_{\mathrm{fwd}}\,q_{\mathrm{fwd}}.
\]

Commit uses the same rule:

\[
r_{\mathrm{commit}}
=
\begin{cases}
q_8(r_{\mathrm{raw}}),&g_{\mathrm{fwd}}=1\\
0,&g_{\mathrm{fwd}}=0.
\end{cases}
\]

Therefore the W1G task-loss forward representation is numerically identical to committed residue bytes interpreted as signed integers.

This is the core W1G alignment invariant.

## 11. COMMIT_STE keep loss

Keep cost is the hard forward gate count:

\[
L_{\mathrm{keep}}
=
\operatorname{mean}(g_{\mathrm{fwd}})
\]

over exactly the 54 training rows:

~~~text
48 Panel-A rows
+ 6 Panel-B train rows
~~~

Backward uses the gate STE defined above.

Thus the forward objective charges the same binary keep decision used by commit.

The W1R soft-amplitude path:

\[
p_g\,r_{\mathrm{raw}}
\]

is not used.

## 12. RB_STE coarse-blind control

RB_STE uses the exact COMMIT_STE architecture, initialization, optimizer, hard-forward gate, quantizer STE, keep loss and step count.

Only the authorized source differs.

### Panel A RB source

The deterministic 32-byte \(P_2\) Keyhole, padded to 64.

### Panel B RB source

The deterministic READY Keyhole:

~~~text
[1] + 63 zero values
~~~

for every route.

Thus same-coarse histories receive identical RB_STE learner inputs.

RB_STE must not separate:

- any Panel-A hard pair;
- reserved \`NORTH\` / \`SOUTH\`.

A violation yields:

~~~text
VOID_W1G_CONTROL_FAILURE
~~~

## 13. K0 control

K0 remains unchanged:

~~~text
g = 0
r_commit = int8[32](0)
~~~

It must separate no hard/reserved witness.

A violation yields:

~~~text
VOID_W1G_CONTROL_FAILURE
~~~

## 14. Losses

All task losses operate on the arm's **commit-aligned forward residue**.

Distance:

\[
d^2(r_i,r_j)
=
\operatorname{mean}_k(r_{ik}-r_{jk})^2.
\]

Margin:

\[
\Delta=1.
\]

Collapse:

\[
\operatorname{COLLAPSE}(r,\mathcal P)
=
\operatorname{mean}_{(i,j)\in\mathcal P}
d^2(r_i,r_j).
\]

Separate:

\[
\operatorname{SEPARATE}(r,\mathcal P)
=
\operatorname{mean}_{(i,j)\in\mathcal P}
\max(0,1-d^2(r_i,r_j)).
\]

Panel A:

\[
L_A=
\operatorname{COLLAPSE}(r,\mathcal E_R)
+
\operatorname{SEPARATE}(r,\mathcal H_R).
\]

Panel B:

\[
L_B=
\operatorname{SEPARATE}(r,\mathcal P_{\mathrm{train}}).
\]

FORCED_OPEN:

\[
\boxed{
L_{\mathrm{OPEN}}=L_A+L_B
}
\]

COMMIT_STE:

\[
\boxed{
L_{\mathrm{STE}}=L_A+L_B+L_{\mathrm{keep}}
}
\]

RB_STE uses the same \(L_{\mathrm{STE}}\) labels but coarse-blind inputs.

Validation, test and reserved routes never enter any loss.

## 15. Optimizer

Inherited frozen optimizer:

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

No schedule, clipping, early stopping, checkpoint selection, retry, or test-driven hyperparameter change.

## 16. Metrics

All task metrics operate directly on committed residue bytes.

Panel A:

\[
C_{\mathrm{hard}}^R
=
\frac{
\#\{(i,j)\in\mathcal H_R:r_i=r_j\}
}{
|\mathcal H_R|
}.
\]

\[
S_{\mathrm{sep}}^R=1-C_{\mathrm{hard}}^R.
\]

\[
C_{\mathrm{eq}}^R
=
\frac{
\#\{(i,j)\in\mathcal E_R:r_i\ne r_j\}
}{
|\mathcal E_R|
}.
\]

For COMMIT_STE:

\[
U_R
=
\frac{
\#\{(i,j)\in\mathcal H_R:
r_i\ne r_j
\land
(g_i=1\lor g_j=1)\}
}{
|\mathcal H_R|
}.
\]

Panel B per split:

\[
A_{\mathrm{route}}^R(S)
=
1-
\frac{
\#\{\text{distinct-route pairs with equal committed residue}\}
}{
\#\{\text{distinct-route pairs}\}
}.
\]

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

Additionally for COMMIT_STE/RB_STE:

~~~text
gate_keep_rate per panel/split
reserved_pair_any_gate_open
U_R
~~~

## 17. Forward/commit identity audit

For FORCED_OPEN and COMMIT_STE, the harness must retain the task-forward residue values at the final step.

For every evaluated row, verify:

~~~text
final_training_forward_residue_as_int8
==
committed_residue_bytes
~~~

For COMMIT_STE also verify:

~~~text
final_training_forward_gate
==
committed_gate
~~~

A single mismatch yields:

~~~text
VOID_W1G_CONTRACT_DRIFT
~~~

This audit is the central difference from W1R.

## 18. Positive-control acceptance

FORCED_OPEN is evaluated first.

Choose its median-performance seed by sorting:

\[
(C_{\mathrm{hard}}^R,C_{\mathrm{eq}}^R,s)
\]

ascending and taking the middle record.

FORCED_OPEN passes its positive-control role only if:

1. median seed:

\[
S_{\mathrm{sep}}^R=1;
\]

2. median seed:

\[
A_{\mathrm{route,test}}^R=1;
\]

3. every seed:

\[
A_{\mathrm{route,reserved}}^R=1;
\]

4. every seed has:

\[
L_{\mathrm{revoke}}=0.
\]

If FORCED_OPEN fails this role, W1G cannot attribute failure specifically to learned gating.

Required class:

~~~text
FAIL_W1G_REPRESENTATION_COMMIT
~~~

## 19. COMMIT_STE acceptance

If FORCED_OPEN passes, choose COMMIT_STE median-performance seed by the same frozen ordering.

COMMIT_STE passes only if:

1. median seed:

\[
S_{\mathrm{sep}}^R=1;
\]

2. median seed:

\[
U_R=1;
\]

3. median seed:

\[
A_{\mathrm{route,test}}^R=1;
\]

4. every seed:

\[
A_{\mathrm{route,reserved}}^R=1;
\]

5. every seed has at least one open gate on the reserved pair;

6. every seed:

\[
L_{\mathrm{revoke}}=0.
\]

7. K0 and RB_STE remain unable to separate the frozen hard/reserved pairs.

If FORCED_OPEN passes but COMMIT_STE fails residue/gate retention:

~~~text
FAIL_W1G_GATE_ALIGNMENT
~~~

If the residue/gate criteria pass but held-out criteria fail:

~~~text
FAIL_W1G_GENERALIZATION
~~~

If revocation fails:

~~~text
FAIL_W1G_REVOCATION
~~~

If all pass:

~~~text
PASS_W1G_COMMIT_ALIGNED_RESIDUE
~~~

## 20. Structural VOID precedence

Before scientific classification:

~~~text
1. VOID_W1G_KEYHOLE_LEAK
2. VOID_W1G_CONTROL_FAILURE
3. VOID_W1G_CONTRACT_DRIFT
~~~

A VOID is never converted into a scientific FAIL.

## 21. Scientific precedence

Assuming no VOID:

~~~text
1. FAIL_W1G_REVOCATION
2. FAIL_W1G_REPRESENTATION_COMMIT
3. FAIL_W1G_GATE_ALIGNMENT
4. FAIL_W1G_GENERALIZATION
5. PASS_W1G_COMMIT_ALIGNED_RESIDUE
~~~

A workflow success is not itself a scientific PASS.

## 22. Revocation

Use the same frozen \`NORTH\` / \`SOUTH\` authority transition as W1R.

For each learned arm and every seed:

1. FULL_STATUS materialization;
2. append \`AUTHORIZED_ACTIVE_RESIDUE\`;
3. revoke to COMMON_ONLY without refresh;
4. stale read must refuse;
5. current authorized source must be re-read;
6. rematerialize;
7. current NORTH/SOUTH memories must align;
8. stale FULL_STATUS injection must refuse;
9. ledger must remain exact byte-prefix append-only.

Every seed requires:

\[
L_{\mathrm{revoke}}=0.
\]

W1G remains an interface-revocation test, not parameter unlearning.

## 23. Compression firewall

Source sizes remain:

\[
B_X^A=8\text{ bytes},
\qquad
B_X^B=5\text{ bytes}.
\]

Active capacity remains:

\[
B_{\mathrm{capacity}}=64\text{ bytes}.
\]

FORCED_OPEN uses 64 active payload bytes.

COMMIT_STE uses 32 or 64 depending on gate.

No W1G outcome authorizes a storage-compression claim.

## 24. Epistemic provenance boundary

W1G is a finite simulated toy experiment.

Epistemic origin, confidence, evidence ids, lineage ids, review receipts and provenance hashes are forbidden learner inputs.

A reviewed W1G result may later enter live NBG memory only through an external wrapper:

~~~text
origin = SIMULATED
retainable = true
reasoningUsable = true
actionAuthorized = false
~~~

The wrapper never rewrites the execution artifact.

## 25. No-rerun rule

The first valid frozen W1G execution is retained.

Do not rerun because:

- FORCED_OPEN fails;
- COMMIT_STE gates remain closed;
- one or more seeds fail;
- generalization is poor;
- the result contradicts the mechanism hypothesis.

Only a documented infrastructure failure in which the scientific run did not complete, or a corrupt/unreadable artifact, permits retry without a new protocol/version.

## 26. Result boundary

This file freezes a protocol only.

No W1G optimizer step is authorized until:

1. this protocol is merged;
2. a separate execution freeze is merged;
3. a separate implementation is merged green;
4. a manual main-only execution workflow is dispatched.

No result sentence is authorized by this PR.

## 27. Claim firewall

A W1G pass would support only:

> Within the frozen W1G toy architecture, residue + int8 commit can preserve the preregistered hidden distinctions when forced open, and a commit-aligned straight-through learned gate can retain those distinctions under the frozen acceptance rule.

It would **not** establish:

- a universal memory architecture;
- optimal sparsity;
- machine consciousness;
- biological memory;
- physical law;
- storage compression;
- secure deletion;
- machine unlearning.

A W1G failure remains a valid result.
