# NBG-W1H v0.1.0 — Execution Freeze

Status: implementation contract only. **No W1H training is authorized by this file until this execution freeze is merged to `main`.**

This document resolves implementation degrees of freedom left open by `SPEC.md`. It does not change the W1H scientific question, frozen data, forced coarse Keyhole, one-variable no-keep intervention, controls, optimizer family, acceptance rules, result classes, revocation semantics, provenance firewall, or compression firewall.

W1H is a new experiment. W1G remains closed and is not rerun.

## 1. Frozen software environment

The first W1H execution shall use:

~~~text
Python = 3.13
NumPy  = 2.2.6
CPU only
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
- `SPEC.md` SHA-256;
- `EXECUTION.md` SHA-256;
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

with `k` varying fastest.

Exactly 48 rows are produced.

The row index is harness bookkeeping only and is never a learner input.

The canonical hard witness remains:

~~~text
(I,A,0)
(A,I,0)
~~~

and must lie in the same-`P2`, different-`G` hard set.

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

For any ordered row list of length `n`, enumerate unordered pairs as:

~~~text
(i,j) for i in [0,n)
          for j in (i,n)
~~~

equivalently:

~~~text
0 <= i < j < n
~~~

in lexicographic `(i,j)` order.

Pair order may not depend on sets, hash maps, filenames, worker scheduling, or execution timing.

## 4. Frozen Keyhole bytes

W1H inherits the W1G/W1R deterministic Keyhole unchanged.

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

where `READY=1`.

No hashing, normalization, scaling, alternate encoding, route-dependent field, or learned Keyhole map is permitted.

Any same-`P2` Panel-A pair with different Keyhole bytes, or any Panel-B route pair with different Keyhole bytes, yields:

~~~text
VOID_W1H_KEYHOLE_LEAK
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
- ledger hashes;
- W1G result labels or metrics.

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

### RB_NO_KEEP_STE Panel A

The coarse-blind control receives the 32-byte deterministic Panel-A Keyhole padded with 32 more zeros to width 64.

### RB_NO_KEEP_STE Panel B

The coarse-blind control receives:

~~~text
int8[1] || int8[63](0)
~~~

for every route.

Thus same-coarse rows receive byte-identical control sources.

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

For NO_KEEP_STE and RB_NO_KEEP_STE only:

~~~text
G.weight   (39,1)
G.bias     (1,)
~~~

Total with gate:

~~~text
4456 trainable parameters
~~~

There are no `K.*` parameters.

A count or shape mismatch yields:

~~~text
VOID_W1H_CONTRACT_DRIFT
~~~

## 8. Fresh initialization identity across arms

W1H uses fresh initialization. No W1G trained parameter state, optimizer state, gate logit, checkpoint, or selected residue is imported.

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

[
W_{ij}sim Uleft[
-sqrt{rac{6}{n_{in}+n_{out}}},
+sqrt{rac{6}{n_{in}+n_{out}}}
ight].
]

Biases are exactly zero.

For each seed:

1. initialize shared E/R arrays once;
2. FORCED_OPEN receives a byte-identical copy;
3. NO_KEEP_STE receives a byte-identical copy;
4. RB_NO_KEEP_STE receives a byte-identical copy;
5. initialize G after E/R using the same PCG64 stream;
6. NO_KEEP_STE and RB_NO_KEEP_STE receive byte-identical G arrays.

No arm-specific seed offsets are permitted.

## 9. Forward encoder

For source `x`:

[
h_1=operatorname{ReLU}(xE_1+b_1)
]

[
h=operatorname{ReLU}(h_1E_2+b_2).
]

Concatenate:

~~~text
aux = [h32, authority_onehot3, query_onehot4]
~~~

giving width 39.

Raw residue:

[
r_{m raw}=auxR+b_R.
]

For NO_KEEP_STE / RB_NO_KEEP_STE:

[
ell_g=auxG+b_G
]

[
p_g=sigma(ell_g).
]

## 10. Quantizer forward

The exact forward quantizer is:

[
q_8(x)=
operatorname{int8}
left(
operatorname{clip}
(operatorname{rint}(x),-127,127)
ight).
]

`rint` is round-to-nearest, ties-to-even.

The task-forward numeric value is:

[
q_{m fwd}(x)=operatorname{float32}(q_8(x)).
]

No learned scale, zero point, calibration, stochastic rounding, dithering, alternate clipping range, or fp64 rescue is permitted.

## 11. Quantizer backward STE

The quantizer backward mask is exactly:

[
m_q(x)=
egin{cases}
1,& -127<x<127\
0,& xle -127 	ext{or} xge127.
end{cases}
]

For incoming gradient (partial L/partial q):

[
rac{partial L}{partial x}
=
rac{partial L}{partial q},m_q(x).
]

The strict inequalities are frozen.

The forward value is never replaced by continuous `r_raw`.

## 12. FORCED_OPEN forward/backward

FORCED_OPEN has no G parameters.

For every FULL_STATUS scientific task row:

~~~text
g_forward = 1
~~~

Task-forward residue:

[
r_{m task}=q_{m fwd}(r_{m raw}).
]

Backward to `r_raw` uses only the quantizer STE mask from Section 11.

There is no keep loss.

Committed residue:

~~~text
r_commit = q8(r_raw)
~~~

Therefore task-forward residue interpreted as signed int8 values must equal committed residue exactly.

## 13. NO_KEEP_STE hard gate forward

For NO_KEEP_STE and RB_NO_KEEP_STE:

[
p_g=sigma(ell_g).
]

Hard forward gate:

[
g_{m fwd}
=
mathbf 1[p_gge0.5].
]

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

[
rac{partial g_{m STE}}
{partial ell_g}
=
p_g(1-p_g).
]

For incoming gate gradient (partial L/partial g):

[
rac{partial L}{partialell_g}
=
rac{partial L}{partial g},p_g(1-p_g).
]

No temperature, Gumbel noise, annealing, alternate surrogate, clipping, straight-through slope multiplier, or threshold adjustment is permitted.

## 15. Commit-aligned residue gradient decomposition

Quantized numeric residue:

[
q=q_{m fwd}(r_{m raw}).
]

Task-forward residue:

[
r_{m task}=g_{m fwd},q.
]

This forward value is exactly the signed-int8 committed residue interpreted as fp32.

For incoming residue gradient (delta=partial L/partial r_{m task}):

### Quantizer branch

[
rac{partial L}{partial q}
=
delta,g_{m fwd}.
]

Then apply the strict quantizer STE mask from Section 11.

### Gate branch

[
rac{partial L}{partial g}
=
sum_k delta_k q_k.
]

Then apply the sigmoid gate STE from Section 14.

This decomposition is identical to W1G COMMIT_STE.

## 16. No keep-loss branch

This section freezes the single W1H scientific intervention.

For NO_KEEP_STE and RB_NO_KEEP_STE:

~~~text
L_keep does not exist
~~~

There is:

- no mean hard-gate term;
- no mean probability term;
- no sparsity penalty;
- no gate-open reward;
- no entropy term;
- no gate bias regularizer;
- no manually supervised gate target;
- no substitute cost with a different coefficient.

The gate receives gradients **only** through the task-loss gate branch in Section 15.

FORCED_OPEN has no learned gate and no keep term.

## 17. Pair losses

All pair losses operate on commit-aligned task-forward residue.

Distance:

[
d^2(r_i,r_j)=
operatorname{mean}_k(r_{ik}-r_{jk})^2.
]

Margin:

~~~text
Delta = 1
~~~

Collapse:

[
L_{m collapse}
=
operatorname{mean}_{(i,j)inmathcal P}
d^2(r_i,r_j).
]

Separate:

[
L_{m separate}
=
operatorname{mean}_{(i,j)inmathcal P}
max(0,1-d^2(r_i,r_j)).
]

At exact hinge (d^2=1), hinge gradient is zero.

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

Only R00-R05 appear in Panel-B training pairs.

Validation, test and reserved routes never enter the loss.

## 18. Total arm losses

For all trainable W1H arms:

[
oxed{
L=L_A+L_B
}
]

No hidden regularizer, reconstruction loss, raw-residue norm penalty, gate entropy term, label smoothing, decoder, auxiliary head, or inherited W1G keep term is permitted.

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

No schedule, clipping, early stopping, gradient accumulation, mixed precision, checkpoint selection, seed replacement, or held-out-driven decision is permitted.

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

All reported scientific metrics, gate values, raw diagnostics, and forward/commit identity audits use this fresh final pass.

The pre-update forward from training step 500 is not used for scientific evaluation.

## 21. Commit rules

### FORCED_OPEN

~~~text
g_commit = 1
r_commit = q8(r_raw_final)
~~~

### NO_KEEP_STE / RB_NO_KEEP_STE

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

### NO_KEEP_STE / RB_NO_KEEP_STE

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
VOID_W1H_CONTRACT_DRIFT
~~~

The audit is performed on:

- all 48 Panel-A rows;
- all 14 Panel-B routes;
- every scientific arm;
- RB_NO_KEEP_STE.

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

### NO_KEEP_STE / RB_NO_KEEP_STE hash order

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

The inherited authority hash remains:

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
VOID_W1H_CONTROL_FAILURE
~~~

## 26. RB_NO_KEEP_STE control

RB_NO_KEEP_STE trains for 500 steps using the exact NO_KEEP_STE mechanics, seed family, optimizer, parameter initialization identity, gate threshold, quantizer STE, **absence of keep loss**, and pair losses.

Its only difference is coarse-blind source input.

For every seed it must have:

[
S_{m sep}^{RB}=0
]

on Panel-A hard pairs and:

[
A_{m route,reserved}^{RB}=0.
]

Any violation yields:

~~~text
VOID_W1H_CONTROL_FAILURE
~~~

Other RB_NO_KEEP_STE metrics are diagnostic only.

## 27. Scientific arms

For result classification, “scientific arms” means:

~~~text
FORCED_OPEN
NO_KEEP_STE
~~~

RB_NO_KEEP_STE is a structural learned control, not a candidate scientific arm.

Revocation acceptance is required for both scientific arms.

## 28. Metrics

All separation metrics use committed residue bytes.

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
}.
]

For learned-gate arms:

[
U_R
=
rac{
#{(i,j)inmathcal H_R:
r_i
e r_jland(g_i=1lor g_j=1)}
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

Report:

~~~text
A_route_train_R
A_route_validation_R
A_route_test_R
A_route_reserved_R
G_heldout_R
~~~

and mean used bytes by panel/split.

FORCED_OPEN gate rate is fixed at 1 and mean used bytes is fixed at 64.

## 29. Diagnostic raw/gate statistics

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

FORCED_OPEN has no `p_gate`; report null for p-gate statistics and gate rate 1.

NO_KEEP_STE / RB_NO_KEEP_STE report actual final probabilities.

These diagnostics do not enter training, seed selection, acceptance, or rerun decisions.

In particular, W1G's historical maximum gate probability is not a W1H threshold or target.

## 30. Median-performance seeds

Compute separately for FORCED_OPEN and NO_KEEP_STE.

Sort each arm’s five seeds by:

[
(C_{m hard}^R,C_{m eq}^R,s)
]

ascending lexicographically.

Take index 2.

All five seed records remain in the artifact.

RB_NO_KEEP_STE has no median seed used for scientific classification.

## 31. Revocation

For each seed and each scientific arm:

1. materialize NORTH and SOUTH under FULL_STATUS with query `Q2_AUTHORIZED_READ`;
2. append `AUTHORIZED_ACTIVE_RESIDUE`;
3. revoke current authority to COMMON_ONLY without rematerialization;
4. old memory read must refuse;
5. required mark: `REVOKED_BUT_STALE_RESIDUE_PRESENT`;
6. any returned payload increments `L_revoke`;
7. re-read current COMMON_ONLY authorized source;
8. rematerialize under current authority;
9. append `AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED`;
10. NORTH and SOUTH current memories must be byte-identical;
11. inject old FULL_STATUS memory with query `Q3_STALE_INJECTION_CONTROL`;
12. required mark: `STALE_RESIDUE_REFUSED`;
13. any returned payload increments `L_revoke`;
14. old ledger bytes must remain an exact prefix of new ledger bytes.

FORCED_OPEN remains forced open after rematerialization.

NO_KEEP_STE recomputes its gate from the current COMMON_ONLY source.

Rematerialization never uses stale hidden state or stale residue.

Every scientific-arm seed requires:

[
L_{m revoke}=0.
]

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
- 4456 NO_KEEP_STE params;
- 4456 RB_NO_KEEP_STE params;
- no K parameters;
- shared E/R init bytes identical across all three arms per seed;
- G init bytes identical between NO_KEEP_STE and RB_NO_KEEP_STE per seed;
- exact query/authority enum order;
- exact Keyhole bytes;
- same-`P2` Keyhole identity;
- all route Keyholes identical;
- hard witness membership;
- held-out route ids absent from loss row set;
- forbidden provenance/identity/W1G-result fields absent from learner input builder;
- K0 cannot separate hard/reserved pairs;
- STE definitions match this file;
- total learned-arm objective contains exactly `L_A + L_B`;
- no `L_keep` or replacement gate regularizer exists.

Structural result precedence:

~~~text
1. VOID_W1H_KEYHOLE_LEAK
2. VOID_W1H_CONTROL_FAILURE
3. VOID_W1H_CONTRACT_DRIFT
~~~

A VOID is not converted into a scientific FAIL.

## 34. Scientific result precedence

Assuming no VOID:

### 1. Revocation

If any FORCED_OPEN or NO_KEEP_STE seed has:

~~~text
L_revoke > 0
~~~

or fails current alignment / stale-injection / ledger-prefix structure:

~~~text
FAIL_W1H_REVOCATION
~~~

### 2. Representation + commit

Compute FORCED_OPEN median seed.

FORCED_OPEN positive-control role requires:

- median `S_sep_R = 1`;
- median `A_route_test_R = 1`;
- every seed `A_route_reserved_R = 1`;
- every seed `L_revoke = 0`.

If not:

~~~text
FAIL_W1H_REPRESENTATION_COMMIT
~~~

### 3. Gate retention without keep pressure

If FORCED_OPEN passes, compute NO_KEEP_STE median seed.

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
FAIL_W1H_GATE_RETENTION_WITHOUT_KEEP
~~~

### 4. Generalization

If gate-retention criteria pass but median:

~~~text
A_route_test_R != 1
~~~

or any seed:

~~~text
A_route_reserved_R != 1
~~~

then:

~~~text
FAIL_W1H_GENERALIZATION
~~~

### 5. Pass

Otherwise:

~~~text
PASS_W1H_GATE_RETENTION_WITHOUT_KEEP
~~~

A workflow success is not itself a scientific PASS.

## 35. Compression firewall

Frozen source sizes:

~~~text
Panel A B_X = 8 bytes
Panel B B_X = 5 bytes
active capacity = 64 bytes
~~~

Every artifact must contain:

~~~text
compression_claim_authorized = false
~~~

No W1H outcome authorizes storage-compression language.

Removing keep pressure makes a compression interpretation especially inappropriate.

## 36. Historical-comparison firewall

The reviewed W1G result is motivation only.

The W1H runner may not import:

- W1G trained weights;
- W1G optimizer state;
- W1G gate logits;
- W1G median seed choice as a preferred seed;
- W1G diagnostic thresholds;
- W1G result labels as learner inputs.

After review, W1H and W1G may be compared descriptively as separate frozen experiments.

No cross-experiment difference may rewrite either artifact.

## 37. Epistemic provenance boundary

Epistemic origin, confidence, evidence ids, lineage ids, review receipts, provenance hashes, and prior-result metadata are outside the learner.

They may not enter E, R, G, losses, gates, controls, or seed selection.

A reviewed W1H result may later be wrapped externally for live NBG memory as:

~~~text
origin = SIMULATED
retainable = true
reasoningUsable = true
actionAuthorized = false
~~~

The raw execution artifact remains immutable.

## 38. Execution artifact

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
- all five NO_KEEP_STE seed records;
- all five RB_NO_KEEP_STE seed records;
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

## 39. PR / workflow boundary

Future W1H implementation PR CI may run only:

- syntax checks;
- static contract checks;
- exact parameter/init identity checks;
- STE arithmetic unit tests;
- forward/commit identity unit tests on handcrafted tensors;
- objective-composition checks proving no keep term exists;
- K0 checks;
- split/input-firewall checks;
- execution-refusal tests.

PR CI must not run an optimizer step.

The first optimizer step is permitted only after:

1. W1H protocol is merged;
2. this execution freeze is merged;
3. implementation is merged green;
4. a manual W1H workflow is dispatched from `main`.

The execution workflow must be `workflow_dispatch` only and refuse non-`main` refs.

## 40. No-rerun rule

The first valid frozen W1H execution is result-bearing.

Do not rerun because:

- FORCED_OPEN fails;
- NO_KEEP_STE gates remain closed;
- NO_KEEP_STE gates remain open everywhere;
- one seed is ugly;
- generalization fails;
- the keep-pressure hypothesis is wrong.

A retry without a new protocol/version is allowed only for documented infrastructure failure where scientific execution did not complete, or a provably corrupt/unreadable artifact.

## 41. Result boundary

This file authorizes implementation only after merge.

It authorizes no W1H result sentence.

The machine candidate remains unreviewed until compared against `SPEC.md` and this execution freeze.
