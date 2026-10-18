# PHMP-2 Stage 3 | Unitary quotient Keyholes of native SL(2,Z)

**Status:** exploratory, exact finite comparison, not a preregistered new prediction. **Origin:** SIMULATED. **Authority:** NONE.

## Question

Can native AH9/AH10 integer-matrix transport be mapped into genuine finite-dimensional complex-unitary operators **without pretending that the map preserves all native information**?

Yes, by composing two standard constructions:

1. Reduce each native row-vector `G in SL(2,Z)` modulo a chosen prime `p=2 or 3`.
2. Act with `G mod p` on the set `F_p^2 \ {0}` of nonzero **row vectors**. Encode that permutation as a permutation matrix `rho_p(G)`, whose row is the original vector and column its image.

For `p=2`, there are **3** nonzero vectors and `rho_2(G) in O(3) subset U(3)`. For `p=3`, there are **8** and `rho_3(G) in O(8) subset U(8)`.

These are **real orthogonal** permutation matrices, also unitary over the complex field. No physical quantum computer, spinor carrier, or coherent hardware is implied. Cyclic permutation orbits can be diagonalized over C to give roots-of-unity phases, but that does not preserve all native information.

For native row-vector composition `x (GH) = (xG)H`, we require `rho_p(GH)=rho_p(G)rho_p(H)`. For every source matrix, `rho_p(G^-1)=rho_p(G)^T`, and valid native basepoint conjugation maps to conjugation by unitary permutations.

## Reproduce

```sh
npm run test:phmp2-quotients
node scripts/test_phmp2_quotients.mjs --out phmp2-stage3-local-receipt.json
```

The independent script uses Node.js built-ins only, exact BigInt native matrices, integer permutation multiplication, synthetic finite orbits, and deterministic SHA-256 receipts. `--out` refuses overwrite. No original AH source, hash, or receipt is rewritten.

## Exact results from frozen AH9/AH10 connector sets

The **native baseline** counts wrong naive compositions as AH9 **8/12** and AH10 **15/16**.

| Comparison | Native wrong | Detected by p=2 (3D) | Hidden by p=2 | Detected by p=3 (8D) | Hidden by p=3 |
| --- | ---: | ---: | ---: | ---: | ---: |
| AH9 naive vs correct | 8 | 7 | 1 | 8 | 0 |
| AH10 naive vs correct | 15 | 11 | 4 | 15 | 0 |

The 3D quotient loses AH9 connector `A2` and AH10 pairs `A/I`, `B/A`, `B/B`, and `B/S`. These are **false equivalences introduced by the quotient**, not failures of the native AH transport system. The 8D quotient happens to retain all these particular finite distinctions; that does **not** make it globally faithful.

### Mandatory blindness witnesses

- Native `A^2 != I` but `rho_2(A^2)=I_3`.
- Native `A^3 != I` but `rho_3(A^3)=I_8`.
- Native `A^6 != I` but **both** quotients identify it with identity.

No representation can distinguish elements of its kernel. These examples are a precise answer to the question of whether a unitary-phase-compatible observer necessarily retains NBG's entire hidden-transport structure: **no**.

### Concrete complex-phase bridge, without a new physics claim

In the `p=3` quotient, native `A` induces two 3-cycles and two fixed vectors. The real permutation acts unitarily on `C^8`. Fourier vectors supported on its 3-cycles have eigenphases `exp(±2πi/3)`, verified by explicit complex multiplication in the test harness.

This is **ordinary representation theory**: native operator -> finite quotient -> unitary permutation action -> complex eigenphases. The eigenphases are **not** a new Dirac equation or a fundamental physical phase of an NBG substrate.

## Interpretation and next gate

**PARTIAL_CORRESPONDENCE:** There exists a well-defined, composition-preserving finite unitary **quotient** of native SL(2,Z) transports; it is not a faithful embedding or a same-dimension unitarization by change of basis. The Jordan-block obstruction from PHMP-2 Stage 1 remains valid because this construction is many-to-one and changes dimension.

**Limits:** This is a post-hoc, exact census using constructed representations on pre-existing finite cases. It is not an independent forecast, a measured AI memory gain, evidence that NBG offers a novel mathematical law, or evidence for Dirac/quantum/gravitational physics.

**Next:** Develop a frozen task-specific observer budget and held-out transport words where both quotients and conventional finite group/linear algebra baselines are compared. Predefine which information is needed for prediction. If a simpler same-cost baseline does equally well, no NBG-specific advantage is established. Preserve failed quotient witnesses as controls.

Ledger Above Ego.
