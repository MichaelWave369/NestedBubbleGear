# NBG-BR2 · Resilience Atlas
Protocol `NBG-BR2-v0.1.0` · evidence origin `SIMULATED` · authority `NONE`

## Research question

In the same dimensionless linear two-oscillator model as BR1, how do coupling strength, directional asymmetry, damping and frequency detuning change (a) return after a velocity shock and (b) the baseline velocity-correlation observer? Are apparent coordination and full-state resilience interchangeable? Is reciprocal coupling always faster to recover than directional coupling?

BR2 extends BR1's **toy model** and makes no assertion that a society, biological system, cosmic field, mechanical transmission or consciousness obeys its equations. It does **not** simulate or claim physical chaos.

## Frozen factorial design (972 independent cells)

| Factor | Values |
|---|---|
| Coupling k | 0, 0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00 |
| Directional asymmetry a | -1, -0.75, -0.50, -0.25, 0, 0.25, 0.50, 0.75, 1 |
| Damping gamma | 0.08, 0.22, 0.46, 0.80 |
| Detuning delta | 0, 0.12, 0.36 |
| Full grid | **9 × 9 × 4 × 3 = 972 cells** |

Every cell uses the BR1 equations and the *same* RK4 step `0.04`, duration `38`, pulse time `10`, kick magnitude `2` to oscillator B, forcing amplitude `0.75`, and initial state `[0,0,0,0]`. BR2 uses coarser time discretization than BR1's default `0.02`; its results are therefore not presumed exactly identical to the older BR1 illustrative table.

Directionality convention: `k_AB=k(1-a)` (B affects A), `k_BA=k(1+a)` (A affects B). This is abstract *directed feedback*, not passive mechanical reciprocity. For `a=0`, coupling is reciprocal. For `k=0`, all asymmetry values are mathematically inert. All factor values and comparison rules are chosen before examining any real data, because there are no real data.

## Two separate Keyholes

**Full-state recovery task:** norm between the undisturbed and kicked four-component state vectors is below `0.06` continuously over the final two seconds of the run. Report `RECOVERED` and the start of that sustained interval minus the pulse time. Otherwise `HORIZON_CENSORED` and `recoveryTime=null`. Censoring **does not** establish permanent nonrecovery, divergence, instability, or chaos. Numeric runaway is separate, with `DIVERGED`.

**Coarse coordination Keyhole:** Pearson correlation between undisturbed A and B **velocities** across the final eight seconds, with `null` if variance is insufficient. Correlation ≥ `0.95` is a *thresholded descriptive flag*, not evidence of biological phase locking, a causal mechanism or recovered perturbed state. `mismatch=true` means baseline coordination is high **while recovery of the kicked pair is not observed**.

## Matched reciprocal comparison

Every directional `a ≠ 0` cell compares **only** against `a=0` at the *same* `k, gamma, delta`.

- If both recover, `recoveryAdvantageSeconds = t_reciprocal - t_directional`. Positive means directional recovers earlier in that synthetic comparison; negative means reciprocal earlier; zero means tied at the grid's time resolution.
- If exactly one recovers, return `DIRECTIONAL_ONLY_RECOVERS` or `RECIPROCAL_ONLY_RECOVERS`. Do not pretend a censored time is zero, or compute a numerical time difference.
- If neither recovers, return `BOTH_CENSORED` without claiming they are equally robust.
- `a=0` rows are `RECIPROCAL_BASELINE`.
- If numeric runaways occur, label them as such and withhold the time comparison.

The fraction of faster/slower cases is a property of this **convenience-selected finite grid**. It is not a population estimate, causal law, or independently validated fact about real coupled systems.

## Controls and falsification

1. `k=0`: changing asymmetry must have no effect on trajectories, recovery or correlations.
2. `kick=0`: two same-initial-condition solutions must have identically zero full-state residue.
3. Weak-damping control: tests the important case where baseline correlation can remain high while kick recovery fails by the horizon.
4. Negative-damping gain control: tests runaway without classing instability as chaos; **outside the main positive-damping factorial sweep**.
5. Every cell must have an exact reciprocal counterpart and intact provenance; no duplicates.
6. `correlation >= 0.95` is not allowed to set `recovered=true`.
7. A blanket claim that asymmetry always hurts recovery is **falsified by any matched directional-faster cell**; a blanket claim that asymmetry always helps is falsified by any reciprocal-faster cell. Neither direction is assumed.

## Reproduce

```bash
npm run test:resilience-atlas
npm run sweep:resilience-atlas
node scripts/run_resilience_atlas.mjs --out br2-full-sweep.json
```

The optional output is a newline-terminated, deterministic JSON record containing the 972 cells, per-slice summaries, negative controls and explicit `SIMULATED` metadata. The CLI prints SHA-256 of the **exact saved output bytes**. The GitHub Pages explorer computes only the selected 81-cell slice and supports a separate browser JSON export. No baseline trace is exported as raw measurement; all trajectories are synthetic.

## Boundaries / next rung

BR2 does **not** establish universal phase synchronization, physical gear behavior, chaos, a principle of cosmological balance, or a causal explanation for social or gender hierarchy. It provides a transparent way to study **observer mismatch** in a narrow linear dynamical system.

A next rung should test time-step and horizon sensitivity, choice of perturbation site, alternative recovery thresholds and nonlinear models before making any general mathematical robustness claims. The two-dimensional atlas is a *slice* through a four-dimensional frozen grid; visual boundaries can shift across omitted axes.
