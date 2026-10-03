# Frozen AH2→AH16 Experiment Dossiers

This directory indexes the verified frozen experiment packages that underpin the current AH ladder.

## Integrity note

The original ZIP packages were re-hashed locally before this import. The SHA-256 values below identify those exact frozen artifacts.

The current GitHub connector write path does not accept a local binary ZIP path directly, so this PR **does not falsely claim the ZIP bytes themselves are stored in the repository**. Instead it imports exact archive identities and result dossiers. Binary archival upload remains a separate mechanical step.

| Rung | Verdict | Checks | Tests | Frozen ZIP SHA-256 |
|---|---|---:|---:|---|
| AH2 | PASS_AH2 | 29/29 | 6/6 | `55e243b9e78a5884284a54bf431537af6d1d1793da3601cddb5b2e31bc10d7f3` |
| AH3 | PASS_AH3 | 89/89 | 7/7 | `13143744580f1f44cf482b59a457effacc6b043a2eabeb12c83f37f079ccc86f` |
| AH4 | PASS_AH4 | 44/44 | 8/8 | `e5b9ebea0b9e30b52dae3fc9167ccb1da021df872f1aa3dafb676d77ec1a69bf` |
| AH5 | PASS_AH5 | 36/36 | 8/8 | `88df41892f5d16068cb323657275ad8ec6dcb0c7951ed9f0c278ab0f991d4141` |
| AH6 | PASS_AH6 | 41/41 | 9/9 | `912a0c2df491480fe632dc03ae5f00bff7a133da2cc9d687b5f7b8c05e3aa5fb` |
| AH7 | PASS_AH7 | 65/65 | 9/9 | `7b2afc2b9e5d8c1a4c6762e352e22fb4ddaa04d7ee98a7c4b79ab24c3976666c` |
| AH8 | PASS_AH8 | 63/63 | 10/10 | `bccba3c5dbeb43ef6f55cedcac20d622d3e75e157a6ff9a206f00abc7ef1e603` |
| AH9 | PASS_AH9 | 106/106 | 10/10 | `9c1280b6d63bb0164d305a4e7e4c99a3601512c5c57f064be07200933782bb29` |
| AH10 | PASS_AH10 | 158/158 | 11/11 | `596a4295a05381b0cb24224b98157787859e70925e40623a67d4ab16879f5df0` |

## AH2 — Latent causal residue

Present observational equivalence did not determine whether a hidden difference was inert, erased, or latent.

- `I(X0;T|Y0)=2.584962500721155 bits = log2(6)`
- gauge control: 0 predictive bits
- erased control: 0 predictive bits
- minimum closing descriptor: `DELAY_SIGN`
- leakage reached the complete target by step 3

## AH3 — Boundary-transferred latent residue

The explicit interface used `r=p*s`, with parent sign `s`, interface polarity `p`, and transmitted sign `r`.

- `I(s;T|d)=0`
- `I(p;T|d)=0`
- `I((s,p);T|d)=1 bit`
- `I(r;T|d)=1 bit`
- minimum prediction descriptor: `DELAY_TRANSMITTED_SIGN`
- exact ancestry recovery: `TRANSMITTED_SIGN_POLARITY`

## AH4 — Observable return without full-state return

Two return paths share the same visible endpoint and end-to-end polarity product while retaining different hidden phase.

- `I(endpoint_sign;T)=0`
- `I(path_product;T)=0`
- `I(phase;T)=1 bit`
- minimum future descriptor: `DELAY_PHASE`

## AH5 — Noncommuting interface order

For the frozen matrices, reversing order preserves the declared endpoint observation while changing the hidden full state.

- `I(order;T|Y)=1 bit`
- unordered inventory contributes 0 bits
- erasure removes the effect
- commuting control removes the effect

## AH6 — Closed commutator loop

The frozen loop satisfies:

```text
π(Lx) = π(x)
while
Lx != x
```

A common downstream probe reveals the hidden loop residue. The commuting control returns exact identity.

## AH7 — Oriented holonomy cancellation

Clockwise and counterclockwise loops are identical through the coarse endpoint observer but retain different oriented residue.

- exact inverse cancellation: `L^-1 L x = L L^-1 x = x`
- downstream relation: `T = S * R`
- relational pair carries the predictive bit

## AH8 — Plaquette transport / curvature proxy

Two neighboring local plaquettes are individually nontrivial while the full outer boundary is exactly trivial.

- `P_L != I`
- `P_R != I`
- `P_R P_L = P_L P_R = I`
- `P_outer = I`
- `K_L != 0`, `K_R != 0`, `K_outer = 0`
- the curvature object is explicitly a **toy diagnostic**, not physical curvature

## AH9 — Basepoint transport / local-to-global composition

Local loop operators based at different vertices were composed against a directly computed outer boundary.

- transported reconstruction: 12/12
- naive local product correct only in the 4 commuting controls
- for connector `T=BA`, correct and naive traces split 6 vs 3
- for connector `T=S`, correct global boundary is identity while naive composition is nonidentity

## AH10 — Three-plaquette transport / composition order

Three native local loops were connected through two explicit basepoint paths.

- transported reconstruction: 16/16
- left-grouped transported composition: 16/16
- right-grouped transported composition: 16/16
- connector-free `CBA`: correct only 1/16
- omit-second-connector reconstruction: correct only 4/16
- omit-first-connector reconstruction: correct only 4/16
- for `T1=A, T2=B`, correct outer trace is 7 vs naive trace 6
- for `T1=B, T2=S`, correct outer boundary is identity while all three wrong reconstructions are nonidentity

## Claim firewall

Every result above is an exact property of a frozen finite construction. None is empirical evidence that physical horizons, spacetime, cosmology, or quantum gravity implement these mechanisms.


## AH11 — Path compression and minimal connector memory

AH11 asks how much connector history must be retained after AH10 established that full path history is sufficient.

Frozen result:

- 48 labeled path histories;
- 13 distinct global operators;
- global entropy: 3.625 bits;
- task residue `RΓ = H3^(0) H2^(0)`: 13 classes, sufficient;
- cumulative endpoint transport `P2 = T1 T2`: 13 classes, **insufficient**;
- `H(G|RΓ)=0`;
- `H(G|P2)=0.25 bits`.

The key control is that `RΓ` and `P2` have the same class count and the same Shannon entropy, but preserve different distinctions.

So in this frozen task:

> equal storage capacity does not imply equal causal sufficiency.

Package SHA-256:

`8838f3ac961079f17b1e39cd6d9ab8b288119584388448da56721bfd867f37cc`

Claim boundary: the "coarsest sufficient" statement applies only to the preregistered descriptor family in the finite AH11 ensemble.


## AH12 — Task-dependent memory

AH12 holds the 48-path ensemble fixed and changes only the permitted future query family.

Frozen coarsest sufficient candidates:

- global operator (G): residue (R_Γ), 13 classes, 3.625 bits;
- transported (H_2): (H_2), 3 classes, 1.5 bits;
- transported (H_3): (H_3), 9 classes, 3.077819531115 bits;
- cumulative path (P_2): (P_2), 13 classes, 3.625 bits;
- broad query tuple ((G,H_2,H_3,P_2)): action pair, 15 classes, 3.875 bits.

Cross-task failures:

```text
H(G | RΓ)  = 0
H(H2 | RΓ) = 0.25 bits
H(P2 | RΓ) = 0.25 bits
H(G | P2)  = 0.25 bits
```

The supported conclusion is task-indexed:

```text
R_Q(Gamma)
```

A compression exact for one allowed future query can be lossy for another.

Package SHA-256:

`6bb16f7c3d61202a50c885e3e70c399f7a871f59929143ebb9ceba839669ae4c`

Claim boundary: this is a finite partition/sufficiency result over the frozen descriptor family, not a universal theory of cognition or AI memory.


## AH13 — Authorized query memory

AH13 adds an authority boundary to AH12's query-indexed memory.

Full capability memory uses the transported action pair:

- 15 classes;
- 3.875 bits;
- sufficient for `(G,H2,H3,P2)`.

Restricted roles retain coarser sufficient descriptors:

- GLOBAL_OPERATOR → residue, 13 classes, 3.625 bits;
- INTERFACE_INSPECTOR → H2, 3 classes, 1.5 bits;
- DOWNSTREAM_INSPECTOR → H3, 9 classes, 3.077819531114783 bits;
- ROUTE_AUDITOR → cumulative P2, 13 classes, 3.625 bits.

For every restricted role, selected memory has zero excess unauthorized leakage above the unavoidable correlation floor in the frozen ensemble. Full-capability action memory over-retains positive excess information.

Sharp witness:

`H(G | H2) = 2.375 bits`

while:

`H(H2 | H2) = 0`

So the substrate can be capable of answering the global query even when a role-specific memory intentionally does not preserve that answer.

Package SHA-256:

`8c204d74ae76c1ae783759060b377fa4044145c7405dc680b88d790fb9cd4e76`

Claim boundary: this is a retention-policy result, not secure deletion, cryptographic access control, noninterference, or differential privacy.


## AH14 — Revocation and memory downgrade

AH14 makes authority change over time and separates permission revocation from representation-level memory minimization.

Frozen result:

- 48 histories;
- old full-capability action memory: 15 classes, 3.875 bits;
- all four full-to-role downgrades are deterministic functions of the old memory;
- every still-authorized query remains exact;
- revoked-query answers become unresolved in the declared downgraded descriptor;
- qualification: 43/43 checks, 15/15 tests, replay exact.

Receipt control:

```text
new-state receipt:
H(Y_revoked | D_new, R_new) = H(Y_revoked | D_new) > 0

old-state commitment:
H(Y_revoked | D_new, R_old) = 0
```

All 15 SHA-256 commitments to old action-memory classes are unique in the frozen enumerable domain. This is an enumeration result, not a SHA-256 inversion result.

Package SHA-256:

`921d4e091984fb8d3122d35d2e25f05d436eff2dd9659dd90ea3e968bdb0aa0e`

Claim boundary: AH14 demonstrates representation-level downgrade and receipt semantics, not secure deletion from physical storage or external systems.


## AH15 — Revocation chains, path independence, and reauthorization barriers

AH15 extends AH14 from one-step downgrade to multi-step authority changes.

Frozen monotone chain:

```text
FULL -> ROUTE_DOWNSTREAM -> DOWNSTREAM
15 classes -> 13 classes -> 9 classes
3.875 bits -> 3.625 bits -> 3.077819531114783 bits
```

Direct and sequential downgrade agree exactly:

```text
FULL -> H3
=
FULL -> P2 -> H3
```

and produce byte-identical final-state receipts.

Lateral reauthorization barriers:

```text
H(P2 | RΓ) = 0.25 bits
H(G  | P2) = 0.25 bits
```

So GLOBAL→ROUTE and ROUTE→GLOBAL are not locally reconstructible after the relevant distinctions have been forgotten.

Receipt-chain control:

```text
H(P2 | H3) = 0.5471804688852168 bits
H(P2 | H3, R_final) = 0.5471804688852168 bits
H(P2 | H3, R_mid) = 0
```

The intermediate P2 receipt has 13/13 unique frozen hashes, so exhaustive lookup in the tiny known domain restores the route class. This is an enumeration result, not a SHA-256 inversion result.

Package SHA-256:

`69aee683f5ce416169dab5c7aa51d8b157cda6fab08002c16f568ff4e5bb47dd`

Claim boundary: AH15 demonstrates finite representation-level downgrade composition and receipt leakage, not secure deletion or cryptographic revocation.


## AH16 — External authority reauthorization and selective handoff

AH16 adds a separately governed higher-authority store after AH15 demonstrated local reauthorization barriers.

Frozen authority store:

- `action = (H2,H3)`;
- 15 classes;
- 3.875 bits;
- sufficient for the complete frozen query tuple.

Four grants begin with positive local uncertainty but resolve exactly with authority-store participation:

```text
GLOBAL -> ROUTE       H(P2 | RΓ) = 0.25
ROUTE -> GLOBAL       H(G  | P2) = 0.25
INTERFACE -> GLOBAL   H(G  | H2) = 2.375
DOWNSTREAM -> ROUTE   H(P2 | H3) = 0.5471804688852168
```

For all four:

```text
H(Q_new | D_local, D_escrow) = 0
H(Q_new | D_release) = 0
```

The handoff returns only the target-role descriptor (`P2` or `RΓ`), which has zero excess leakage relative to the authorized target answer. Returning the full escrow action over-retains 0.25 bits for the GLOBAL/ROUTE target roles.

Degraded-store controls show that reauthorization power depends on what the higher-authority store actually retained.

Package SHA-256:

`3314bc18b7c21dee9acee4134b008fab4136de06ec32eb5387d1a7331fdb8c70`

Claim boundary: AH16 is a finite sufficiency/leakage result. It does not establish secure escrow isolation, cryptographic access control, secure deletion, or real-world authorization enforcement.
