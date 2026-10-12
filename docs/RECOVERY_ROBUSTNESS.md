# NBG-BR3 · Recovery Robustness & Boundaries

Protocol: `NBG-BR3-v0.1.0` · Origin: `SIMULATED` · Authority: `NONE`

## Question and relation to earlier work

BR1 showed that undisturbed velocity correlation does not imply full-state recovery following a kick. BR2 mapped that distinction over 972 finite synthetic configurations, with 38-second observations and one kick to B. **BR3 challenges the sensitivity of that conclusion to the observer's choices rather than silently expanding the meaning of BR2's results.**

BR1 and BR2 are left byte-for-byte intact. BR3 implements the same linear dimensionless four-state equations in a separate code path, including a BR1 parity test for an overlapping case.

## Frozen finite stress plan

**27 base configurations** (3 coupling × 3 directional asymmetry × 3 damping), not the complete BR2 grid:

| Variable | Preselected values |
|---|---|
| Coupling k | 0, 0.85, 1.5 |
| Asymmetry a | -0.9, 0, 0.9 |
| Damping γ | 0.07, 0.22, 0.46 |
| Detuning δ | 0.12 (fixed) |
| Horizon | 38, 60, 120 seconds |
| Perturbed velocity | A, B, BOTH (each receives +2 for BOTH) |
| Fixed RK4 integration step | 0.04, 0.02 seconds |
| Full-state recovery threshold | 0.03, 0.06, 0.12 |
| Kick moment | t=10 s |
| Recovery confirmation | continuously below threshold for the **final two seconds** |
| Coarse baseline correlation flag | ≥0.95, computed on final 8 s of the undisturbed simulation |
| Initial state | 4 zeros |
| Sinusoidal forcing | 0.75 sin(1.2t), applied only to A |

Total: **27 × 3 horizons × 3 kick locations × 2 steps = 486 independent integrations**, each scored at **three prespecified thresholds**: **1,458 recovery outcomes**. Threshold classification uses the exact per-time-step full-state Euclidean residue, not sparse plot sampling. The program should refuse off-grid inputs. The same fixed RK4 method is used throughout; numerical convergence is *tested* by comparing steps and is not assumed.

## Mathematical semantics

```
d x_A / dt = v_A
d v_A / dt = -(1.2)^2 x_A - γ v_A + k(1-a)(x_B - x_A) + 0.75 sin(1.2t)
d x_B / dt = v_B
d v_B / dt = -(1.2 + 0.12)^2 x_B - γ v_B + k(1+a)(x_A - x_B)
```

Baseline and perturbed trajectories share initial conditions and forcing until t=10, when perturbation is injected into the A and/or B velocity components. The **full-state residue** is the Euclidean norm of the difference of all four state coordinates. A case recovers under threshold θ only when the last uninterrupted below-θ segment spans ≥2 s through the experiment horizon. If that condition is not observed, record `HORIZON_CENSORED` and `recoveryTime=null`. Do **not** substitute zero, assume permanent failure or call it chaos.

## Explicit diagnostics

- **Horizon rescue:** at fixed k, a, γ, kick site and step 0.04, θ=0.06, not recovered by 38 s but recovered by 120 s.
- **Kick-site sensitivity:** at 38 s, θ=0.06 and dt=0.04, the sites A, B, BOTH give different recovery/censor decisions.
- **Threshold sensitivity:** for a B kick at 38 s, dt=0.04, the three θ values alter recovered/censored decision. A stricter-threshold success must imply success for every looser threshold on the same trajectory.
- **Step-size sensitivity:** for a B kick at 38 s, θ=0.06, 0.04 vs 0.02 change the recovered/censored decision or, when both recover, change measured recovery time. The UI separately marks changes larger than 0.08 s.
- **Keyhole mismatch:** undisturbed velocity correlation ≥0.95 but no observed full-state B-kick recovery by 38 s at θ=0.06 and dt=0.04.

**Crucial interpretation:** recovery comparisons at unequal horizons do not estimate a survival curve. A longer horizon may rescue an earlier censoring classification, and an altered observation window may also change undisturbed velocity correlation. “High correlation” does not mean recovered, phase-locked, causally coupled, physically stable, or socially balanced.

## Negative controls and audit gates

1. At k=0, undisturbed oscillator B is never driven and baseline correlation is undefined; kick A/B/BOTH changes only the appropriate independent oscillator subsystem.
2. A BR3 B-kick default scenario must numerically reproduce BR1's final residue, recovery time and baseline velocity correlation to rounding tolerance.
3. Every finite grid element must be present exactly once, and every outcome must be `RECOVERED`, `HORIZON_CENSORED` or `NUMERIC_RUNAWAY`; these are disjoint.
4. No null recovery time can be counted as zero or as a success.
5. Threshold relaxation cannot convert a successful trajectory into an unsuccessful one for the same run.
6. Different integration steps are not treated as independent experiments or empirical replications.
7. No simulated model output is eligible for biological, social, gender, metaphysical, physical or clinical authority.
8. Negative damping and nonlinear chaos experiments are **out of scope**, as are claims of Lyapunov instability or newly discovered physics.

## Reproduction

```bash
npm run test:recovery-robustness
npm run sweep:recovery-robustness
node scripts/run_recovery_robustness.mjs --out br3-receipt.json
npm run build
```

The CLI prints a SHA-256 digest of the complete, newline-terminated receipt bytes; it is *not* evidence that the output file has been committed to Git unless explicitly uploaded. The React UI uses a selected 162-run damping slice; the full 486-run frozen sweep runs via CLI/CI. JSON exports preserve `SIMULATED` and `authority: NONE`.

## Next rung

If BR3 reveals material sensitivity to the step size, investigate higher-order or analytically solvable linear reference comparisons. If results change with thresholds and horizons, report the dependency honestly. Generalizing to nonlinear dynamics would require a separately frozen protocol and diagnostics, not a reinterpretation of these linear trajectories.
