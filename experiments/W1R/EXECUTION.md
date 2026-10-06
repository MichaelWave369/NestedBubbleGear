# NBG-W1R v0.1.0 — Execution Freeze

Status: implementation contract only. No W1R training is authorized by this file until this execution freeze is merged to \`main\`.

This document resolves implementation degrees of freedom left open by \`SPEC.md\`. It does not change the W1R scientific question, architecture, 32+32 byte active-memory budget, 4,456-parameter residue branch, seeds, optimizer family, panels, controls, revocation semantics, result classes, or claim firewall.

W1R remains a new experiment. W1 is not rerun or modified.

## 1. Frozen software environment

The first W1R execution shall use:

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

The run records the exact Python version, NumPy version, repository commit, protocol SHA-256, execution-freeze SHA-256, implementation SHA-256, and thread environment.

## 2. Canonical row order

### Panel A — AH11

Use the already-frozen AH11 construction in this exact order:

~~~text
U in [I, A, B, S]
V in [I, A, B, S]
k in [-1, 0, 1]
~~~

with \`k\` varying fastest.

This produces exactly 48 rows.

Each row receives the canonical row index from this order. The row index is harness bookkeeping only and is never a model input.

The canonical hard witness remains:

~~~text
(U,V,k) = (I,A,0)
(U,V,k) = (A,I,0)
~~~

and must lie in the same-\`P2\`, different-\`G_partial\` hard set.

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

For any ordered row list of length \`n\`, unordered pair enumeration is:

~~~text
(i,j) for i in [0,n)
          for j in (i,n)
~~~

equivalently every pair satisfying:

~~~text
0 <= i < j < n
~~~

in lexicographic \`(i,j)\` order.

Pair order may not depend on hash maps, sets, filenames, or worker scheduling.

## 4. Frozen Keyhole bytes

The W1R Keyhole is deterministic and has no trainable parameters.

### Panel A

Let \`P2\` be the 2x2 AH11 cumulative transport matrix.

Serialize row-major:

~~~text
[p00, p01, p10, p11]
~~~

as signed \`int8\`.

The exact 32-byte Keyhole is:

~~~text
zA = int8[p00,p01,p10,p11] || int8[28](0)
~~~

No scaling, normalization, learned map, hashing, or alternate encoding is permitted.

### Panel B

\`READY = 1\`.

The exact 32-byte Keyhole for every route is:

~~~text
zB = int8[1] || int8[31](0)
~~~

### Structural invariant

The harness checks byte equality directly.

For every Panel-A pair with equal \`P2\`:

~~~text
z_i == z_j
~~~

must hold byte-for-byte.

For every Panel-B route pair:

~~~text
z_i == z_j
~~~

must hold byte-for-byte.

Any violation yields:

~~~text
VOID_W1R_KEYHOLE_LEAK
~~~

and training is not interpreted scientifically.

## 5. Canonical residue source

All residue-branch inputs are signed \`int8\`, cast to fp32, then zero-padded to 64 values before the encoder.

Symbolic route names, row ids, sample ids, receipt ids, evidence ids, provenance hashes, model hashes, ledger hashes, filenames, and split labels are forbidden model inputs.

### Panel A

Authorized pre-collapse source:

~~~text
rowmajor(T1) || rowmajor(T2)
~~~

exactly 8 signed values before zero padding.

The learner does not receive symbolic \`U\`, symbolic \`V\`, raw \`k\`, \`P2\`, \`G_partial\`, row index, or any unique lookup key.

### Panel B

Four route bits are encoded MSB-first:

~~~text
0 -> -1
1 -> +1
~~~

with \`READY = 1\`.

Authorized projections remain:

~~~text
COMMON_ONLY -> [1, 0,  0,  0,  0]
TRIAGE      -> [1, b3, b2, 0,  0]
FULL_STATUS -> [1, b3, b2, b1, b0]
~~~

The symbolic route name is never a learner input.

## 6. Query and authority enums

Authority byte order remains exactly:

~~~text
0 = COMMON_ONLY
1 = TRIAGE
2 = FULL_STATUS
~~~

Query byte order for W1R is exactly:

~~~text
0 = Q0_AH11_RESIDUE
1 = Q1_ROUTE_RESIDUE
2 = Q2_AUTHORIZED_READ
3 = Q3_STALE_INJECTION_CONTROL
~~~

One-hot encoding follows those byte orders.

Authority one-hot width is 3.

Query one-hot width is 4.

No widening or alternate order is permitted.

## 7. Trainable parameter layout

The trainable W1R residue branch contains only:

~~~text
E1.weight  shape (64,32)
E1.bias    shape (32,)
E2.weight  shape (32,32)
E2.bias    shape (32,)
R.weight   shape (39,32)
R.bias     shape (32,)
G.weight   shape (39,1)
G.bias     shape (1,)
~~~

Fixed parameter serialization / initialization order:

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

Total trainable parameter count must be exactly:

~~~text
4456
~~~

A different count yields:

~~~text
VOID_W1R_CONTRACT_DRIFT
~~~

There is no \`K.weight\` or \`K.bias\` in W1R.

## 8. Initialization

For each seed:

~~~text
0,1,2,3,4
~~~

use:

~~~text
numpy.random.Generator(numpy.random.PCG64(seed))
~~~

Weights initialize independently in the frozen parameter order using Xavier uniform:

\[
W_{ij}\sim U\left[
-\sqrt{\frac{6}{n_{in}+n_{out}}},
+\sqrt{\frac{6}{n_{in}+n_{out}}}
\right].
\]

Biases initialize to exactly zero.

For a given seed, W1R and the coarse-blind residue control \`RB\` begin from byte-identical trainable parameters.

No pretrained state, checkpoint warm-start, random reseeding, or per-control seed offset is permitted.

## 9. Encoder and residue forward path

For a zero-padded fp32 source \`x\`:

\[
h_1 = \operatorname{ReLU}(xE_1+b_1)
\]

\[
h = \operatorname{ReLU}(h_1E_2+b_2).
\]

Concatenate:

~~~text
aux = [h32, authority_onehot3, query_onehot4]
~~~

giving width 39.

Then:

\[
r_{\rm raw}=auxR+b_R
\]

and:

\[
p_g=\sigma(auxG+b_G).
\]

Training-time residue:

\[
r_{\rm train}=p_g\,r_{\rm raw}.
\]

The deterministic Keyhole \`z\` does not enter the trainable residue network and receives no gradient.

## 10. Committed gate and int8 residue

Committed gate:

\[
g=\mathbf 1[p_g\ge0.5].
\]

Quantization is inherited unchanged from W1:

\[
q_8(x)=\operatorname{int8}
\left(
\operatorname{clip}
(\operatorname{rint}(x),-127,127)
\right).
\]

\`rint\` means round-to-nearest with ties-to-even.

No learned scale, zero point, per-vector calibration, post-hoc calibration, or fp64 rescue is permitted.

Commit:

~~~text
r_commit = q8(r_raw)       if g == 1
r_commit = int8[32](0)     if g == 0
~~~

The Keyhole is already canonical int8 and is not requantized.

Active payload:

~~~text
m_commit = z_commit || r_commit
~~~

with exact capacity:

~~~text
32 bytes z + 32 bytes r = 64 bytes
~~~

Used bytes:

~~~text
B_used = 32 + 32*g
~~~

The keep-gate byte and scope metadata are outside the causal payload budget.

## 11. Metadata and read gating

Metadata remains exactly 67 bytes:

~~~text
byte 0      gate g
byte 1      authority enum
byte 2      query enum
bytes 3:35  raw SHA-256 authority hash
bytes 35:67 raw SHA-256 model hash
~~~

The inherited W1 authority-hash domain separator remains byte-for-byte unchanged:

~~~text
b"NBG-W1\0AUTH\0" || authority_enum_u8
~~~

The string is intentionally not renamed to W1R because W1R \`SPEC.md\` inherits the W1 authority-hash mechanic without modification.

The W1R model hash is SHA-256 over all trainable arrays serialized as little-endian fp32 C-order in the frozen W1R parameter order:

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

A read returns payload only when both stored authority hash and stored model hash match the current authority/model.

Otherwise the read returns no payload.

## 12. Panel-A pair sets

Using the canonical 48 AH11 rows:

\[
\mathcal E_{P_2}
=
\{(i,j):P_{2,i}=P_{2,j}\}.
\]

Residue-collapse pairs:

\[
\mathcal E_R
=
\{(i,j):P_{2,i}=P_{2,j}, G_i=G_j\}.
\]

Residue-required hard pairs:

\[
\mathcal H_R
=
\{(i,j):P_{2,i}=P_{2,j}, G_i\ne G_j\}.
\]

Pair membership is computed from exact integer matrix tuples, never floating comparison.

The canonical \`(I,A,0)\` versus \`(A,I,0)\` pair must lie in \`\mathcal H_R\`.

## 13. Panel-B training pairs

Only \`R00\` through \`R05\` appear in the Panel-B loss.

\`\mathcal P_train\` contains every unordered pair among those six routes.

Validation, test, and reserved routes never enter any loss term, gradient calculation, checkpoint selection, early stopping decision, or hyperparameter decision.

## 14. W1R training loss

For continuous residue vectors:

\[
d^2(r_i,r_j)
=
\operatorname{mean}_k(r_{ik}-r_{jk})^2.
\]

Frozen margin:

~~~text
Delta = 1
~~~

Collapse:

\[
\operatorname{COLLAPSE}(r,\mathcal P)
=
\operatorname{mean}_{(i,j)\in\mathcal P}d^2(r_i,r_j).
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
\operatorname{COLLAPSE}(r_{\rm train},\mathcal E_R)
+
\operatorname{SEPARATE}(r_{\rm train},\mathcal H_R).
\]

Panel B:

\[
L_B=
\operatorname{SEPARATE}(r_{\rm train},\mathcal P_{\rm train}).
\]

Keep cost is the arithmetic mean of \`p_g\` over exactly:

~~~text
48 Panel-A rows
+ 6 Panel-B training rows
= 54 rows
~~~

with no per-panel reweighting:

\[
L_{\rm keep}
=
\frac1{54}
\sum_{\rm training\ rows}p_g.
\]

Total:

\[
\boxed{
L_{\rm W1R}=L_A+L_B+L_{\rm keep}
}
\]

with coefficient 1 on every term.

No hidden regularizer, reconstruction term, weight penalty, label smoothing, route decoder, entropy bonus, or auxiliary classifier is permitted.

## 15. Optimizer

The optimizer remains AdamW:

~~~text
lr           = 1e-3
betas        = (0.9, 0.999)
weight_decay = 0
eps          = 1e-8
steps        = 500
full_batch   = true
dtype        = fp32
~~~

No schedule, clipping, early stopping, checkpoint selection, gradient accumulation, mixed precision, or test-driven retry is permitted.

The state after exactly step 500 is the evaluated model.

## 16. K0 control

\`K0\` is a no-training structural control.

For every evaluated row:

~~~text
r_commit = int8[32](0)
g = 0
m_commit = z_commit || r_commit
~~~

Required structural outcomes:

### Panel A

Every pair in \`\mathcal H_R\` must collide under K0 residue:

~~~text
S_sep^K0 = 0
~~~

### Panel B

Every route pair must collide in residue under K0, including \`NORTH\` versus \`SOUTH\`.

If K0 separates a residue-required hard pair or reserved route pair:

~~~text
VOID_W1R_CONTROL_FAILURE
~~~

## 17. RB coarse-blind learned control

\`RB\` uses the exact same:

- 4,456-parameter architecture;
- initialization bytes for each seed;
- fp32 precision;
- query/authority one-hots;
- optimizer;
- 500-step budget;
- gate;
- int8 commit;
- W1R loss labels.

The only change is its source.

### Panel A RB source

RB receives the canonical 32-byte \`P2\` Keyhole, zero-padded to 64 fp32 values.

Therefore rows with equal \`P2\` receive byte-identical RB sources.

### Panel B RB source

RB receives:

~~~text
int8[1] || int8[63](0)
~~~

for every route, independent of route and authority-hidden bits.

During the revocation-independent control evaluation, RB uses the same semantic authority/query one-hots as W1R for the corresponding panel.

RB does not receive the full pre-collapse source.

RB is trained with the same \`L_W1R\` formula for exactly 500 steps. Since hard-pair members share identical RB inputs and identical semantic one-hots, deterministic RB output must remain identical within those coarse classes.

If committed RB residue separates any Panel-A hard pair or the reserved \`NORTH\`/\`SOUTH\` pair:

~~~text
VOID_W1R_CONTROL_FAILURE
~~~

The control is not rescued, retrained, reseeded, or widened.

## 18. Committed residue metrics

All scientific W1R distinction metrics operate directly on committed \`r_commit\` bytes.

No decoder, classifier, learned probe head, lookup table, nearest-neighbor index, symbolic route readout, or post-hoc threshold is introduced.

### Panel A

\[
C_{\rm hard}^{R}
=
\frac{
|\{(i,j)\in\mathcal H_R:r_i=r_j\}|
}{
|\mathcal H_R|
}.
\]

\[
S_{\rm sep}^{R}=1-C_{\rm hard}^{R}.
\]

\[
C_{\rm eq}^{R}
=
\frac{
|\{(i,j)\in\mathcal E_R:r_i\ne r_j\}|
}{
|\mathcal E_R|
}.
\]

Residue-use coverage:

\[
U_R
=
\frac{
|\{(i,j)\in\mathcal H_R:
r_i\ne r_j
\land
(g_i=1\lor g_j=1)\}|
}{
|\mathcal H_R|
}.
\]

Also report:

~~~text
gate_keep_rate_A
mean_B_used_A
hard_pair_count
same_target_coarse_pair_count
~~~

### Panel B

For each split, use only committed residue bytes:

\[
A_{\rm route}^{R}(S)
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
A_route_train^R
A_route_validation^R
A_route_test^R
A_route_reserved^R
G_heldout^R = A_route_train^R - A_route_test^R
gate_keep_rate_train
gate_keep_rate_validation
gate_keep_rate_test
gate_keep_rate_reserved
mean_B_used_train
mean_B_used_validation
mean_B_used_test
mean_B_used_reserved
~~~

For the reserved pair, separately report:

~~~text
reserved_pair_any_gate_open
reserved_pair_residue_different
~~~

## 19. Median-performance seed

For each W1R seed, construct:

~~~text
(C_hard^R, C_eq^R, seed)
~~~

Sort ascending lexicographically and take the middle record, index 2 of five.

That is the frozen median-performance seed.

No alternative median definition, averaging across seeds, best-seed selection, or tie-breaking metric is permitted.

All five seed records remain in the result artifact.

## 20. Revocation execution

Use the frozen \`NORTH\` and \`SOUTH\` pair.

For each W1R seed:

1. materialize each witness under \`FULL_STATUS\`, query \`Q2_AUTHORIZED_READ\`;
2. append \`AUTHORIZED_ACTIVE_RESIDUE\`;
3. change current authority to \`COMMON_ONLY\` without rematerialization;
4. attempt read of old memory;
5. required refusal mark: \`REVOKED_BUT_STALE_RESIDUE_PRESENT\`;
6. any returned payload increments \`L_revoke\`;
7. re-read the current \`COMMON_ONLY\` authorized source;
8. rematerialize using query \`Q2_AUTHORIZED_READ\`;
9. append \`AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED\`;
10. the two current rematerialized 64-byte memories must be equal;
11. inject the old FULL_STATUS memory using \`Q3_STALE_INJECTION_CONTROL\`;
12. required refusal mark: \`STALE_RESIDUE_REFUSED\`;
13. any returned payload increments \`L_revoke\`;
14. verify the pre-append ledger is an exact byte-prefix of the post-append ledger.

Rematerialization never reconstructs from stale \`r_old\`.

It re-reads the current authorized source.

No authorized source means no rematerialization.

W1R remains an interface-revocation test, not parameter unlearning or secure deletion.

## 21. Ledger serialization

Receipt serialization remains canonical UTF-8 JSON Lines:

~~~text
json.dumps(obj, sort_keys=True, separators=(",", ":")) + "\n"
~~~

Every append must satisfy exact prefix immutability:

~~~text
ledger_after.startswith(ledger_before) == true
~~~

No historical receipt may be edited, replaced, compacted, or reordered by the W1R runner.

## 22. Structural preflight and VOID precedence

Before the first optimizer step, the implementation must verify:

- 48 Panel-A rows in frozen order;
- Panel-B split 6/3/3/2 in frozen order;
- 4,456 trainable parameters;
- exact parameter names/shapes;
- exact enum widths and orders;
- canonical Keyhole bytes;
- same-\`P2\` Panel-A pairs have identical Keyholes;
- every Panel-B route has identical Keyhole;
- canonical AH11 witness is in \`\mathcal H_R\`;
- validation/test/reserved route ids are absent from the loss row set;
- no forbidden unique identifier appears in the learner input builder;
- K0 cannot separate the frozen hard/reserved pairs.

If multiple structural problems occur, result precedence is:

~~~text
1. VOID_W1R_KEYHOLE_LEAK
2. VOID_W1R_CONTROL_FAILURE
3. VOID_W1R_CONTRACT_DRIFT
~~~

A VOID execution is not converted into a scientific failure class.

## 23. Scientific failure / pass precedence

Assuming no VOID condition:

### First: revocation

If any seed has:

~~~text
L_revoke > 0
~~~

or fails current-view alignment / ledger-prefix / stale-injection structure, classify:

~~~text
FAIL_W1R_REVOCATION
~~~

### Second: residue necessity

If the median-performance seed has either:

~~~text
S_sep^R != 1
U_R != 1
~~~

or any seed has:

~~~text
reserved_pair_any_gate_open == false
~~~

classify:

~~~text
FAIL_W1R_NO_RESIDUE
~~~

### Third: held-out generalization

If the median-performance seed has:

~~~text
A_route_test^R != 1
~~~

or any seed has:

~~~text
A_route_reserved^R != 1
~~~

classify:

~~~text
FAIL_W1R_GENERALIZATION
~~~

### Otherwise

Classify:

~~~text
PASS_W1R_RESIDUE
~~~

The machine classification remains unreviewed until compared against \`SPEC.md\` and this file.

## 24. Compression firewall

Frozen source sizes remain:

~~~text
Panel A B_X = 8 bytes
Panel B B_X = 5 bytes
active capacity = 64 bytes
~~~

Therefore:

~~~text
compression_claim_authorized = false
~~~

must be written into every execution artifact.

If gates open, \`B_used=64\`.

If gates remain closed, \`B_used=32\`.

Neither is compression for these panels.

## 25. Execution artifact

The manual run writes one inner JSON result artifact with:

~~~text
status = UNREVIEWED_EXECUTION
result_language_authorized = false
compression_claim_authorized = false
~~~

and records at minimum:

- protocol SHA-256;
- execution-freeze SHA-256;
- implementation SHA-256;
- implementation commit SHA;
- Python and NumPy versions;
- BLAS thread environment;
- seed list;
- frozen row/split description;
- static preflight result;
- W1R metrics for all five seeds;
- RB metrics for all five seeds;
- K0 structural metrics;
- revocation receipts/summary for all five seeds;
- machine candidate result class;
- gate-use metrics;
- no-compression fields.

JSON serialization is:

~~~text
json.dumps(result, indent=2, sort_keys=True) + "\n"
~~~

The SHA-256 of those exact JSON bytes is reported in the workflow log.

GitHub artifact ZIP digest and inner JSON SHA-256 are hashes of different objects and must be recorded separately during review.

## 26. Workflow boundary

Pull-request CI for the future implementation PR may perform:

- Python syntax checks;
- static contract checks;
- parameter-count checks;
- Keyhole leak checks;
- K0 checks;
- split checks;
- forbidden-input checks;
- unit tests that do not call the optimizer.

Pull-request CI must not train W1R or RB.

The first optimizer step is permitted only after:

1. this execution freeze is merged to \`main\`;
2. the W1R implementation PR is separately merged green to \`main\`;
3. the manual W1R execution workflow is dispatched from \`main\`.

The workflow must be \`workflow_dispatch\` only and its job must refuse non-\`main\` refs.

No automatic push/PR event may execute training.

## 27. No-rerun rule

The first valid frozen execution is the W1R result-bearing execution.

A failed scientific outcome is retained.

Do not rerun because:

- a seed is inconvenient;
- residue gates stay closed;
- generalization fails;
- RB behaves unexpectedly but validly;
- metrics look ugly.

A rerun is allowed only for a documented infrastructure failure in which the scientific execution did not complete or the artifact is provably corrupt/unreadable.

Any change to architecture, loss, seed family, data split, serialization, optimizer, budget, gate threshold, pair sets, control source, or acceptance rule creates a new protocol/version.

## 28. Epistemic provenance boundary

The epistemic provenance layer merged after the W1R scientific protocol is **outside the learner input**.

Epistemic origin, confidence, evidence ids, lineage ids, authority receipt hashes, and provenance fingerprints may not enter \`E_theta\`, \`R_phi\`, or \`G_phi\`.

The raw frozen execution artifact is not rewritten to add memory metadata.

If a reviewed W1R result is later admitted into live NBG agent memory, it is wrapped externally as:

~~~text
origin = SIMULATED
retainable = true
reasoningUsable = true
actionAuthorized = false
~~~

with evidence references to the reviewed execution receipt and artifact digests.

That wrapper does not promote the experiment into an observed fact and does not modify the historical result bytes.

## 29. Result boundary

This file authorizes implementation only after merge.

It does not authorize a W1R result sentence.

A workflow success is not a scientific pass.

Only a reviewed execution satisfying the frozen protocol and this execution contract may receive one of the W1R result classes.
