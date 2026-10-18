# Quantum Boundary Q1 | Born measurements, Bell correlations and a classical null

**Status:** exact-formula, simulated quantum-information sanity benchmark. **Origin:** `SIMULATED`. **Authority:** `NONE`.

This test was inspired by an educational "20 Quantum Mechanics Equations" infographic and follows the [PHMP-1 complex-phase sanity witness](SPEC.md) and [Optical O1/O2 classical polarization tests](OPTICAL_KEYHOLES_O1.md). It specifically tests the boundary between *shared complex/vector mathematics* and *claims about entanglement*. It does **not** present a new NBG quantum theory.

## What the image shows, and what must not be inferred

The image's Bell-state example is

```text
|Phi+> = (|00> + |11>)/sqrt(2)
```

and it notes perfectly correlated outcomes for both parties measuring in the 0/1 basis. **Those matching outcomes alone are not evidence of entanglement**, because the separable, classically correlated mixed state

```text
rho_mix = (|00><00| + |11><11|)/2
```

has exactly the same 0/1 outcome probabilities. To test a feature of entanglement, inspect correlations across **different local measurement settings**, not merely same-basis matching.

The density matrices, in ordered basis `00,01,10,11`, are

```text
rho_Bell = [[.5,0,0,.5],
            [0,  0,0,  0],
            [0,  0,0,  0],
            [.5,0,0,.5]]

rho_mix  = [[.5,0,0,  0],
            [0,  0,0,  0],
            [0,  0,0,  0],
            [0,  0,0,  0],
            [0,  0,0, .5]]
```

Both have maximally mixed local marginals. The Bell density matrix contains off-diagonal coherence `rho[0,3]=rho[3,0]=.5`, whereas the mixture has none.

## Exact Born measurements and CHSH control

Use the ideal qubit observable `M(theta) = cos(2 theta) Z + sin(2 theta) X`, with standard Pauli matrices `X, Z`. Its outcome projectors are `Pi_s(theta) = [I+s M(theta)]/2`, for `s=+1,-1`. The predicted joint Born probability is

```text
P(s,t|a,b) = Tr[rho (Pi_s(a) tensor Pi_t(b))]
E(a,b) = P(++|a,b)+P(--|a,b)-P(+-|a,b)-P(-+|a,b)
S = E(a,b) + E(a,b') + E(a',b) - E(a',b')
```

For this particular Bell state and real-plane measurement family,

```text
E_Bell(a,b) = cos[2(a-b)]
E_mix(a,b) = cos(2a) cos(2b)
E_product_00(a,b) = cos(2a) cos(2b)
```

Choose standard CHSH angles `a=0, a'=pi/4, b=pi/8, b'=-pi/8`:

| Simulated state | Matches both 0/1 outcomes? | CHSH S |
| --- | --- | ---: |
| Pure `|Phi+>` Bell state | Yes, 50% 00 and 50% 11 | `2 sqrt(2) ≈ 2.828427` |
| Separable correlated mixture | Yes, the **same** 0/1 distribution | `sqrt(2) ≈ 1.414214` |
| Product `|00>` | No, always 00 in that basis | `sqrt(2) ≈ 1.414214` |

The Bell-state *quantum prediction* exceeds the CHSH local-hidden-variable limit of 2. **This Node.js calculation is not a physical Bell-test experiment.** It contains no randomized spacelike-separated measurements, no actual outcomes, no closing of loopholes, and no evidence of physical nonlocality from NBG software.

## Mathematical overlaps and obstructions

- **Born rule (#4/#9):** A probability takes the squared magnitude of a suitable amplitude or state projection. Optical O1/O2 already use analogous *classical* intensity norms. This algebraic overlap does not automatically make the optical fields entangled particles.
- **Unitary evolution (#6/#8):** A normalized state may evolve by a unitary matrix and interfere. PHMP-1's H/S controls are the same *abstract* matrices used for qubit gates, but their implementation remains classical software.
- **Operator order (#12):** Finite Pauli matrices can fail to commute: `[X,Z]=XZ-ZX=[[0,-2],[2,0]]`. However, the canonical infinite-dimensional commutator `[x,p]=i hbar I` cannot hold **exactly** for any finite-dimensional pair of matrices because the trace of a finite commutator is always zero, whereas the trace of `i hbar I` is nonzero for nonzero `hbar`. A finite H/S simulation is therefore *not* an exact representation of the full canonical position-momentum algebra.
- **Spin (#18):** The mathematical dimension two does not by itself establish physical fermionic spin-1/2, a Stern-Gerlach experiment, or exchange statistics.
- **Entanglement (#20):** Ordinary two-qubit predictions include correlations across incompatible choices of basis, unlike simple matching-bit intuition.

## Run

```sh
npm run test:phmp-quantum-q1
node scripts/test_phmp_quantum_q1.mjs --out quantum-q1-local-receipt.json
```

`--out` creates a new receipt file only and refuses overwrite. Standard `npm test` executes only this deterministic mathematical sanity test.

The test sweeps **25 × 25 measurement-angle pairs across three state classes** and checks four probability/correlation properties per class, alongside 39 explicit normalization, coherence, same-basis, local-marginal, Bell-setting, and finite-commutator controls.

**Independent pre-CI JavaScript validation:** 7,539/7,539 assertions passed. The exact source and test is committed as an additive independent experiment; GitHub CI must still be confirmed.

## Result status and prohibited promotion

`ESTABLISHED_QUANTUM_FORMALISM_SIMULATION`, not `PHYSICAL_ENTANGLEMENT_OBSERVED` and not `NBG_QUANTUM_PREDICTION_SUPPORTED`.

This is a scientifically useful negative-control boundary: a 0/1 correlation Keyhole is insufficient to discriminate entanglement from classical correlation. The larger mathematical formalism permits such a discrimination with other settings, subject to the rules of a real Bell test when interpreted experimentally.

**PHMP-3 E2's frozen memory evaluation is entirely separate and is not generated or scored by Q1.** No earlier frozen AH/PHMP data or receipt is altered.

**Ledger Above Ego.**
