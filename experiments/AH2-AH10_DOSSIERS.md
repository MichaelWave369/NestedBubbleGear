# Frozen AH2→AH10 Experiment Dossiers

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
