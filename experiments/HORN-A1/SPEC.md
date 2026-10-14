# NBG-HORN-A1 · Finite Bulk / Persistent Boundary (v0.1.0)

**Origin:** SIMULATED / FORMAL. **Authority:** NONE. **Empirical claim:** NONE.

## Question

Can a growing family of finite horn sections have bounded cumulative bulk volume and
unbounded cumulative interface area? For a separately **stipulated** boundary-sensitive
interaction, can two coarse-equal orientations become distinguishable after an allowed probe?

This is a classical calculus benchmark plus a minimal Altermath **toy witness**, not a
discovery of a physical force or proof that infinite area creates infinite causal power.

## Geometry (no adjustable hypotheses)

Rotate y = 1/x, x >= 1, around the x-axis (Gabriel's Horn). The finite prefix
consists of N unit-length sections [n,n+1], n=1,...,N; endpoint b=N+1.
Use *lateral* area only, excluding the cap at x=1.

- Volume V(1,b) = pi (1 - 1/b), so V(1,infinity) = pi.
- Section volume dV_n = pi/[n(n+1)].
- Lateral area A(a,b) = 2*pi * integral_a^b sqrt(1+x^-4)/x dx.
- Closed-form A(a,b) = pi * [asinh(b^2) - asinh(a^2)
  + sqrt(1+a^-4) - sqrt(1+b^-4)].
- Section area dA_n = A(n,n+1), asymptotically 2*pi/n.
- For b > 1:
  2*pi*ln(b) <= A(1,b) <= 2*pi*ln(b) + (pi/4)*(1-b^-4).
  Thus cumulative area diverges while volume converges.

All computed prefixes are finite: no code runs an actually infinite object.
The equality V(infinity)=pi and divergence are theorems about the limits.

## Finite Altermath witness and explicit intervention

Fix the first **two longitudinal sections** (not physical nested shells).
Each gets a synthetic orientation label sigma_i in {-1,+1}.

- X = (+1,-1); X' = (-1,+1).
- Initial coarse Keyhole K0 returns {bulk volume, sum of labels, readout:null}.
  Therefore K0(X)=K0(X'). Geometry and total bulk are **identical**.
- Richer Keyhole K1 additionally exposes the ordered pair of labels,
  and separates X and X' before an intervention.
- The admitted synthetic future word is an AREA_WEIGHTED probe that appends
  R(X)=sigma_1*dA_1 + sigma_2*dA_2 to the observable readout.
  R(X)=dA_1-dA_2 > 0; R(X')=-R(X) < 0.
  Therefore K0(probe(X)) != K0(probe(X')).

The probe's boundary coupling is **defined by us**. This witness shows how a
task-dependent observer can miss information it later needs, under stipulated
dynamics. The geometric theorem alone does **not** prove Altermath in nature.

## Named tests and preregistered controls

| Gate | Asserted observation | Fail criterion |
| --- | --- | --- |
| H1 finite bulk | Sum over sections telescopes, residual volume pi/(N+1) decreases, total below pi | Disagreement with the analytic formula, incorrect partition, or nonmonotone convergence |
| H2 growing boundary | Closed-form area matches independent log-coordinate Simpson quadrature; rigorous log lower and upper bounds hold | Wrong quadrature, monotonicity, or violated bound |
| H3 coarse-equivalent pair | K0 initial views equal; area-weighted probe makes readouts opposite and nonzero | Coarse leakage, zero or same area-weighted readout |
| H4 observer refinement | K1 initially distinguishes the ordered interface labels | K1 still aliases orientations |
| NC1 uniform weights | Reversing labels under UNIFORM coupling gives equal zero readouts | False positive caused by any canceled orientation |
| NC2 disabled coupling | No coupling yields equal zero readouts | Model claims uncaused residue |
| NC3 input refusal | Invalid endpoints, labels, probes, and injected state fields are refused | Silent coercion or forged observer state |

## Limits and interpretation

1. **Known geometric divergence** is not newly discovered experimental data.
2. The intentionally selected area-sensitive probe creates the behavioral distinction.
   It is not an independently inferred interaction law. The two-section difference
   is finite; in particular nothing in this model implies unbounded probe responses.
3. Infinite mathematical boundary area alone implies **neither** infinite information,
   energy, physical surface coating, computation, signal capacity, nor a persistent
   physical causal effect. A physically fixed-thickness paint layer cannot be
   assumed to follow an infinitely narrowing ideal horn.
4. Coarse equality is relative to the declared K0, not every possible measurement.
5. There are no external observations, random samples, quantum effects, material
   experiments, or empirical validations. The receipt digest is an artifact ID,
   not external attestation. Historical AH evidence packages are untouched.

## Reproduce

~~~sh
npm run test:horn-a1
npm run receipt:horn-a1
npm run receipt:horn-a1 -- --out horn-a1-receipt.json
~~~

Implementation: [src/hornA1.js](../../src/hornA1.js).
Tests: [scripts/test_horn_a1.mjs](../../scripts/test_horn_a1.mjs).
Receipt runner: [scripts/run_horn_a1.mjs](../../scripts/run_horn_a1.mjs).
Research boundary: [CLAIMS.md](../../CLAIMS.md).
