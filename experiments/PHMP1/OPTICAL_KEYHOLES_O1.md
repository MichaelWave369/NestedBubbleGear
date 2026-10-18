# Optical Keyhole O1 | π, Jones phase, and the Poincaré sphere

**Status:** implemented mathematical sanity benchmark, not a new PHMP-3 memory evaluation. **Origin:** `SIMULATED`. **Authority:** `NONE`.

This work follows the [Optical Keyholes exploratory note](OPTICAL_KEYHOLES_NOTE.md) and the images covering Maxwell, Young, Malus, Euler's identity, spherical geometry, and Gaussian normalization. The bridge is **conventional optical polarization mathematics**, not evidence that NBG bubbles are literal spheres or that `π` has an additional privileged role in an AI substrate.

## Why this tests an actual idea

For a normalized Jones state `z=(a,b)`, the intensity-only Keyhole is:

```text
P(z) = (|a|², |b|²)
```

The complete normalized pure-polarization state, modulo its unobservable common phase, maps onto the **unit Poincaré sphere** with convention:

```text
S1 = |a|² - |b|²
S2 = 2 Re(conj(a) b)
S3 = 2 Im(conj(a) b)
S1² + S2² + S3² = 1
```

This realizes `CP¹ ≅ S²` as an established classical polarization representation. Sphere surface area `4πr²` is a **geometric formula** and does not grant an area-law compression mechanism for memory or spacetime.

For the balanced family

```text
z(θ,ψ) = exp(iψ) (1,exp(iθ)) / sqrt(2)
```

the global angle `ψ` must disappear from every pure-polarization intensity/Stokes readout, while the relative angle `θ` traces `(S1,S2,S3)=(0,cos θ,sin θ)`. A common factor `exp(iπ)=-1` changes the Jones vector's sign but not the polarizer measurements; a relative factor `exp(iπ)` does change the state and analyzer probabilities. Do **not** confuse common and relative phase.

## PHMP-1 witness as ordinary optics

```text
X  = (1,1)/sqrt(2)     45° linearly polarized
X' = (1,i)/sqrt(2)     one circular handedness
P(X) = P(X') = (1/2,1/2)
Stokes(X)  = (0,1,0)
Stokes(X') = (0,0,1)
```

With normalized analyzer vectors `d=(1,1)/sqrt(2)` and `r=(1,i)/sqrt(2)`, ideal transmission probabilities/intensities are `M_u(z)=|u†z|²`:

| Analyzer | X | X' |
| --- | ---: | ---: |
| Horizontal | 1/2 | 1/2 |
| 45° diagonal `d` | 1 | 1/2 |
| Circular `r` | 1/2 | 1 |

Two opposite circular handednesses are also indistinguishable through the diagonal-only analyzer but distinguishable through a circular analyzer. Thus *the particular observer matters*. This is standard Jones calculus, not an NBG-specific law.

The diagonal analyzer on `z(θ,ψ)` obeys `(1+cos θ)/2`; the circular analyzer obeys `(1+sin θ)/2`. These are direct conventional intensity-projection identities, not additional postulates.

## Test procedure and controls

Run:

```sh
npm run test:phmp-optical-o1
node scripts/test_phmp_optical_o1.mjs --out optical-o1-local-receipt.json
```

The script uses only Node.js built-ins. The `--out` path must be new and is never written during the standard test. An independent JavaScript execution of its assertion body passed **3895/3895** deterministic checks before GitHub review; GitHub CI must be verified separately.

The fixed finite audit covers 97 relative-phase samples at `θ=2πk/96` for `k=-48..48`, each with five common phase offsets, plus 15 explicit witness and control checks.

Acceptance includes:
- Unit-radius Stokes norm for every sample.
- Equality of the magnitude Keyhole for all balanced states, even when their relative phase differs.
- Predicted diagonal and circular transmission readouts.
- Invariance under a common `π` or `2π` phase shift.
- Detectability of opposite circular handedness by the circular analyzer and non-detectability by the diagonal-only analyzer.
- Closure of the relative `2π` sweep.
- Explicit `SIMULATED / authority NONE` receipt and zero access to PHMP-3's reserved dataset.

## Why the other π identities aren't evidence for NBG

The circle and sphere formulas, Leibniz series, Basel problem, Gaussian integral, Wallis product, and Stirling asymptotic are all established mathematics. Their shared appearance of `π` follows from known analytic and geometric structures. It does **not** imply those equations jointly describe a new NBG physics theory.

The Gaussian integral may motivate a **separately preregistered** study of phase/readout noise. Do not retrofit a noise model into PHMP-3's frozen memory evaluation based on the infographic.

## Result category

`EXACT_ESTABLISHED_OPTICS_SANITY_WITNESS`, not `NBG_PREDICTION_SUPPORTED`.

The test clarifies which Keyholes reveal relative phase, how classical complex-state geometry works, and which apparent hidden distinctions are mere global-phase gauge redundancy. It does not measure actual photons, quantum memory, optical hardware, physical energy, or AI benchmark gains.

**Ledger Above Ego.**
