# NBG-W1 v0.1.0 — Execution Freeze

Status: implementation contract only. No W1 training is authorized by this file until this execution freeze is merged to `main`.

This document resolves implementation degrees of freedom left open by `SPEC.md`. It does not change the scientific claim, byte budgets, architecture, optimizer, seeds, panels, baselines, or claim firewall frozen in NBG-W1 v0.1.0.

## 1. Canonical authorized sources

All model inputs are signed `int8`, cast to fp32 for training, then zero-padded to 64 values. Symbolic sample ids, route labels, event ids, receipt hashes, and lineage ids are never model inputs.

### Panel A — AH11

The authorized source is the raw path pair only:

[
X_A = operatorname{rowmajor}(T_1) Vert operatorname{rowmajor}(T_2).
]

This is exactly 8 signed `int8` values before padding.

[
B_X^{A}=8	ext{ bytes},qquad CR_A=64/8=8.
]

Therefore Panel A is **not** a compression result even if W1 passes.

The model does not receive (U), (V), raw (k), (P_2), (R_Gamma), or (G_partial) as input features. (P_2) and (G_partial) are evaluation/training targets only where the frozen objective permits them.

### Panel B — NBG-T1-derived route grammar

The symbolic labels `R00`–`R11`, `NORTH`, and `SOUTH` are ledger/probe labels only. They never enter the net.

The latent route content is a four-step structural path code.

- `R00`–`R11` map to integer codes 0–11.
- reserved `NORTH` maps to code 12.
- reserved `SOUTH` maps to code 13.
- encode the four bits MSB-first;
- bit 0 serializes as (-1);
- bit 1 serializes as (+1).

The canonical FULL_STATUS source is:

~~~text
[READY, b3, b2, b1, b0]
~~~

with `READY = 1`.

Authority projections are frozen:

~~~text
COMMON_ONLY -> [1, 0,  0,  0,  0]
TRIAGE      -> [1, b3, b2, 0,  0]
FULL_STATUS -> [1, b3, b2, b1, b0]
~~~

Thus:

[
B_X^{B}=5	ext{ bytes},qquad CR_B=64/5=12.8.
]

Panel B is also **not** a compression result.

The structural four-bit path is latent state content. The route name is not an input key.

## 2. Query and authority enums

Authority byte:

~~~text
0 = COMMON_ONLY
1 = TRIAGE
2 = FULL_STATUS
~~~

Query-family byte:

~~~text
0 = Q0_AH11_GLOBAL
1 = Q1_PROBE_LATENT_ROUTE
2 = Q2_AUTHORIZED_READ
3 = Q3_STALE_INJECTION_CONTROL
~~~

The one-hot vectors presented to (R_phi) follow those byte orders exactly.

## 3. Initialization

For each frozen seed (sin{0,1,2,3,4}):

- use NumPy PCG64 initialized with (s);
- initialize every linear weight independently with Xavier uniform:

[
W_{ij}sim Uleft[-sqrt{rac{6}{n_{in}+n_{out}}},sqrt{rac{6}{n_{in}+n_{out}}}ight];
]

- every bias begins at exactly 0;
- W1, (M_{	ext{recon}}), and (M_{	ext{noncausal}}) begin from identical parameter bytes for the same seed.

No pretrained state is permitted.

## 4. Training-time gate and committed gate

For training:

[
p_g=sigma(ell_g)
]

and the differentiable active residue is:

[
r_{	ext{train}}=p_g,r_{	ext{raw}}.
]

The training-time memory is:

[
m_{	ext{train}}=[zVert r_{	ext{train}}].
]

At commit:

[
g=mathbf 1[p_gge0.5].
]

If (g=0), committed (r) is exactly 32 zero bytes.

## 5. int8 commit

There is no learned scale, per-vector scale, zero point, calibration pass, or post-hoc quantizer.

For every scalar (x):

[
q_8(x)=operatorname{int8}left(operatorname{clip}(operatorname{rint}(x),-127,127)ight).
]

`rint` is round-to-nearest with ties-to-even.

Commit:

~~~text
z_commit = q8(z)
r_commit = q8(r_raw) if g == 1 else int8[32](0)
m_commit = z_commit || r_commit
~~~

The committed causal payload is exactly 64 bytes.

## 6. Metadata serialization

Metadata is exactly 67 bytes, in this order:

~~~text
byte 0      gate g
byte 1      semantic authority enum
byte 2      query enum
bytes 3:35  raw SHA-256 authority hash
bytes 35:67 raw SHA-256 model hash
~~~

Authority hash is SHA-256 over:

~~~text
b"NBG-W1\0AUTH\0" || authority_enum_u8
~~~

Model hash is SHA-256 over all trained parameter arrays serialized as little-endian fp32 in this fixed order:

~~~text
E1.weight, E1.bias,
E2.weight, E2.bias,
K.weight,  K.bias,
R.weight,  R.bias,
G.weight,  G.bias
~~~

A read succeeds only when the stored authority hash and model hash both match the current authority/model. Otherwise it returns a refusal and no payload.

## 7. Pair sets for Panel A

For unordered pairs of the 48 AH11 histories:

[
mathcal E_G={(i,j):G_i=G_j}
]

is the task-equivalent set.

[
mathcal E_{P_2}={(i,j):P_{2,i}=P_{2,j}}
]

is the coarse-Keyhole equivalence set.

[
mathcal H={(i,j):P_{2,i}=P_{2,j}, G_i
e G_j}
]

is the hard causal-distinction set.

The canonical ((I,A)) versus ((A,I)) witness must be in (mathcal H).

## 8. Distance and losses

For continuous vectors:

[
d^2(y_i,y_j)=operatorname{mean}_k (y_{ik}-y_{jk})^2.
]

Frozen separation margin:

[
Delta=1.
]

For a pair set (mathcal P):

[
operatorname{COLLAPSE}(y,mathcal P)
=
operatorname{mean}_{(i,j)inmathcal P}d^2(y_i,y_j),
]

[
operatorname{SEPARATE}(y,mathcal P)
=
operatorname{mean}_{(i,j)inmathcal P}
max(0,Delta-d^2(y_i,y_j)).
]

### W1 loss

Panel A contributes:

- Keyhole collapse: (operatorname{COLLAPSE}(z,mathcal E_{P_2}));
- causal distinction: (operatorname{SEPARATE}(m_{	ext{train}},mathcal H));
- future-task term:

[
rac12left[
operatorname{COLLAPSE}(m_{	ext{train}},mathcal E_G)
+
operatorname{SEPARATE}(m_{	ext{train}},{(i,j):G_i
e G_j})
ight].
]

Panel B training uses only `R00`–`R05`:

- all train routes share the same coarse `READY` state, so all unordered train-route pairs contribute to Keyhole collapse on (z);
- all distinct train-route pairs contribute to causal distinction on (m_{	ext{train}}).

Combine:

[
mathcal L_{	ext{collapse}}
=
rac12(L^{A}_{	ext{collapse}}+L^{B}_{	ext{collapse}}),
]

[
mathcal L_{	ext{distinction}}
=
rac12(L^{A}_{	ext{distinction}}+L^{B}_{	ext{distinction}}),
]

[
mathcal L_{	ext{future}}=L^{A}_{	ext{future}},
]

[
mathcal L_{	ext{keep}}
=
operatorname{mean}(p_g)
]

over W1 Panel A plus Panel B training rows.

The already-frozen total remains:

[
mathcal L
=
mathcal L_{	ext{collapse}}
+mathcal L_{	ext{distinction}}
+mathcal L_{	ext{future}}
+mathcal L_{	ext{keep}}.
]

Validation/test routes and the reserved pair do not appear in any loss term.

## 9. Baseline objectives

Baselines are Panel-A controls. They train on the same 48 AH11 authorized inputs and use the same initialization, parameter count, fp32 precision, AdamW configuration, 500 steps, and seed.

### (M_{	ext{recon}})

Use:

[
mathcal L_{	ext{recon}}
=
operatorname{MSE}(m_{	ext{train}},X_A^{64}),
]

where (X_A^{64}) is the zero-padded 64-value input cast to fp32.

No W1 causal loss is added.

### (M_{	ext{noncausal}})

This baseline sees (P_2) classes but never (G_partial).

Use:

[
mathcal L_{	ext{noncausal}}
=
rac12left[
operatorname{COLLAPSE}(m_{	ext{train}},mathcal E_{P_2})
+
operatorname{SEPARATE}(m_{	ext{train}},{(i,j):P_{2,i}
e P_{2,j}})
ight].
]

No (G_partial) target enters this baseline loss.

## 10. AdamW details

The frozen optimizer remains AdamW with:

~~~text
lr = 1e-3
betas = (0.9, 0.999)
weight_decay = 0
eps = 1e-8
steps = 500
full_batch = true
~~~

No learning-rate schedule, gradient clipping, early stopping, checkpoint selection, or test-driven retry is permitted.

## 11. Committed-memory evaluation

No learned decoder, classifier, probe head, or nearest-neighbor table is introduced.

All W1 task metrics operate directly on committed 64-byte memories.

Exact memory equality means byte-for-byte equality of (m_{	ext{commit}}).

### Panel A

Define:

[
C_{	ext{eq}}
=
rac{
|{(i,j)inmathcal E_G:m_i
e m_j}|
}{
|mathcal E_G|
}
]

and:

[
C_{	ext{hard}}
=
rac{
|{(i,j)inmathcal H:m_i=m_j}|
}{
|mathcal H|
}.
]

Then:

[
S_{	ext{sep}}=1-C_{	ext{hard}}
]

and frozen task error is:

[
E_A=rac12(C_{	ext{eq}}+C_{	ext{hard}}).
]

Every hard pair must be separated by the accepted W1 seed:

[
S_{	ext{sep}}=1.
]

Evaluate (P_2), (M_{	ext{recon}}), and (M_{	ext{noncausal}}) with the same (E_A) definition.

### Panel B

For a split (S), route separation accuracy is the fraction of unordered pairs with different latent routes whose committed memories are not byte-identical:

[
A_{	ext{route}}(S)
=
1-
rac{#	ext{colliding distinct-route pairs}}{#	ext{distinct-route pairs}}.
]

Report:

~~~text
A_route_train
A_route_validation
A_route_test
A_route_reserved
G_heldout = A_route_train - A_route_test
~~~

The reserved score is the single `NORTH` versus `SOUTH` pair.

The model is being tested for retained distinguishability. It is not required to emit the symbolic route string, and no route-name decoder exists.

## 12. Revocation and stale injection

Use the reserved `NORTH` and `SOUTH` witness.

1. Materialize under `FULL_STATUS` with query `Q2_AUTHORIZED_READ`.
2. Append `AUTHORIZED_ACTIVE_RESIDUE` receipt.
3. Change authority to `COMMON_ONLY` without rematerialization.
4. Attempt read of old memory. Required refusal: `REVOKED_BUT_STALE_RESIDUE_PRESENT`.
5. Count any returned payload here as one (L_{	ext{revoke}}) violation.
6. Re-read the COMMON_ONLY authorized source and rematerialize.
7. Append `AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED`.
8. The two rematerialized current memories must be equal because route content is no longer authorized.
9. Historical ledger receipts remain append-only.
10. Inject the old FULL_STATUS active memory after revocation using query `Q3_STALE_INJECTION_CONTROL`.
11. Required refusal: `STALE_RESIDUE_REFUSED`.
12. Any returned payload increments (L_{	ext{revoke}}).

Ledger receipts are canonical UTF-8 JSON Lines:

~~~text
json.dumps(obj, sort_keys=True, separators=(",", ":")) + "\n"
~~~

At every append:

[
L_{	ext{before}}
]

must be an exact byte-prefix of:

[
L_{	ext{after}}.
]

## 13. Seed aggregation and acceptance

For each seed (s), define:

[
E_{	ext{strong},s}
=
min(E_{	ext{recon},s},E_{	ext{noncausal},s})
]

and:

[
D_s=E_{	ext{strong},s}-E_{	ext{W1},s}.
]

The baseline condition passes iff:

[
operatorname{median}_{sin{0,1,2,3,4}}D_s>0.
]

Choose the W1 median-performance seed by sorting ((E_{	ext{W1},s},s)) and taking the middle record. That seed must have:

~~~text
S_sep = 1
A_route_test = 1
~~~

Every seed must have:

~~~text
L_revoke = 0
A_route_reserved = 1
~~~

All metrics for all seeds are retained. No seed may be discarded or rerun because its result is inconvenient.

## 14. Result boundary

This execution freeze authorizes implementation only after it is merged.

The implementation PR may add source, static contract tests, and a main-branch execution workflow, but its pull-request CI must not train W1.

The first optimizer step is permitted only from the merged execution contract on `main`.

A workflow run is not itself an authorized result sentence. Results must be reviewed against `SPEC.md` and this file before any PASS/FAIL claim is committed.
