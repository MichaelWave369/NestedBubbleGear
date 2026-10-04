# Frozen AH2→AH34 Experiment Dossiers

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
| AH11 | PASS_AH11 | 34/34 | 12/12 | `8838f3ac961079f17b1e39cd6d9ab8b288119584388448da56721bfd867f37cc` |
| AH12 | PASS_AH12 | 35/35 | 13/13 | `6bb16f7c3d61202a50c885e3e70c399f7a871f59929143ebb9ceba839669ae4c` |
| AH13 | PASS_AH13 | 41/41 | 15/15 | `8c204d74ae76c1ae783759060b377fa4044145c7405dc680b88d790fb9cd4e76` |
| AH14 | PASS_AH14 | 43/43 | 15/15 | `921d4e091984fb8d3122d35d2e25f05d436eff2dd9659dd90ea3e968bdb0aa0e` |
| AH15 | PASS_AH15 | 21/21 | 15/15 | `69aee683f5ce416169dab5c7aa51d8b157cda6fab08002c16f568ff4e5bb47dd` |
| AH16 | PASS_AH16 | 43/43 | 15/15 | `3314bc18b7c21dee9acee4134b008fab4136de06ec32eb5387d1a7331fdb8c70` |
| AH17 | PASS_AH17_QUALIFIED | 28/28 | 13/13 | `8198df521b365e42df6e9d1930cf6891885ad576d4d34b0a36893204e14baabe` |
| AH18 | PASS_AH18_QUALIFIED | 51/51 | 14/14 | `93a22673cc736da2374212f29dfde2ea70163cfe6faeb9dac92e1e023cfa2f68` |
| AH19 | PASS_AH19_QUALIFIED | 65/65 | 15/15 | `8c54b738c032f9439ee70b27cbc40ab2ad2e988c71f36bbbd3964a53e289fd60` |
| AH20 | PASS_AH20_QUALIFIED | 68/68 | 15/15 | `0ef62e3bda4ed70b4034536261742e7799b897715b2f56bc0144a59685202060` |
| AH21 | PASS_AH21_QUALIFIED | 64/64 | 16/16 | `21c2384c3859c3e7b2025bad565464d465a7cba175537f31b5a88a588e29de29` |

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


## AH17 — Split authority / Keyhole parallax reauthorization

AH17 replaces AH16's single higher-authority store with two individually insufficient authority Keyholes:

```text
E1 = H2[0][0]
E2 = H2[1][0]
```

Each share has two classes and 0.8112781244591328 bits. Their joint three-class view reconstructs the frozen H2 class exactly:

```text
H(H2 | E1,E2) = 0
```

Frozen grant results:

```text
ROUTE -> GLOBAL
baseline                    0.25 bits
+ E1                        0.125
+ E2                        0.125
+ E1 + E2                   0

DOWNSTREAM -> ROUTE
baseline                    0.5471804688852168 bits
+ E1                        0.25
+ E2                        0.25
+ E1 + E2                   0
```

Neither Keyhole alone is sufficient in either grant. The authorized pair is sufficient, after which only the target-role residue is released.

### Preregistration lineage

AH17 deliberately retains its failed candidates:

- **v0.1.0:** frozen run failed 27/28 because one preregistered numeric expectation was wrong.
- **v0.1.1:** harness passed 28/28, but qualification failed at 12/13 tests because one unit-test expectation was copied incorrectly.
- **v0.1.2:** corrected only those bookkeeping expectations; experiment construction unchanged. Qualified at 28/28 checks + 13/13 tests, replay exact, frozen hashes unchanged.

Package SHA-256:

`8198df521b365e42df6e9d1930cf6891885ad576d4d34b0a36893204e14baabe`

Claim boundary: this is an information-partition / authorized-parallax result. It is **not** cryptographic secret sharing, secure multiparty computation, threshold signatures, Byzantine fault tolerance, or a real-world access-control proof.


## AH18 — Quorum topology / coalition-dependent authority

AH18 adds a third authority Keyhole and shows that equal-sized coalitions can have different reconstruction power.

Frozen share structure:

- `E1 = H2[0][0]`
- `E2 = H2[1][0]`
- `E3 = H2[1][1]`
- every singleton: 2 classes, 0.8112781244591328 bits
- `E1+E2`: 3 classes, `H(H2|pair)=0`
- `E2+E3`: 3 classes, `H(H2|pair)=0`
- `E1+E3`: 2 classes, `H(H2|pair)=0.6887218755408672 bits`

Grant controls:

```text
ROUTE -> GLOBAL
capable pairs: E1+E2, E2+E3
E1+E3 leaves 0.125 bits
policy authorizes E1+E2 and denies the other capable pair

DOWNSTREAM -> ROUTE
capable pairs: E1+E2, E2+E3
E1+E3 leaves 0.25 bits
policy authorizes E2+E3 and denies the other capable pair
```

Supported operational statements:

```text
quorum = access structure, not merely a count
CAPABILITY != AUTHORITY
```

Package SHA-256:

`93a22673cc736da2374212f29dfde2ea70163cfe6faeb9dac92e1e023cfa2f68`

Claim boundary: AH18 is an information-partition / coalition-policy result. It is not cryptographic threshold security, Shamir secret sharing, threshold signatures, secure multiparty computation, collusion resistance, Byzantine fault tolerance, or real-world access control.


## AH19 — Authority access structures / minimal coalition lattices

AH19 enumerates all eight coalitions over the three AH18 Keyholes for four frozen tasks.

For full H2 reconstruction, GLOBAL reauthorization, and ROUTE reauthorization:

```text
capable = {E1,E2}, {E2,E3}, {E1,E2,E3}
minimal = {E1,E2}, {E2,E3}
mandatory core = {E2}
```

For the coarse C-class alarm:

```text
minimal = {E1}, {E3}
mandatory core = ∅
```

Every frozen mathematical capability family is upward-closed. Every policy family is also upward-closed, remains a subset of capability, and is a strict subset of capability.

Operational definition:

```text
A_Q = { C : H(Q | D_local, C) = 0 }
```

So the same Keyholes can induce different access structures for different future queries, and a Keyhole can be mandatory for one task family while unnecessary for another.

Package SHA-256:

`8c54b738c032f9439ee70b27cbc40ab2ad2e988c71f36bbbd3964a53e289fd60`

Claim boundary: this is a finite information-partition/access-structure result, not cryptographic secret-sharing security, threshold signatures, secure multiparty computation, or real-world identity enforcement.


## AH20 — Keyhole criticality / failure sets / policy resilience

AH20 converts the AH19 coalition access structures into complete finite failure families.

For the full reconstruction / reauthorization tasks:

```text
minimal capable coalitions = {E1,E2}, {E2,E3}
minimal capability cuts    = {E2}, {E1,E3}
```

So `E2` is the only singleton capability failure.

Frozen policy overlays narrow the allowed coalition family and create additional singleton vulnerabilities:

```text
H2_FULL / GLOBAL_REAUTH  -> policy adds singleton cut {E1}
ROUTE_REAUTH             -> policy adds singleton cut {E3}
C_CLASS_ALARM            -> capability has no singleton cut; policy adds {E3}
```

Minimal failure cuts exactly equal the minimal hitting sets of the corresponding minimal successful coalitions.

Diagnostic independent-failure reliability:

```text
full capability: R(p)=1-p-p^2+p^3
full policy:     R(p)=1-2p+p^2
p=0.1:          0.891 vs 0.81

alarm capability: R(p)=1-p^2
alarm policy:     R(p)=1-p
p=0.1:            0.99 vs 0.9
```

Supported operational statement:

```text
capability resilience != policy resilience
```

Package SHA-256:

`0ef62e3bda4ed70b4034536261742e7799b897715b2f56bc0144a59685202060`

Claim boundary: the reliability polynomial is a toy diagnostic under independent equal Keyhole failure probability, not a deployed-system reliability or safety guarantee.


## AH21 — Policy hardening and redundancy synthesis

AH21 turns AH20's resilience diagnosis into an exhaustive finite synthesis problem.

For every task, the optimizer searches upward-closed policy expansions that:

- contain the baseline policy;
- remain inside mathematical capability;
- preserve explicit deny constraints;
- remove all policy-induced singleton cuts;
- minimize newly authorized coalitions.

Frozen optima:

```text
H2_FULL       add {E2,E3}
GLOBAL_REAUTH add {E2,E3}
ROUTE_REAUTH  add {E1,E2}
C_CLASS_ALARM add {E1,E2}
```

Every task requires exactly one newly authorized coalition.

The three full tasks recover full capability resilience.

The alarm preserves the explicit singleton `{E1}` denial, remains a strict subset of capability, and changes diagnostic reliability at `p=0.1`:

```text
baseline  0.900
hardened  0.981
capability 0.990
```

Its hardened minimal successful coalitions are `{E3}` and `{E1,E2}`, with no singleton cut.

Package SHA-256:

`21c2384c3859c3e7b2025bad565464d465a7cba175537f31b5a88a588e29de29`

Claim boundary: AH21 solves only the frozen constrained finite optimization problem and does not recommend automatic deployment of synthesized governance policy.


## AH22 — Costed policy synthesis and Pareto frontiers

AH22 evaluates every legal upward-closed policy between the frozen baseline and mathematical capability using three explicit objectives:

- added authorization cost;
- policy-induced singleton cut count;
- diagnostic reliability at `p=0.1`.

No scalar score is used.

Frozen alarm soft-cost frontier:

```text
cost 0 -> 1 induced singleton cut -> reliability 0.900
cost 1 -> 0 induced singleton cuts -> reliability 0.981
cost 5 -> 0 induced singleton cuts -> reliability 0.990
```

All three points are Pareto-nondominated.

When singleton `{E1}` is changed from expensive-but-legal to a hard deny, the full-capability point becomes infeasible and the frontier contracts to:

```text
(0, 1, 0.900)
(1, 0, 0.981)
```

Threshold query:

```text
soft-cost: min cost for R>=0.98 = 1
soft-cost: min cost for R>=0.99 = 5
hard-deny: min cost for R>=0.98 = 1
hard-deny: R>=0.99 infeasible
```

Supported operational statement:

```text
expensive != forbidden
```

Package SHA-256:

`0949fe80fa8efcb700495f470b13067a5d3eddda8890df63f865a8b28d90f257`

Claim boundary: AH22 uses toy governance weights and the AH20 independent-failure diagnostic. It does not determine real policy costs, legal/compliance priorities, or deployment choices.


## AH23 — Robust Pareto frontiers under failure-rate uncertainty

AH23 evaluates AH22's legal policy families over the frozen common-failure scenario set:

```text
p = 0.05, 0.10, 0.15, 0.20, 0.25, 0.30
```

Robust objectives:

```text
worst-case reliability = min_p R_policy(p)
maximum regret         = max_p [R_capability(p)-R_policy(p)]
```

Frozen alarm soft-cost robust frontier:

```text
cost 0 -> induced cuts 1 -> worst R 0.700 -> max regret 0.210
cost 1 -> induced cuts 0 -> worst R 0.847 -> max regret 0.063
cost 5 -> induced cuts 0 -> worst R 0.910 -> max regret 0
```

The hard-deny frontier removes the zero-regret capability point.

Every legal reliability curve is non-increasing across the declared scenarios and reaches its frozen worst case at `p=0.30`.

Most importantly, the AH22 single-point frontier and AH23 robust frontier contain the exact same policy families in every context:

```text
no frontier membership reversal
```

under the common identical-failure model.

Package SHA-256:

`e08c6fe8b99005266b27b050d2cff40abe40441086106d0e904ecf60147116d4`

Claim boundary: AH23 is a finite robust-decision result over declared toy scenarios. It does not establish real failure rates, continuous-interval robustness, correlated-failure robustness, or a preferred governance policy.


## AH24 — Heterogeneous and correlated failure regimes

AH24 relaxes AH23's common identical-failure assumption and evaluates three full-task policies:

```text
P12    = {E1,E2}
P23    = {E2,E3}
P_BOTH = {P12,P23}
```

Frozen heterogeneous ranking reversal:

```text
E1_FRAGILE: P12=0.630, P23=0.855, P_BOTH=0.8865
frontier:   P23, P_BOTH

E3_FRAGILE: P12=0.855, P23=0.630, P_BOTH=0.8865
frontier:   P12, P_BOTH
```

So equal-sized, equal-cost single-path policies exchange rank when the hazard moves between outer Keyholes.

Matched-marginal correlation control:

```text
one-Keyhole failure marginals:
independent = [0.24, 0.10, 0.24]
correlated  = [0.24, 0.10, 0.24]

P12       0.684 -> 0.684
P23       0.684 -> 0.684
P_BOTH    0.84816 -> 0.71820
```

Dual-path redundancy gain:

```text
independent 0.16416
correlated  0.03420
penalty     0.12996
```

Supported operational statements:

```text
coalition identity matters under heterogeneous hazards
same component marginals != same redundancy value
```

Package SHA-256:

`3332f110ed88725aa85cc78c7adcf1894ed2fa0c202dc2bc4c4d6ec2150294e9`

Claim boundary: AH24 uses frozen toy hazard regimes and does not estimate real failure probabilities, common-cause rates, or deployed-system reliability.


## AH25 — Failure-domain discovery and redundancy auditing

AH25 inverts AH24: instead of declaring a common-cause relation, it audits observed E1/E3 failure traces.

Frozen matched-marginal controls:

```text
MATCHED_INDEPENDENT     p1=p3=0.24  p11=0.0576  status=INDEPENDENCE_COMPATIBLE
MATCHED_COMMON_CAUSE    p1=p3=0.24  p11=0.2020  status=COMMON_MODE_EVIDENCE
MATCHED_ANTI_DEPENDENCE p1=p3=0.24  p11=0       status=DEPENDENCE_OTHER_DIRECTION
```

A fourth N=25 panel returns:

```text
INSUFFICIENT_EVIDENCE
```

The joint trace reconstructs dual-path reliability:

```text
independent   0.84816
common cause  0.71820
anti-dependent 0.90000
```

A marginal-only independence assumption returns 0.84816 for all three matched controls, overstating the common-cause case by 0.12996.

Supported operational statements:

```text
same marginals != same failure domain
joint traces can expose hidden reliability coupling erased by marginal dashboards
```

Package SHA-256:

`b69abe7de90d36e51761ae84b000c42fbe30ce076256f8514fd60f3ada92b826`

Claim boundary: INDEPENDENCE_COMPATIBLE is not proof of independence. AH25 is a synthetic finite statistical audit and does not certify deployed failure domains or causal mechanisms.


## AH26 — Sequential failure auditing and evidence persistence

AH26 turns AH25's one-shot failure-domain audit into a deterministic six-batch evidence trace.

Frozen raw evidence sequence:

```text
INSUFFICIENT_EVIDENCE
-> INDEPENDENCE_COMPATIBLE
-> COMMON_MODE_EVIDENCE
-> COMMON_MODE_EVIDENCE
-> INDEPENDENCE_COMPATIBLE
-> INDEPENDENCE_COMPATIBLE
```

Governed alert sequence:

```text
NO_ALERT
-> NO_ALERT
-> PENDING_ESCALATION
-> ACTIVE_ALERT
-> ACTIVE_PENDING_CLEAR
-> CLEARED_AFTER_PERSISTENCE
```

The frozen state machine requires two consecutive common-mode classifications to activate and two consecutive independence-compatible classifications to clear.

A naive raw-status mirror would activate at B3 and clear at B5. The governed rule activates at B4 and clears at B6.

All cumulative tables preserve the same marginals:

```text
p1 = p3 = 0.24
independence-assumed dual reliability = 0.84816
```

At B4, observed joint-trace reliability is:

```text
0.769090909091
```

so the marginal-only independence assumption overstates redundancy by:

```text
0.079069090909
```

Supported operational statements:

```text
evidence state != governance transition
persistence can prevent one-batch alert flapping
```

Package SHA-256:

`e50134c237b39c915f7b6de9d1e2b33810654bd3a6d3bb7bd59e6db7455bd6e9`

Claim boundary: AH26 is a frozen deterministic sequential-evidence/state-machine result, not a universal sequential statistical test or production alerting policy.


## AH27 — Windowed evidence / horizon-indexed memory

AH27 compares three evidence memories over the same frozen stream:

- lifetime cumulative memory;
- a rolling two-batch recent window;
- exponentially discounted memory with `lambda=0.1`.

Primary sequence:

```text
[I,C,C,I,I]
```

Frozen statuses:

```text
lifetime:
compatible -> insufficient -> insufficient -> insufficient -> insufficient

recent-2:
compatible -> common -> common -> common -> compatible

discounted:
compatible -> common -> common -> insufficient -> compatible
```

The sharp order witness uses:

```text
H_A = [C,C,I,I]
H_B = [I,I,C,C]
```

Both histories finish with the exact same lifetime table:

```text
[64258, 19342, 19342, 7058]
```

and the same lifetime classification:

```text
INSUFFICIENT_EVIDENCE
```

but:

```text
H_A recent2    = INDEPENDENCE_COMPATIBLE
H_B recent2    = COMMON_MODE_EVIDENCE

H_A discounted = INDEPENDENCE_COMPATIBLE
H_B discounted = COMMON_MODE_EVIDENCE
```

Supported operational statements:

```text
same lifetime aggregate != same recent-hazard state
evidence memory is horizon-relative
```

Candidate notation:

```text
R_{Q,tau}(Gamma)
```

Package SHA-256:

`04887caffce20956cb152c8c1b1a0f025173d22dfef5416f91a8741d506f5480`

Claim boundary: AH27 does not establish an optimal time window, decay factor, change-point method, or field monitoring horizon.


## AH28 — Multi-horizon governance and evidence arbitration

AH28 makes the evidence time horizon part of the governance query contract.

Frozen contracts:

```text
Q_LIFETIME -> LIFETIME
Q_RECENT   -> RECENT_2
Q_ADAPTIVE -> DISCOUNTED_0.1
Q_MULTI    -> MULTI
```

Missing horizon:

```text
REFUSE_UNDERSPECIFIED_HORIZON
```

Frozen arbitration vocabulary:

```text
CONSISTENT
RECENT_RISK_ONLY
LIFETIME_RISK_ONLY
HORIZON_CONFLICT
```

The AH27 order witness becomes a governance witness:

```text
F_ORDER_A lifetime == G_ORDER_B lifetime
F arbitration = HORIZON_CONFLICT
G arbitration = RECENT_RISK_ONLY
```

So lifetime evidence alone cannot reproduce the multi-horizon governance answer.

### Preregistration lineage

- **v0.1.0:** failed 22/23 checks because Panel D adaptive state was preregistered as INDEPENDENCE_COMPATIBLE but the frozen construction returned COMMON_MODE_EVIDENCE.
- **v0.1.1:** changed only that expected adaptive state and version identifiers; qualified at 23/23 checks + 15/15 tests, replay exact, frozen hashes unchanged.

Supported operational statements:

```text
time horizon is part of governance semantics
evidence without a declared horizon is an incomplete governance claim
```

No scoped evidence state is promoted to the unqualified word `SAFE`.

Package SHA-256:

`796f37bb9f6d1254f466f600b2bc715c1b4260e689fcd63c4da6cec3aba3f531`

Claim boundary: AH28 is a finite request-routing/arbitration toy model, not a universal safety, compliance, or deployed monitoring policy.


## AH29 — Horizon authorization and evidence least privilege

AH29 applies explicit role authority to AH28's horizon-scoped evidence contracts.

Frozen direct authority:

```text
HISTORIAN             -> Q_LIFETIME
OPERATOR              -> Q_RECENT
ADAPTIVE_CONTROLLER   -> Q_ADAPTIVE
AUDITOR               -> Q_LIFETIME + Q_RECENT
TRI_HORIZON_ANALYST   -> Q_LIFETIME + Q_RECENT + Q_ADAPTIVE
ROOT_GOVERNOR         -> all four contracts including Q_MULTI
```

Capability/authority witness:

```text
substrate(A, Q_RECENT) = COMMON_MODE_EVIDENCE
HISTORIAN(A, Q_RECENT) = REFUSE_UNAUTHORIZED_HORIZON
```

Release-invariance witnesses show that authorized payloads can remain identical while unauthorized horizon states differ.

Uniform seven-panel information results:

```text
H(M | AUDITOR lifetime+recent) = 0.39355535745192405 bits
H(M | TRI all three singles)   = 0
H(recent | lifetime)           = 0.7493017854052187 bits
H(lifetime | recent)           = 1.1428571428571428 bits
H(M | adaptive)                = 1.1428571428571428 bits
```

The frozen negative control is deliberate:

```text
TRI_HORIZON_ANALYST Q_MULTI -> REFUSE_UNAUTHORIZED_HORIZON
```

on every panel, while the three individually authorized horizon releases reproduce the full informational content of Q_MULTI on every panel.

Supported operational statements:

```text
evidence capability != evidence authority
interface denial != informational non-derivability
authority composition must account for derivability
```

Package SHA-256:

`2a956faf23276108ee34f3b6bc06381577c0ad95ea426b6985bd353f48fe8f04`

Claim boundary: AH29 is a finite authorization/information-partition result. It does not establish cryptographic secrecy, side-channel noninterference, production IAM correctness, legal privacy guarantees, or collusion resistance.


## AH30 — Derivation closure and authority-safe release synthesis

AH30 formalizes effective authority as deterministic derivation closure:

```text
A_effective = Cl(A_direct)
```

Frozen derivation rules:

```text
Q_MULTI -> Q_LIFETIME + Q_RECENT + Q_ADAPTIVE
Q_LIFETIME + Q_RECENT + Q_ADAPTIVE -> Q_MULTI
```

For `TRI_HORIZON_ANALYST`:

```text
direct    = {L,R,A}
effective = {L,R,A,M}
```

so the nominal `Q_MULTI` deny is only:

```text
INTERFACE_ONLY_DENY
```

The frozen hardening task requires lifetime + recent to remain available. Exhaustive finite synthesis returns the unique minimum repair:

```text
remove Q_ADAPTIVE
keep   {Q_LIFETIME,Q_RECENT}
```

After hardening:

```text
effective = {L,R}
deny audit = DERIVATION_SAFE_DENY
```

Residual uncertainty changes:

```text
H(M | L,R,A) = 0
H(M | L,R)   = 0.39355535745192405 bits
H(M | L,A)   = 0.2857142857142857 bits
H(M | R,A)   = 0.6792696431662097 bits
```

Supported operational statements:

```text
authority must be closed under derivation
meaningful denies must be checked against effective authority, not only direct grants
```

Package SHA-256:

`bf5afaf15f8c14cb819f327135191ab9c3e3f0fd20db0543dc4b1ccd6a34b664`

Claim boundary: finite deterministic closure and information-partition model only; no cryptographic secrecy, side-channel noninterference, or production IAM guarantee.


## AH31 — Collusion closure and coalition effective authority

AH31 pools authorized releases across four individually derivation-safe actors and then applies AH30 deterministic derivation closure.

Frozen actor releases:

```text
HISTORIAN           -> {Q_LIFETIME}
OPERATOR            -> {Q_RECENT}
ADAPTIVE_CONTROLLER -> {Q_ADAPTIVE}
AUDITOR             -> {Q_LIFETIME,Q_RECENT}
```

All singleton actors are derivation-safe for `Q_MULTI`.

Exhaustive enumeration over all 16 actor coalitions finds exactly five dangerous coalitions. The minimal dangerous coalitions are:

```text
{ADAPTIVE_CONTROLLER, AUDITOR}
{HISTORIAN, OPERATOR, ADAPTIVE_CONTROLLER}
```

Their mandatory core is:

```text
{ADAPTIVE_CONTROLLER}
```

Minimal actor cut sets are:

```text
{ADAPTIVE_CONTROLLER}
{HISTORIAN, AUDITOR}
{OPERATOR, AUDITOR}
```

Symbolic closure and finite information sufficiency agree for all 16 coalitions:

```text
Q_MULTI in Cl(pooled releases)
iff
H(M_state | pooled descriptor) = 0
```

Selected residual entropies:

```text
AUDITOR                          0.39355535745192405 bits
HISTORIAN + OPERATOR             0.39355535745192405
HISTORIAN + ADAPTIVE             0.2857142857142857
OPERATOR + ADAPTIVE              0.6792696431662097
AUDITOR + ADAPTIVE               0
HISTORIAN + OPERATOR + ADAPTIVE  0
```

The frozen organizational impossibility control exhaustively checks all 32 grant-removal configurations. Nine preserve at least one system-wide release of each lifetime, recent, and adaptive evidence. Under unrestricted grand-coalition pooling, exactly **0/9** remain derivation-safe for `Q_MULTI`.

Supported operational statements:

```text
per-actor derivation safety != coalition derivation safety
individual least privilege does not compose automatically under pooling
```

Package SHA-256:

`ee575cf98954b50814013b8d37d9b905d74781c52b2d71d44b4979578dee6562`

Claim boundary: finite coalition/closure/information-partition model only. No cryptographic collusion resistance, side-channel security, secure multiparty computation, legal separation-of-duties guarantee, or production IAM proof.


## AH32 — Coalition-safe release design / task-sufficient coarsening

AH32 changes the representation of the five AH31 horizon grants rather than deleting an evidence horizon.

Each grant is either:

```text
RAW  = exact AH28 evidence status
RISK = COMMON vs NOT_COMMON
```

Frozen actor tasks require only common-mode detection at the corresponding horizon.

All **32** RAW/RISK designs preserve those tasks exactly. Exactly **8/32** prevent exact reconstruction of the multi-horizon target after unrestricted grand-coalition pooling.

The safe family is exact:

```text
safe iff HISTORIAN:Q_LIFETIME = RISK
     and AUDITOR:Q_LIFETIME   = RISK
```

The unique minimum safe design changes two grants:

```text
HISTORIAN:Q_LIFETIME -> RISK
AUDITOR:Q_LIFETIME   -> RISK
```

and leaves recent/adaptive grants RAW.

Frozen grand-coalition residual uncertainty:

```text
baseline RAW H(M|Zgrand) = 0
hardened     H(M|Zgrand) = 0.2857142857142857 bits
```

Witness:

```text
Zgrand(C) = Zgrand(F)
Mstate(C) != Mstate(F)
```

The transformed lifetime release removes 0.5156629249195444 bits of frozen status detail per carrier while retaining zero error for the declared task.

Supported operational statements:

```text
task-sufficient release != raw state release
release only the distinction required by the authorized task
```

Package SHA-256:

`0e160f2b5cd75d9859f03bca97e28e813174ad0ebf610693c403dd2d28518a5a`

Claim boundary: AH32 is a finite information-release design result. It is not differential privacy, cryptographic secrecy, auxiliary-information resistance, or production confidentiality.


## AH33 — Task richness / coalition privacy frontier

AH33 expands the frozen evidence alphabet with negative-dependence controls and introduces a genuinely nested task hierarchy:

```text
COMMON_ONLY
  < TRIAGE
  < FULL_STATUS
```

Across five grants, each release may use any of the three modes, yielding **243** designs.

Frozen uniform ten-panel target entropy:

```text
H(M) = 3.1219280948873624 bits
```

Selected privacy/utility frontier:

```text
COMMON_ONLY
task information  = 1.9609640474436811
residual privacy  = 1.160964047443681
task-sufficient designs = 243
coalition-safe designs  = 106

TRIAGE
task information  = 2.721928094887362
residual privacy  = 0.4
task-sufficient designs = 32
coalition-safe designs  = 4

FULL_STATUS
task information  = 3.1219280948873624
residual privacy  = 0
task-sufficient designs = 1
coalition-safe designs  = 0
```

For every selected frontier point:

```text
task information + residual privacy = full target entropy
```

The frozen TRIAGE safe family is also structured: both recent carriers and adaptive evidence must remain TRIAGE, while either lifetime carrier may be upgraded to FULL_STATUS without fully reconstructing the target on the ten-panel ensemble.

Supported operational statements:

```text
task richness and coalition privacy trade off through retained distinctions
some authorized task contracts are too rich to support the desired deny under unrestricted pooling
task sufficiency must itself be governed
```

Package SHA-256:

`2561ffdd7b59e2d364036d963a7448c47f492e77bdda3a74a158034e49b0c046`

Claim boundary: AH33 is a finite partition/entropy/design result. It is not a universal privacy-utility law, differential privacy, cryptographic secrecy, auxiliary-information robustness, or production privacy budgeting.


## AH34 — Mixed task profiles and authority-aware privacy budgets

AH34 allows each of the five frozen grants to request its own task richness:

```text
COMMON_ONLY < TRIAGE < FULL_STATUS
```

This yields **243** mixed task profiles.

Frozen residual-privacy spectrum:

```text
1.160964047443681 bits -> 4 profiles
0.8                 -> 4
0.6754887502163468  -> 17
0.4                 -> 46
0.2                 -> 35
0                   -> 137
```

Thus:

```text
positive residual privacy = 106/243
exact Q_MULTI reconstruction = 137/243
```

No single upgrade from all-COMMON collapses privacy.

The minimum total richness score that collapses privacy is **3**, achieved by exactly two task profiles:

```text
COMMON / COMMON / FULL / TRIAGE / COMMON
TRIAGE / COMMON / FULL / COMMON / COMMON
```

So adaptive FULL status plus either lifetime TRIAGE carrier is sufficient to remove all residual uncertainty in the frozen ensemble.

A privacy-free upgrade also exists:

```text
COMMON / TRIAGE / COMMON / COMMON / TRIAGE
```

raises total task richness to 2 while leaving residual privacy unchanged at:

```text
1.160964047443681 bits
```

The maximum-richness profile that still preserves positive residual privacy has score **7**:

```text
FULL / TRIAGE / TRIAGE / FULL / TRIAGE
```

with:

```text
H(M|Z) = 0.2 bits
```

At frozen privacy floor `epsilon=0.4`, 71 profiles are feasible and two distinct score-6 allocations tie for optimum.

Supported operational statements:

```text
privacy cost depends on which distinctions are jointly released, not only how many upgrades are granted
some task upgrades are privacy-free while specific combinations collapse privacy abruptly
privacy budgets constrain task allocation without necessarily selecting one unique design
```

Package SHA-256:

`c55b9d7514258070e44772b7a4aa255a41f10960c3805dfa1c403310e8ce6f97`

Claim boundary: AH34 is a finite mixed-task entropy/Pareto result. It is not a real privacy budget, cryptographic confidentiality guarantee, or production authority policy.


## AH35 — Upgrade access structures / privacy-critical distinctions

AH35 turns mixed task refinements into a prerequisite-aware access structure over ten upgrade atoms:

```text
H_L:T H_L:F
O_R:T O_R:F
A_A:T A_A:F
U_L:T U_L:F
U_R:T U_R:F
```

A FULL atom requires its corresponding TRIAGE atom. The resulting **243** valid upgrade sets exactly match the AH34 mixed task profiles.

Frozen result:

```text
valid upgrade sets            = 243
dangerous exact-reconstruction = 137
positive-privacy               = 106
minimal dangerous paths        = 10
mandatory core                 = empty
inclusion-minimal cuts          = 12
```

The unique minimum cut is:

```text
{H_L:T, U_L:T}
```

Blocking both lifetime TRIAGE refinements prevents every frozen exact-reconstruction path while still allowing **27** task profiles, maximum richness **6**, and worst residual privacy **0.4 bits**.

By contrast, a scalar richness cap can guarantee every allocation safe only through:

```text
R <= 2
```

The structural cut therefore permits three times that guaranteed-safe richness score in the frozen toy metric.

The utility-maximal inclusion-minimal cut is:

```text
{O_R:F, A_A:F, U_R:F}
```

with maximum permitted richness **7** and worst residual privacy **0.2 bits**.

Structural-cut policy frontier:

```text
(cost, max richness, worst privacy)
(2,6,0.4)
(3,7,0.2)
(3,4,0.6754887502163468)
(5,3,0.8)
(5,2,1.160964047443681)
```

### Preregistration lineage

- **v0.1.0:** failed **28/29** acceptance checks while all **15/15** independent tests passed. The only failed check was exact tuple ordering of the same 12 correct cut sets.
- **v0.1.1:** corrected only expected/listed cut ordering and version metadata. Model, algorithms, memberships, frontier, and tests were unchanged. Qualified at **29/29 + 15/15**, frozen hashes unchanged, replay exact.

Supported operational statements:

```text
task refinement permissions themselves form an access structure
structure-aware deny rules can preserve more useful task richness than scalar caps
```

Package SHA-256:

`f1747ecd8ec7d2ebecc4a1645b00ba77d13313474c9ec6473e681c32448e653f`

Claim boundary: AH35 is a finite prerequisite/access-structure/cut-set model. It is not a production authorization system, cryptographic privacy guarantee, universal utility metric, or auxiliary-information robustness theorem.


## AH36 — Dynamic upgrade grants / revocation / privacy restoration

AH36 makes an AH35 minimal privacy-collapse path temporal:

```text
H_L:T -> A_A:T -> A_A:F
```

and distinguishes three views of released information:

```text
prospective authority
current materialized disclosure
append-only historical ledger
```

Frozen residual-privacy traces:

```text
authority  1.160964 -> 0.675489 -> 0.4 -> 0 -> 0.4 -> 0.4
current    1.160964 -> 0.675489 -> 0.4 -> 0 -> 0   -> 0.4
ledger     1.160964 -> 0.675489 -> 0.4 -> 0 -> 0   -> 0
```

Revocation-only event E4 lowers historian lifetime authority to `COMMON_ONLY`, but leaves the prior TRIAGE disclosure materialized. The deterministic alignment status is:

```text
REVOKED_BUT_STALE_DISCLOSURE_PRESENT
```

Only the explicit E5 downgrade/rematerialization restores current-view residual privacy to **0.4 bits**.

The historical observer remains at **0 bits** because the ledger already contains the earlier collapsing release. A fresh E5 observer sees **0.4 bits**.

Supported operational statements:

```text
permission revoked != current disclosure coarsened != historical disclosure erased
current-view privacy can recover while historical-view privacy cannot
privacy restoration is observer-history relative
```

Package SHA-256:

`6beec0a30dbcf30599f0b40acfa5069de60cbef9d2674b55ff6892698a1c2efd`

Claim boundary: finite disclosure-history result only; no secure deletion, cryptographic forward secrecy, cache invalidation, third-party-copy deletion, or retroactive secrecy claim.


---

## AH37 — Epoch-Scoped Disclosure and Forward Privacy Boundaries

**Verdict:** PASS_AH37_QUALIFIED  
**Acceptance:** 18/18  
**Unit tests:** 15/15  
**Replay:** exact  
**Package SHA-256:** `4d86623914433a211f0c58de0d619207ba302c260c961b3944efde6baf0487a7`

AH37 closes a rich Epoch-0 disclosure and starts Epoch 1 after historian-lifetime downgrade.

Observer outcomes:

- fresh Epoch-1 observer: **0.4 bits** residual privacy;
- legacy Epoch-0 + Epoch-1 observer: **0 bits**;
- observer given deterministic public `SHA256(Z0)` plus Epoch 1: **0 bits**;
- metadata-only epoch-close receipt plus Epoch 1: **0.4 bits**.

The public digest negative control is finite-domain enumeration, not a hash break. Across the frozen ten-panel candidate space, the rich old epoch has nine distinct release descriptors and nine distinct SHA-256 digests; every digest corresponds to exactly one multi-horizon target class.

**Supported statement:** `forward privacy boundary != historical erasure`.

**Second supported statement:** `public deterministic commitment != non-disclosure in a tiny enumerable domain`.

**Claim firewall:** no secure deletion, hiding commitment, cryptographic forward secrecy, SHA-256 preimage weakness, or deployed key-management result is claimed.


---

## AH38 — Hiding Commitments, Key Scope, and Disclosure-Safe Epoch Receipts

**Verdict:** PASS_AH38_QUALIFIED  
**Acceptance:** 24/24  
**Unit tests:** 15/15  
**Replay:** exact  
**Package SHA-256:** `642f6314feeabb88e5de561fa079dbf3b53de4fc979b321bc7e158f496e3858c`

AH38 asks what may cross the AH37 epoch boundary as a verification artifact.

Observer outcomes:

- fresh Epoch-1 only: **0.4 bits** residual privacy;
- public deterministic SHA-256 + Epoch 1: **0 bits**;
- public-salt SHA-256 + Epoch 1: **0 bits**;
- public HMAC tag with a known 8-key toy candidate space + Epoch 1: **0 bits**;
- public secret-salt digest with a known 8-salt toy candidate space + Epoch 1: **0 bits**;
- mediated panel-independent `VERIFIED` receipt + Epoch 1: **0.4 bits**;
- key-authorized verifier: **0 bits**.

The HMAC and secret-salt controls enumerate 72 candidate artifacts each (8 candidate secrets × 9 distinct old disclosures), and every observed artifact identifies one frozen target class.

AH38 refuses to turn “observer lacks a high-entropy key” into an information-theoretic claim:

`NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE`

**Supported statement:** `verification authority != evidence disclosure authority`.

**Second supported statement:** `public verifier artifact design is part of the privacy boundary`.

**Claim firewall:** no hiding-commitment theorem, high-entropy HMAC leakage/hiding result, cryptographic forward secrecy, side-channel security, or deployed key-management guarantee is claimed.


# AH39 — Delayed Key Disclosure and Authenticator History

**Status:** QUALIFIED  
**Harness:** 26/26 PASS  
**Tests:** 15/15 PASS  
**Replay:** exact  
**Package SHA-256:** `201995fa332e80b7c4f9aa9a17721ed24a1b028217809185ac20905ea40d4340`

AH39 makes verification-key authority temporal.

Frozen observer outcomes:

```text
fresh E1 only                         0.4 bits
public toy-HMAC tag before key        0 bits
public tag + later key                0 bits
mediated VERIFIED; tag withheld       0.4 bits
later key; tag still withheld         0.4 bits
tag released after key                0 bits
key revoked; disclosure history kept  0 bits
```

The public-tag branch was already declassified under AH38's finite eight-key enumeration, so later key disclosure is not falsely credited with causing that disclosure. In the withheld branch, panel-independent key disclosure alone adds no target distinction; disclosure collapses only when the missing panel-dependent authenticator is later released.

Operational statements:

```text
key disclosure does not recreate an authenticator that never crossed the boundary
already-public authenticators remain part of disclosure history across later key-policy changes
effective disclosure must account for artifact history + key-authority history
```

Claim firewall: finite candidate/keyspace result only. No cryptographic forward-secrecy, secure key-deletion, high-entropy-HMAC, deployed rotation, or side-channel claim.

---

# AH40 — Split Verification Authority and Threshold Declassification

**Status:** QUALIFIED  
**Harness:** 27/27 PASS  
**Tests:** 15/15 PASS  
**Replay:** exact  
**Package SHA-256:** `64d327e566d4f9dcf5df7a3d4c81da6cd944b99a40a20eedd533cc721cb5d16b`

AH40 separates verification authority from public evidence-release authority across three finite verifier principals.

Verification policy is 2-of-3. Minimal verification coalitions:

```text
{VERIFIER_A, VERIFIER_B}
{VERIFIER_A, VERIFIER_C}
{VERIFIER_B, VERIFIER_C}
```

All four verification-capable coalitions, including the full three-verifier coalition, emit only a panel-independent mediated `VERIFIED` receipt under `VERIFY_ONLY`. The public observer therefore remains at **0.4 bits** residual privacy.

Public declassification policy is 3-of-3. Only `{VERIFIER_A, VERIFIER_B, VERIFIER_C}` may invoke `DECLASSIFY_EPOCH0`, which emits the rich old disclosure and reduces residual privacy to **0 bits**.

A forbidden debug-transcript control that emits the old public toy-HMAC tag during verification also yields **0 bits**, demonstrating that the output schema is itself part of the disclosure boundary.

Operational statements:

```text
verification quorum != public evidence-release quorum
coalition capability != action exercised != output disclosed
```

Claim firewall: finite authorization/output-schema result only. No threshold cryptography, secret sharing, MPC, quorum-signature, malicious-verifier-resistance, deployed key-custody, or secure-hardware claim.


---

# AH41 — Verifier Compromise, Role Fusion, and Quorum Resilience

**Status:** QUALIFIED  
**Harness:** 29/29 PASS  
**Tests:** 15/15 PASS  
**Replay:** exact  
**Package SHA-256:** `99625d4003a6d7c98ac1a57aee4a3f5857e4fb348d819967bba08128ed1d3133`

AH41 distinguishes three logical verifier seats from the physical principals that actually control them.

Independent ownership:

```text
PRINCIPAL_A -> A
PRINCIPAL_B -> B
PRINCIPAL_C -> C
```

Fused negative control:

```text
PRINCIPAL_A -> A + B
PRINCIPAL_B -> C
PRINCIPAL_C -> no verifier seat
```

Physical compromise thresholds:

```text
verification            2 -> 1
strict declassification 3 -> 2
weak 2-of-3 control     2 -> 1
```

At `p=0.1` independent physical-principal failure probability, verification reliability falls from **0.972** to **0.900** under fusion, while strict declassification availability rises from **0.729** to **0.810** because only two actual seat holders remain required.

The fused topology creates a verification single point of failure at `PRINCIPAL_A`. The weak 2-of-3 declassification negative control permits `PRINCIPAL_A` alone to release Epoch 0. Under the strict independent policy, a two-principal malicious upgrade attempt is refused and public residual privacy remains **0.4 bits**.

Operational statements:

```text
logical quorum size != independent principal threshold
role fusion can change compromise threshold and availability in opposite directions
availability quorum != declassification compromise threshold
```

Claim firewall: finite ownership/coalition/reliability result only. No threshold cryptography, BFT, malicious-party MPC, production custody, secure hardware independence, or real-world correlated-failure theorem.

---

# AH42 — Independence Certification and Hidden Common Control

**Status:** QUALIFIED  
**Harness:** 44/44 PASS  
**Tests:** 16/16 PASS  
**Replay:** exact  
**Package SHA-256:** `9b30f815b1d4885e79e39c5aa4fb7a0ccf01862a6845074d935c7ac4093e4725`  
**Result SHA-256:** `307be5163fc670b208e8f1a7d70b8b586dc70d18490485166f4a492689b026ba`

AH42 makes independence itself an evidence-bearing claim by separating logical seats, named principals, and actual root control domains.

Frozen outcomes:

```text
S1 CERTIFIED_INDEPENDENT
  roots: ROOT_A / ROOT_B / ROOT_C
  VERIFY threshold 2 · strict DECLASSIFY threshold 3

S2 SHARED_CONTROL_OBSERVED
  roots: ROOT_AB / ROOT_AB / ROOT_C
  VERIFY threshold 1 · strict DECLASSIFY threshold 2
  declaration contradicted by shared-control evidence

S3 INDEPENDENT_BUT_UNVERIFIED
  hidden roots are independent
  evidence incomplete
  status INDEPENDENCE_UNVERIFIED
  no independent threshold advertised

S4 HIDDEN_SHARED_UNVERIFIED
  hidden roots ROOT_AB / ROOT_AB / ROOT_C
  evidence incomplete
  status INDEPENDENCE_UNVERIFIED
  no false three-independent-domain claim
```

At `p=0.1` per actual root domain, the independent topology has verification reliability **0.972** and strict-declassification reliability **0.729**. The shared A+B topology has **0.900** and **0.810** respectively.

The evidence progression over shared-control ground truth is:

```text
INDEPENDENCE_UNVERIFIED
  -> INDEPENDENCE_UNVERIFIED
  -> SHARED_CONTROL_OBSERVED
```

and never produces `CERTIFIED_INDEPENDENT`.

Operational statements:

```text
logical seat count != named-principal count != verified independent control-domain count
different account names != independent authority domains
missing independence evidence should produce refusal, not optimistic certification
```

**Claim firewall:** finite control-domain/evidence toy model only. No real organizational independence, HSM/hardware independence, identity-proofing guarantee, credential-compromise probability, or Byzantine-independence result is claimed.

