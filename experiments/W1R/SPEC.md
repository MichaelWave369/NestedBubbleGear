# NBG-W1R v0.1.0 — Forced-Keyhole Residue Necessity

Status: protocol freeze candidate. Not a result. No W1R training has been run. No result language is authorized.

Parent result: NBG-W1 v0.1.0 reviewed `PASS_W1`, with the important negative finding that the residue gate never opened and the learned Keyhole remained nonminimal.

W1R is a **new experiment**. It does not modify, rerun, repair, or supersede W1.

## 1. Question

W1 showed that a soft collapse objective did not force the residue channel to earn its role. The learned Keyhole itself carried the distinctions required by the frozen pass rule.

W1R asks a narrower question:

> If the Keyhole is structurally restricted to the declared coarse observer, so two coarse-equivalent histories must have byte-identical Keyholes, can a bounded learned pre-collapse residue carry the hidden distinction, generalize it to the frozen held-out lineage tests, and obey the same revocation contract?

The supported positive claim, if W1R passes, is limited to the frozen toy architecture:

> Within the frozen W1R toy model, residue is architecturally necessary for the declared hidden distinctions because the Keyhole is byte-identical on every coarse-equivalent pair, the Keyhole-only and coarse-blind controls cannot separate those pairs, and the learned pre-collapse residue does.

No claim of biological memory, physical law, consciousness, secure deletion, or storage compression is permitted.

## 2. Architectural change from W1

W1 had:

[
X^{auth} ightarrow E_	heta ightarrow h ightarrow
egin{cases}
K_	heta(h) ightarrow z \\
R_phi(h,q,a) ightarrow r,g
end{cases}
]

W1R removes the learned Keyhole path.

The frozen W1R architecture is:

[
O(X^{auth}) ightarrow Z_{m coarse} ightarrow z
]

and separately:

[
X^{auth} ightarrow E_	heta ightarrow h
ightarrow R_phi(h,q,a) ightarrow r,g.
]

There is **no computational path from (X^{auth}), (h), or (r) into (z)** except through the declared coarse observer (O).

The Keyhole is deterministic and has no trainable parameters in W1R.

## 3. Three layers

[
L = 	ext{what happened}
]

[
Theta_R = {E_	heta,R_phi} = 	ext{how to retain bounded pre-collapse residue}
]

[
M_t=(z_t,r_t,g_t,	ext{metadata}) = 	ext{what is allowed to matter now}.
]

The ledger remains exact and append-only. The learned maps remain approximate. Active memory remains bounded and replaceable.

Probe policy (pi_psi) remains out of scope and belongs to NBG-W2.

## 4. Frozen Keyhole

### Panel A — AH11

The declared coarse observer is exactly (P_2).

Canonical Keyhole:

[
z_A
=
operatorname{pad}_{32}
left(
operatorname{rowmajor}(P_2)
ight).
]

The four signed matrix entries are serialized as `int8`, followed by 28 zero bytes.

Therefore:

[
P_2(X_i)=P_2(X_j)
Rightarrow
z_i=z_j
]

byte for byte.

### Panel B — lineage

The declared coarse observer is exactly:

~~~text
macro.status = READY
~~~

Canonical Keyhole:

[
z_B
=
operatorname{pad}_{32}([1]).
]

Every route in Panel B therefore has the exact same 32-byte Keyhole while `READY` is the current coarse observer.

### Structural invariant

For every coarse-equivalent pair:

[
z_i=z_j.
]

A single violation is not a model failure. It is a **void execution**, because the W1R information boundary was not implemented.

Required mark:

~~~text
VOID_W1R_KEYHOLE_LEAK
~~~

## 5. Residue source

The residue branch receives the authorized pre-collapse source.

### Panel A

Same canonical source as frozen W1 execution:

[
X_A
=
operatorname{rowmajor}(T_1)
Vert
operatorname{rowmajor}(T_2),
]

8 signed `int8` values, padded to 64 before (E_	heta).

The model does not receive symbolic (U), (V), raw (k), sample id, row id, receipt hash, or any unique lookup key.

### Panel B

Use the exact W1 structural route grammar and split:

~~~text
R00-R05  train
R06-R08  validation
R09-R11  test
NORTH     reserved
SOUTH     reserved
~~~

Route structural codes remain:

~~~text
R00-R11 -> codes 0-11
NORTH   -> code 12
SOUTH   -> code 13
~~~

Four route bits are encoded MSB-first with:

~~~text
0 -> -1
1 -> +1
~~~

FULL_STATUS authorized source:

~~~text
[READY, b3, b2, b1, b0]
~~~

TRIAGE:

~~~text
[READY, b3, b2, 0, 0]
~~~

COMMON_ONLY:

~~~text
[READY, 0, 0, 0, 0]
~~~

The symbolic route name never enters the learner.

## 6. Trainable maps and budget

The Keyhole has no learned parameters.

Trainable maps:

[
E_	heta:
64 ightarrow 32 ightarrow 32
]

with ReLU after each linear layer, and:

[
R_phi:
39 ightarrow 32
]

plus a gate:

[
G_phi:
39 ightarrow 1.
]

Residue input remains:

[
[h_{32},a_{m onehot,3},q_{m onehot,4}].
]

Frozen parameter count:

[
E:
(64cdot32+32)+(32cdot32+32)=3136
]

[
R+G:
(39cdot32+32)+(39+1)=1320
]

[
oxed{|Theta_R|=4456}.
]

The harness must assert 4456. A different count voids the rung.

Payload slots remain:

[
B_z=32	ext{ bytes},
qquad
B_r=32	ext{ bytes},
qquad
B_{m capacity}=64	ext{ bytes}.
]

Commit remains `int8[32]` for (z) and `int8[32]` for (r).

[
g=0Rightarrow r=mathbf 0.
]

Used bytes:

[
B_{m used}=32+32g.
]

Metadata remains exactly 67 bytes.

## 7. Frozen inherited mechanics

Unless this protocol explicitly changes a rule, W1R inherits the following exact execution semantics from W1 `EXECUTION.md` whose frozen SHA-256 is:

`71b8dcdb67f56a51970d82574238b6ee4f65c26b585d6baff4a23b338ce6d7e3`

Inherited without modification:

- `int8` commit rounding and clipping;
- gate training via sigmoid;
- commit threshold (p_gge0.5);
- authority/query enum widths;
- 67-byte metadata packing;
- authority-hash and model-hash read gating;
- canonical JSONL ledger;
- prefix immutability;
- stale-read refusal;
- authorized-source-only rematerialization;
- PCG64 seeds 0–4;
- Xavier-uniform weights and zero biases;
- fp32 training;
- AdamW with lr (10^{-3}), betas ((0.9,0.999)), weight decay 0, eps (10^{-8});
- 500 full-batch steps;
- no learning-rate schedule;
- no gradient clipping;
- no early stop;
- no checkpoint selection;
- no test-driven retry.

An execution freeze may make file-ordering and workflow/provenance details explicit, but may not alter these inherited scientific mechanics.

## 8. Query and authority classes

Authority classes remain:

~~~text
COMMON_ONLY
TRIAGE
FULL_STATUS
~~~

Query families remain four-wide.

W1R names them:

~~~text
Q0_AH11_RESIDUE
Q1_ROUTE_RESIDUE
Q2_AUTHORIZED_READ
Q3_STALE_INJECTION_CONTROL
~~~

No enum widening is permitted after the freeze.

## 9. Panel A pair sets

Use the frozen 48 AH11 histories.

Define:

[
mathcal E_{P_2}
=
{(i,j):P_{2,i}=P_{2,j}}.
]

Within a coarse class, define:

[
mathcal E_R
=
{(i,j):P_{2,i}=P_{2,j}, G_i=G_j},
]

and:

[
mathcal H_R
=
{(i,j):P_{2,i}=P_{2,j}, G_i
e G_j}.
]

(mathcal H_R) is the residue-required hard set.

The canonical ((I,A)) versus ((A,I)) witness must belong to (mathcal H_R).

Because (z_i=z_j) for every pair in (mathcal H_R), successful committed-memory separation on (mathcal H_R) must come from (r).

## 10. Panel B split

The frozen lineage ensemble remains:

| Split | Routes | Count |
|---|---|---:|
| train | `R00`–`R05` | 6 |
| validation | `R06`–`R08` | 3 |
| test | `R09`–`R11` | 3 |
| reserved | `NORTH`, `SOUTH` | 2 |

All route labels share the same frozen Keyhole while FULL_STATUS is authorized:

[
z_{m route}=z_{m READY}.
]

The reserved pair remains test-only.

## 11. Mandatory controls

### Control K0 — Keyhole only

Set:

[
r=mathbf 0
]

for every sample.

Because W1R freezes the Keyhole to the coarse observer:

[
S_{m sep}^{K0}=0
]

on (mathcal H_R).

For Panel B, all route memories also collide under K0.

If K0 separates a residue-required pair, the harness is invalid.

### Control RB — coarse-blind residue

Use the exact same 4456-parameter residue architecture, seeds, optimizer, steps, and byte budget, but replace the authorized pre-collapse source with the coarse observer padded to 64.

Thus RB receives no information unavailable to (z).

For any pair with the same coarse observer:

[
X^{RB}_i=X^{RB}_j.
]

Therefore deterministic RB output must also be equal.

RB is a structural negative control for pre-collapse access.

If RB separates a frozen hard pair or the reserved `NORTH`/`SOUTH` pair, the harness is invalid.

No post-hoc baseline selection is permitted.

## 12. Training objective

The Keyhole is frozen and receives no gradient.

Training acts only on (Theta_R).

Continuous residue used in the loss:

[
r_{m train}=p_g,r_{m raw},
qquad
p_g=sigma(ell_g).
]

Frozen squared distance:

[
d^2(r_i,r_j)
=
operatorname{mean}_k(r_{ik}-r_{jk})^2.
]

Frozen margin:

[
Delta=1.
]

Collapse:

[
operatorname{COLLAPSE}(r,mathcal P)
=
operatorname{mean}_{(i,j)inmathcal P} d^2(r_i,r_j).
]

Separate:

[
operatorname{SEPARATE}(r,mathcal P)
=
operatorname{mean}_{(i,j)inmathcal P}
max(0,Delta-d^2(r_i,r_j)).
]

Panel A:

[
L_A
=
operatorname{COLLAPSE}(r,mathcal E_R)
+
operatorname{SEPARATE}(r,mathcal H_R).
]

Panel B training:

[
L_B
=
operatorname{SEPARATE}
(r,mathcal P_{m train}),
]

where (mathcal P_{m train}) contains every unordered distinct-route pair among `R00`–`R05`.

Keep cost:

[
L_{m keep}=operatorname{mean}(p_g)
]

over Panel A rows and Panel B training rows.

Total:

[
oxed{
L_{m W1R}
=
L_A+L_B+L_{m keep}
}
]

with unit coefficients.

Validation, test, and reserved routes do not appear in the loss.

## 13. Committed evaluation

No learned decoder, classifier, lookup table, or nearest-neighbor index is introduced.

Evaluation acts directly on committed bytes.

For Panel A:

[
C_{m hard}^{R}
=
rac{
|{(i,j)inmathcal H_R:r_i=r_j}|
}{
|mathcal H_R|
}.
]

[
S_{m sep}^{R}=1-C_{m hard}^{R}.
]

Also report residue over-retention within coarse-equivalent same-target pairs:

[
C_{m eq}^{R}
=
rac{
|{(i,j)inmathcal E_R:r_i
e r_j}|
}{
|mathcal E_R|
}.
]

For every hard pair, also record whether at least one endpoint opened its residue gate.

Define:

[
U_R
=
rac{
|{(i,j)inmathcal H_R:
r_i
e r_j
land
(g_i=1lor g_j=1)}|
}{
|mathcal H_R|
}.
]

A residue-necessity result requires:

[
U_R=1.
]

## 14. Held-out route evaluation

For each split (S), route residue separation is:

[
A_{m route}^{R}(S)
=
1-
rac{
#{	ext{distinct-route pairs with equal committed }r}
}{
#{	ext{distinct-route pairs}}
}.
]

Report:

~~~text
A_route_train^R
A_route_validation^R
A_route_test^R
A_route_reserved^R
G_heldout^R = A_route_train^R - A_route_test^R
~~~

Because (z) is identical across the route panel, route-memory separation is residue separation.

The reserved `NORTH`/`SOUTH` pair must also record whether at least one gate opened.

## 15. Revocation

Use the same frozen `NORTH`/`SOUTH` witness and the same authority transition pattern as W1.

1. Materialize under FULL_STATUS.
2. Append `AUTHORIZED_ACTIVE_RESIDUE`.
3. Revoke to COMMON_ONLY without refresh.
4. Old memory must refuse.
5. Count any returned payload as one (L_{m revoke}) violation.
6. Re-read the COMMON_ONLY authorized source.
7. Rematerialize.
8. Append `AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED`.
9. Current `NORTH` and `SOUTH` memories must now be equal.
10. Inject old FULL_STATUS memory using stale-control query.
11. Required refusal: `STALE_RESIDUE_REFUSED`.
12. Prior ledger bytes remain an exact prefix.

All five seeds require:

[
L_{m revoke}=0.
]

W1R remains an interface-revocation experiment, not parameter unlearning.

## 16. Frozen acceptance rule

The rung is **VOID**, not failed, if any structural control is violated:

- any coarse-equivalent pair has different (z);
- K0 separates a residue-required pair;
- RB separates a residue-required pair;
- parameter count differs from 4456;
- a forbidden unique identifier enters the model;
- a frozen split changes;
- a held-out route enters the loss.

Assuming the run is valid, W1R passes only if all of the following hold:

1. the median-performance W1R seed has:

[
S_{m sep}^{R}=1;
]

2. the same median seed has:

[
U_R=1;
]

3. the same median seed has:

[
A_{m route,test}^{R}=1;
]

4. **every** seed has:

[
A_{m route,reserved}^{R}=1;
]

5. **every** seed has at least one open residue gate on the reserved pair;

6. **every** seed has:

[
L_{m revoke}=0;
]

7. K0 and RB remain unable to separate the frozen hard/reserved pairs.

Median-performance seed is selected by sorting:

[
(C_{m hard}^{R},C_{m eq}^{R},s)
]

ascending and taking the middle record.

No seed may be discarded or rerun because its result is inconvenient.

## 17. Result classes

A reviewed execution may receive one of these scoped machine/result classes:

~~~text
PASS_W1R_RESIDUE
FAIL_W1R_NO_RESIDUE
FAIL_W1R_GENERALIZATION
FAIL_W1R_REVOCATION
VOID_W1R_KEYHOLE_LEAK
VOID_W1R_CONTROL_FAILURE
VOID_W1R_CONTRACT_DRIFT
~~~

A workflow success is not itself a scientific PASS.

## 18. Compression firewall

W1R reuses sources of size:

[
B_X^A=8	ext{ bytes},
qquad
B_X^B=5	ext{ bytes}.
]

The active slot capacity remains 64 bytes.

Therefore W1R cannot make a storage-compression claim.

If residue opens, actual used payload is 64 bytes. If it stays closed, used payload is 32 bytes.

Neither case is compression on these panels.

## 19. Authorized positive result sentence template

Only if the reviewed frozen run satisfies `PASS_W1R_RESIDUE` may a result sentence of this form be committed:

> On the frozen W1R toy ensembles, a structurally coarse Keyhole was byte-identical on every declared coarse-equivalent pair, the Keyhole-only and coarse-blind controls could not separate the hidden distinctions, and a bounded learned pre-collapse residue separated the frozen hard pairs and held-out lineage witnesses while producing zero unauthorized readouts in the frozen revocation harness.

The result must additionally report gate usage, all seed-wise failures, residue over-retention, and the no-compression firewall.

## 20. Out of scope

W1R does not test:

- learned probe choice;
- governed online gradient acceptance;
- machine unlearning;
- globally minimal residue;
- arbitrary long-term memory;
- semantic understanding;
- real-world privacy;
- biological memory;
- consciousness;
- fundamental physics.

## 21. Firewall

W1R is a finite toy-model test of **residue necessity under a structurally frozen coarse Keyhole**.

A pass would show that the learned residue was necessary **inside this frozen architecture and task family**.

It would not show that all intelligent systems require such residue or that nature implements NBG memory this way.
