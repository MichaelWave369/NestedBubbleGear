# NBG-W1G v0.1.0 — Execution Freeze

Status: implementation contract only. No W1G training is authorized by this file until this execution freeze is merged to \`main\`.

This document resolves implementation degrees of freedom left open by \`SPEC.md\`. It does not change the W1G scientific question, frozen data, forced coarse Keyhole, arm definitions, controls, optimizer family, acceptance rules, result classes, revocation semantics, or claim firewall.

W1G is a new experiment. W1R remains closed and is not rerun.

## 1. Frozen software environment

The first W1G execution shall use:

~~~text
Python = 3.13
NumPy  = 2.2.6
~~~

The execution workflow shall set:

~~~text
PYTHONHASHSEED=0
OPENBLAS_NUM_THREADS=1
OMP_NUM_THREADS=1
MKL_NUM_THREADS=1
~~~

No GPU backend is used.

The run records:

- repository commit SHA;
- \`SPEC.md\` SHA-256;
- \`EXECUTION.md\` SHA-256;
- implementation source SHA-256;
- Python version;
- NumPy version;
- BLAS thread environment;
- workflow run id.

## 2. Canonical row order

### Panel A — AH11

Use the frozen AH11 construction in this exact order:

~~~text
U in [I, A, B, S]
V in [I, A, B, S]
k in [-1, 0, 1]
~~~

with \`k\` varying fastest.

Exactly 48 rows are produced.

The row index is harness bookkeeping only and is never a learner input.

The canonical hard witness remains:

~~~text
(I,A,0)
(A,I,0)
~~~

and must lie in the same-\`P2\`, different-\`G\` hard set.

### Panel B — lineage

Canonical order:

~~~text
R00
R01
R02
R03
R04
R05
R06
R07
R08
R09
R10
R11
NORTH
SOUTH
~~~

Frozen split:

~~~text
R00-R05  train
R06-R08  validation
R09-R11  test
NORTH     reserved
SOUTH     reserved
~~~

No shuffle is permitted.

## 3. Canonical pair order

For any ordered row list of length \`n\`, enumerate unordered pairs as:

~~~text
(i,j) for i in [0,n)
          for j in (i,n)
~~~

equivalently every pair satisfying:

~~~text
0 <= i < j < n
~~~

in lexicographic \`(i,j)\` order.

Pair order may not depend on sets, hash maps, filenames, or execution scheduling.

## 4. Frozen Keyhole bytes

W1G inherits the W1R deterministic Keyhole unchanged.

### Panel A

For exact integer:

~~~text
P2 = [[p00,p01],[p10,p11]]
~~~

serialize row-major as four signed int8 values and append 28 zero bytes:

~~~text
zA = int8[p00,p01,p10,p11] || int8[28](0)
~~~

### Panel B

For every route:

~~~text
zB = int8[1] || int8[31](0)
~~~

where \`READY=1\`.

No hashing, normalization, scaling, alternate encoding, or learned Keyhole map is permitted.

Any same-\`P2\` Panel-A pair with different Keyhole bytes, or any Panel-B route pair with different Keyhole bytes, yields:

~~~text
VOID_W1G_KEYHOLE_LEAK
~~~

## 5. Canonical residue sources

All residue-source values are signed int8, cast to fp32, and zero-padded to 64 values before the encoder.

Forbidden learner inputs include:

- symbolic route names;
- U/V labels;
- raw k;
- row/sample ids;
- split labels;
- receipt ids;
- evidence ids;
- epistemic origin;
- confidence;
- lineage ids;
- provenance hashes;
- authority hashes;
- model hashes;
- ledger hashes.

### Panel A scientific arms

Authorized source:

~~~text
rowmajor(T1) || rowmajor(T2)
~~~

exactly 8 signed values before zero padding.

### Panel B scientific arms

Route bits are MSB-first:

~~~text
0 -> -1
1 -> +1
READY = 1
~~~

Authority projections:

~~~text
COMMON_ONLY -> [1, 0,  0,  0,  0]
TRIAGE      -> [1, b3, b2, 0,  0]
FULL_STATUS -> [1, b3, b2, b1, b0]
~~~

### RB_STE Panel A

RB_STE receives the 32-byte deterministic Panel-A Keyhole, padded with 32 more zeros to width 64.

### RB_STE Panel B

RB_STE receives:

~~~text
int8[1] || int8[63](0)
~~~

for every route.

Thus same-coarse rows receive byte-identical RB_STE sources.

## 6. Authority and query enums

Authority order:

~~~text
0 = COMMON_ONLY
1 = TRIAGE
2 = FULL_STATUS
~~~

Query order:

~~~text
0 = Q0_AH11_RESIDUE
1 = Q1_ROUTE_RESIDUE
2 = Q2_AUTHORIZED_READ
3 = Q3_STALE_INJECTION_CONTROL
~~~

One-hot widths:

~~~text
authority = 3
query     = 4
~~~

No widening or alternate order is permitted.

## 7. Parameter layouts

### Shared E/R arrays

Fixed order:

~~~text
E1.weight  (64,32)
E1.bias    (32,)
E2.weight  (32,32)
E2.bias    (32,)
R.weight   (39,32)
R.bias     (32,)
~~~

Total:

~~~text
4416 trainable parameters
~~~

### Gate arrays

For COMMIT_STE and RB_STE only:

~~~text
G.weight   (39,1)
G.bias     (1,)
~~~

Total with gate:

~~~text
4456 trainable parameters
~~~

There are no \`K.*\` parameters.

A count or shape mismatch yields:

~~~text
VOID_W1G_CONTRACT_DRIFT
~~~

## 8. Initialization identity across arms

Seeds:

~~~text
0,1,2,3,4
~~~

Use exactly:

~~~text
numpy.random.Generator(numpy.random.PCG64(seed))
~~~

Initialization order is the parameter order in Section 7.

Weights use Xavier uniform:

\[
W_{ij}\sim U\left[
-\sqrt{\frac{6}{n_{in}+n_{out}}},
+\sqrt{\frac{6}{n_{in}+n_{out}}}
\right].
\]

Biases are exactly zero.

For each seed:

1. initialize the shared E/R arrays once;
2. FORCED_OPEN receives a byte-identical copy of those E/R arrays;
3. COMMIT_STE receives a byte-identical copy of those E/R arrays;
4. RB_STE receives a byte-identical copy of those E/R arrays;
5. initialize G after E/R using the same PCG64 stream;
6. COMMIT_STE and RB_STE receive byte-identical G arrays.

No arm-specific seed offsets are permitted.

No pretrained state or checkpoint warm-start is permitted.

## 9. Forward encoder

For source \`x\`:

\[
h_1=\operatorname{ReLU}(xE_1+b_1)
\]

\[
h=\operatorname{ReLU}(h_1E_2+b_2).
\]

Concatenate:

~~~text
aux = [h32, authority_onehot3, query_onehot4]
~~~

giving width 39.

Raw residue:

\[
r_{\rm raw}=auxR+b_R.
\]

For COMMIT_STE / RB_STE:

\[
\ell_g=auxG+b_G
\]

\[
p_g=\sigma(\ell_g).
\]

## 10. Quantizer forward

The exact forward quantizer is:

\[
q_8(x)=
\operatorname{int8}
\left(
\operatorname{clip}
(\operatorname{rint}(x),-127,127)
\right).
\]

\`rint\` is round-to-nearest, ties-to-even.

The task-forward numeric value is:

\[
q_{\rm fwd}(x)=\operatorname{float32}(q_8(x)).
\]

No learned scale, zero point, calibration, stochastic rounding, dithering, or fp64 rescue is permitted.

## 11. Quantizer backward STE

The quantizer backward mask is exactly:

\[
m_q(x)=
\begin{cases}
1,& -127<x<127\\
0,& x\le -127\ \text{or}\ x\ge127.
\end{cases}
\]

For incoming gradient \(dL/dq\):

\[
\frac{dL}{dx}
=
\frac{dL}{dq}\,m_q(x).
\]

The strict inequalities are frozen.

The forward value is never replaced by the continuous \`r_raw\`.

## 12. FORCED_OPEN forward/backward

FORCED_OPEN has no G parameters.

For every FULL_STATUS scientific task row:

~~~text
g_forward = 1
~~~

Task-forward residue:

\[
r_{\rm task}=q_{\rm fwd}(r_{\rm raw}).
\]

Backward to \`r_raw\` uses only the quantizer STE mask from Section 11.

There is no keep loss.

Committed residue is:

~~~text
r_commit = q8(r_raw)
~~~

Therefore task-forward residue interpreted as signed int8 values must equal committed residue exactly.

## 13. COMMIT_STE hard gate forward

For COMMIT_STE and RB_STE:

\[
p_g=\sigma(\ell_g).
\]

Hard forward gate:

\[
g_{\rm fwd}
=
\mathbf 1[p_g\ge0.5].
\]

The threshold is inclusive.

Because gate bias initializes to zero, an exactly zero initial gate logit gives:

~~~text
p_g = 0.5
g_forward = 1
~~~

No random tie-breaking is permitted.

## 14. Gate backward STE

The hard forward gate is used numerically in the forward pass.

Backward surrogate:

\[
\frac{\partial g_{\rm STE}}
{\partial \ell_g}
=
p_g(1-p_g).
\]

For incoming gate gradient \(dL/dg\):

\[
\frac{dL}{d\ell_g}
=
\frac{dL}{dg}\,p_g(1-p_g).
\]

No temperature, Gumbel noise, annealing, alternate surrogate, clipping, or slope multiplier is permitted.

## 15. COMMIT_STE residue forward/backward

Quantized numeric residue:

\[
q=q_{\rm fwd}(r_{\rm raw}).
\]

Task-forward residue:

\[
r_{\rm task}=g_{\rm fwd}\,q.
\]

This forward value is exactly the signed-int8 committed residue interpreted as fp32.

For incoming residue gradient \(\delta=dL/dr_{\rm task}\):

### Quantizer branch

\[
\frac{dL}{dq}
=
\delta\,g_{\rm fwd}.
\]

Then apply the quantizer STE mask from Section 11.

### Gate branch

\[
\frac{dL}{dg}
=
\sum_k \delta_k q_k.
\]

Then apply the gate STE from Section 14.

This exact decomposition is frozen.

## 16. Hard keep loss

For COMMIT_STE and RB_STE:

\[
L_{\rm keep}
=
\operatorname{mean}(g_{\rm fwd})
\]

over exactly:

~~~text
48 Panel-A training rows
+ 6 Panel-B training rows
= 54 rows
~~~

with no per-panel reweighting.

The forward keep cost therefore counts the same binary decision used at commit.

Backward:

\[
\frac{dL_{\rm keep}}{dg_i}
=
\frac1{54}.
\]

That gradient then passes through the gate STE:

\[
\frac{dL_{\rm keep}}{d\ell_i}
=
\frac1{54}p_i(1-p_i).
\]

FORCED_OPEN has no keep loss.

## 17. Pair losses

All pair losses operate on commit-aligned task-forward residues.

Distance:

\[
d^2(r_i,r_j)=
\operatorname{mean}_k(r_{ik}-r_{jk})^2.
\]

Margin:

~~~text
Delta = 1
~~~

Collapse:

\[
L_{\rm collapse}
=
\operatorname{mean}_{(i,j)\in\mathcal P}
d^2(r_i,r_j).
\]

Separate:

\[
L_{\rm separate}
=
\operatorname{mean}_{(i,j)\in\mathcal P}
\max(0,1-d^2(r_i,r_j)).
\]

At the exact hinge \(d^2=1\), the hinge gradient is zero.

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
\operatorname{SEPARATE}(r,\mathcal P_{\rm train}).
\]

Only R00-R05 appear in \(\mathcal P_{\rm train}\).

Validation, test and reserved routes never enter the loss.

## 18. Total arm losses

FORCED_OPEN:

\[
\boxed{
L_{\rm OPEN}=L_A+L_B
}
\]

COMMIT_STE:

\[
\boxed{
L_{\rm STE}=L_A+L_B+L_{\rm keep}
}
\]

RB_STE uses the same \(L_{\rm STE}\) formula and task labels with coarse-blind source inputs.

No hidden regularizer, reconstruction loss, raw-residue norm penalty, gate entropy term, label smoothing, decoder, or auxiliary head is permitted.

## 19. Optimizer

Use AdamW with:

~~~text
lr           = 1e-3
betas        = (0.9,0.999)
eps          = 1e-8
weight_decay = 0
steps        = 500
full_batch   = true
dtype        = fp32
~~~

No schedule, clipping, early stopping, gradient accumulation, mixed precision, checkpoint selection, or held-out-driven decision is permitted.

Optimizer state dictionaries use the exact parameter order from Section 7.

The scientific model is the parameter state **after exactly optimizer step 500**.

## 20. Final-evaluation timing

Training steps are:

~~~text
for step in 1..500:
    forward
    loss
    backward
    AdamW update
~~~

After step 500 updates parameters, run a fresh **no-gradient final forward pass** using the step-500 parameter state.

All reported scientific metrics, gate values, raw diagnostics, and forward/commit identity audits use this fresh final forward pass.

The pre-update forward from training step 500 is not used for scientific evaluation.

## 21. Commit rules

### FORCED_OPEN

~~~text
g_commit = 1
r_commit = q8(r_raw_final)
~~~

### COMMIT_STE / RB_STE

~~~text
g_commit = 1[p_g_final >= 0.5]

if g_commit == 1:
    r_commit = q8(r_raw_final)
else:
    r_commit = int8[32](0)
~~~

Keyhole is already canonical int8.

Payload:

~~~text
m_commit = z32 || r_commit32
~~~

Used causal payload bytes:

~~~text
B_used = 32 + 32*g_commit
~~~

FORCED_OPEN therefore uses 64 bytes.

## 22. Forward/commit identity audit

The final no-gradient task forward is retained before byte conversion.

For each evaluated row:

### FORCED_OPEN

Verify:

~~~text
int8(final_task_forward_residue)
==
r_commit
~~~

### COMMIT_STE / RB_STE

Verify:

~~~text
final_task_forward_gate
==
g_commit
~~~

and:

~~~text
int8(final_task_forward_residue)
==
r_commit
~~~

A single mismatch yields:

~~~text
VOID_W1G_CONTRACT_DRIFT
~~~

The audit is performed on:

- all 48 Panel-A rows;
- all 14 Panel-B routes;
- every scientific arm;
- RB_STE.

## 23. Model hashes

### FORCED_OPEN hash order

SHA-256 over little-endian fp32 C-order bytes:

~~~text
E1.weight
E1.bias
E2.weight
E2.bias
R.weight
R.bias
~~~

### COMMIT_STE / RB_STE hash order

SHA-256 over:

~~~text
E1.weight
E1.bias
E2.weight
E2.bias
R.weight
R.bias
G.weight
G.bias
~~~

No optimizer state enters the model hash.

## 24. Metadata and authority hash

Metadata remains exactly 67 bytes:

~~~text
byte 0      gate
byte 1      authority enum
byte 2      query enum
bytes 3:35  authority hash
bytes 35:67 model hash
~~~

The inherited authority hash remains exactly:

~~~text
SHA256(b"NBG-W1\0AUTH\0" || authority_enum_u8)
~~~

The domain separator is intentionally unchanged.

Reads return payload only when current authority hash and current model hash match.

Query byte is preserved in metadata but does not override failed authority/model checks.

## 25. K0 control

K0 has:

~~~text
g = 0
r = int8[32](0)
~~~

for every row.

It receives no training.

It must separate:

~~~text
0 Panel-A hard pairs
0 reserved NORTH/SOUTH pairs
~~~

Any separation yields:

~~~text
VOID_W1G_CONTROL_FAILURE
~~~

## 26. RB_STE control

RB_STE trains for 500 steps using the exact COMMIT_STE mechanics, seed family, optimizer, parameter initialization identity, gate threshold, quantizer STE, hard keep cost and losses.

Its only difference is coarse-blind source input.

For every seed it must have:

\[
S_{\rm sep}^{RB}=0
\]

on Panel-A hard pairs and:

\[
A_{\rm route,reserved}^{RB}=0.
\]

Any violation yields:

~~~text
VOID_W1G_CONTROL_FAILURE
~~~

RB_STE held-out/train metrics are recorded diagnostically.

## 27. Scientific arms

For result classification, “scientific arms” means:

~~~text
FORCED_OPEN
COMMIT_STE
~~~

RB_STE is a structural learned control, not a candidate scientific arm.

Revocation acceptance is required for FORCED_OPEN and COMMIT_STE.

RB_STE revocation may be recorded diagnostically but is not part of the scientific pass/fail rule.

## 28. Metrics

All separation metrics use committed residue bytes.

Panel A:

\[
C_{\rm hard}^R
=
\frac{
\#\{(i,j)\in\mathcal H_R:r_i=r_j\}
}{
|\mathcal H_R|
}
\]

\[
S_{\rm sep}^R=1-C_{\rm hard}^R
\]

\[
C_{\rm eq}^R
=
\frac{
\#\{(i,j)\in\mathcal E_R:r_i\ne r_j\}
}{
|\mathcal E_R|
}.
\]

For COMMIT_STE / RB_STE:

\[
U_R=
\frac{
\#\{(i,j)\in\mathcal H_R:
r_i\ne r_j\land(g_i=1\lor g_j=1)\}
}{
|\mathcal H_R|
}.
\]

Panel B per split:

\[
A_{\rm route}^R(S)
=
1-
\frac{
\#\{\text{distinct-route pairs with equal committed residue}\}
}{
\#\{\text{distinct-route pairs}\}
}.
\]

Report:

~~~text
A_route_train_R
A_route_validation_R
A_route_test_R
A_route_reserved_R
G_heldout_R
~~~

For COMMIT_STE / RB_STE also report gate rate and mean used bytes by panel/split.

FORCED_OPEN gate rate is fixed at 1 and mean used bytes is fixed at 64.

## 29. Diagnostic raw/gate statistics

These diagnostics do not enter training or classification but are frozen for interpretation.

At final evaluation, report per arm and panel/split:

~~~text
p_gate_min
p_gate_mean
p_gate_max
gate_keep_rate
r_raw_abs_mean
r_raw_abs_max
q8_saturation_fraction
q8_zero_fraction
~~~

FORCED_OPEN has no \`p_gate\`; report null for p-gate statistics and gate rate 1.

COMMIT_STE / RB_STE report actual final probabilities.

These diagnostics exist to distinguish:

- representation failure;
- quantizer dead zone;
- gate closure;
- saturation.

They may not be used to select or rerun a seed.

## 30. Median-performance seeds

Compute separately for FORCED_OPEN and COMMIT_STE.

Sort each arm’s five seeds by:

\[
(C_{\rm hard}^R,C_{\rm eq}^R,s)
\]

ascending lexicographically.

Take index 2.

All five seed records remain in the artifact.

RB_STE has no median seed used for scientific classification.

## 31. Revocation

For each seed and each scientific arm:

1. materialize NORTH and SOUTH under FULL_STATUS with query \`Q2_AUTHORIZED_READ\`;
2. append \`AUTHORIZED_ACTIVE_RESIDUE\`;
3. revoke current authority to COMMON_ONLY without rematerialization;
4. old memory read must refuse;
5. required mark: \`REVOKED_BUT_STALE_RESIDUE_PRESENT\`;
6. any returned payload increments \`L_revoke\`;
7. re-read the current COMMON_ONLY authorized source;
8. rematerialize under current authority;
9. append \`AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED\`;
10. NORTH and SOUTH current memories must be byte-identical;
11. inject old FULL_STATUS memory with query \`Q3_STALE_INJECTION_CONTROL\`;
12. required mark: \`STALE_RESIDUE_REFUSED\`;
13. any returned payload increments \`L_revoke\`;
14. old ledger bytes must remain an exact prefix of new ledger bytes.

FORCED_OPEN remains forced open after rematerialization.

COMMIT_STE recomputes its gate from the current COMMON_ONLY source.

Rematerialization never uses stale hidden state or stale residue.

Every scientific-arm seed requires:

\[
L_{\rm revoke}=0.
\]

## 32. Ledger serialization

Receipts use canonical UTF-8 JSON Lines:

~~~text
json.dumps(obj, sort_keys=True, separators=(",", ":")) + "\n"
~~~

Every append must preserve exact byte-prefix immutability.

No old receipt may be edited, reordered, summarized, or compacted by the runner.

## 33. Structural preflight

Before any optimizer step verify:

- 48 Panel-A rows in frozen order;
- Panel-B 6/3/3/2 split in frozen order;
- 4416 FORCED_OPEN params;
- 4456 COMMIT_STE params;
- 4456 RB_STE params;
- no K parameters;
- shared E/R init bytes identical across all three arms per seed;
- G init bytes identical between COMMIT_STE and RB_STE per seed;
- exact query/authority enum order;
- exact Keyhole bytes;
- same-\`P2\` Keyhole identity;
- all route Keyholes identical;
- hard witness membership;
- held-out route ids absent from loss row set;
- forbidden provenance/identity fields absent from learner input builder;
- K0 cannot separate hard/reserved pairs;
- STE definitions match this file.

Structural result precedence:

~~~text
1. VOID_W1G_KEYHOLE_LEAK
2. VOID_W1G_CONTROL_FAILURE
3. VOID_W1G_CONTRACT_DRIFT
~~~

A VOID is not converted into a scientific FAIL.

## 34. Scientific result precedence

Assuming no VOID:

### 1. Revocation

If any FORCED_OPEN or COMMIT_STE seed has:

~~~text
L_revoke > 0
~~~

or fails current alignment / stale-injection / ledger-prefix structure:

~~~text
FAIL_W1G_REVOCATION
~~~

### 2. Representation + commit

Compute FORCED_OPEN median seed.

FORCED_OPEN positive-control role requires:

- median \`S_sep_R = 1\`;
- median \`A_route_test_R = 1\`;
- every seed \`A_route_reserved_R = 1\`;
- every seed \`L_revoke = 0\`.

If not:

~~~text
FAIL_W1G_REPRESENTATION_COMMIT
~~~

### 3. Learned gate alignment

If FORCED_OPEN passes, compute COMMIT_STE median seed.

If median:

~~~text
S_sep_R != 1
or
U_R != 1
~~~

or any seed:

~~~text
reserved_pair_any_gate_open == false
~~~

then:

~~~text
FAIL_W1G_GATE_ALIGNMENT
~~~

### 4. Generalization

If residue/gate retention passes but median:

~~~text
A_route_test_R != 1
~~~

or any seed:

~~~text
A_route_reserved_R != 1
~~~

then:

~~~text
FAIL_W1G_GENERALIZATION
~~~

### 5. Pass

Otherwise:

~~~text
PASS_W1G_COMMIT_ALIGNED_RESIDUE
~~~

A workflow success is not itself a scientific PASS.

## 35. Compression firewall

Frozen source sizes:

~~~text
Panel A B_X = 8 bytes
Panel B B_X = 5 bytes
active capacity = 64 bytes
~~~

Therefore every artifact must contain:

~~~text
compression_claim_authorized = false
~~~

No arm/result authorizes storage-compression language.

## 36. Epistemic provenance boundary

Epistemic origin, confidence, evidence ids, lineage ids, review receipts and provenance hashes are outside the learner.

They may not enter E, R, G, losses, gates, controls, or seed selection.

A reviewed W1G result may later be wrapped externally for live NBG memory as:

~~~text
origin = SIMULATED
retainable = true
reasoningUsable = true
actionAuthorized = false
~~~

The raw execution artifact remains immutable.

## 37. Execution artifact

The manual execution writes one JSON artifact with:

~~~text
status = UNREVIEWED_EXECUTION
result_language_authorized = false
compression_claim_authorized = false
~~~

It records at minimum:

- protocol/execution/implementation hashes;
- implementation commit;
- Python/NumPy/thread environment;
- static preflight;
- K0 metrics;
- all five FORCED_OPEN seed records;
- all five COMMIT_STE seed records;
- all five RB_STE seed records;
- separate median seeds;
- forward/commit identity audit;
- raw/gate diagnostics;
- scientific-arm revocation results;
- machine candidate result class;
- no-compression fields.

Exact result serialization:

~~~text
json.dumps(result, indent=2, sort_keys=True) + "\n"
~~~

The SHA-256 of those exact inner JSON bytes is printed to the workflow log.

GitHub ZIP artifact digest and inner result JSON hash are different objects and must be recorded separately during review.

## 38. PR / workflow boundary

Future W1G implementation PR CI may run only:

- syntax checks;
- static contract checks;
- exact parameter/init identity checks;
- STE arithmetic unit tests;
- forward/commit identity unit tests on handcrafted tensors;
- K0 checks;
- split/input-firewall checks;
- execution-refusal tests.

PR CI must not run an optimizer step.

The first optimizer step is permitted only after:

1. W1G protocol is merged;
2. this execution freeze is merged;
3. implementation is merged green;
4. the manual W1G workflow is dispatched from \`main\`.

The execution workflow must be \`workflow_dispatch\` only and refuse non-\`main\` refs.

## 39. No-rerun rule

The first valid frozen W1G execution is result-bearing.

Do not rerun because:

- FORCED_OPEN fails;
- COMMIT_STE gates close;
- STE behaves poorly;
- one seed is ugly;
- generalization fails;
- the mechanism hypothesis is wrong.

A retry without a new protocol/version is allowed only for documented infrastructure failure where scientific execution did not complete, or a provably corrupt/unreadable artifact.

## 40. Result boundary

This file authorizes implementation only after merge.

It authorizes no W1G result sentence.

A machine candidate result remains unreviewed until compared against \`SPEC.md\` and this execution freeze.
