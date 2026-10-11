# NBG-BR1 · Balance and recovery in coupled oscillators

**Status:** exploratory synthetic demonstration; no empirical or social-scientific claims.
**Protocol:** `NBG-BR1-v0.1.0`.
**Origin:** `SIMULATED`. **Authority:** `NONE`.

## Question

Can two interacting systems retain coordinated motion while differing in their capacity to recover from a disturbance? Does asymmetry necessarily destroy recovery? BR1 makes both propositions *testable*, not axiomatic.

## Frozen synthetic design

State is `s=(x_A,v_A,x_B,v_B)`. The dimensionless model integrates

```
dx_A/dt = v_A
dv_A/dt = -(1.2)^2 x_A - gamma v_A + k_AB (x_B - x_A) + F sin(1.2t)
dx_B/dt = v_B
dv_B/dt = -(1.2 + delta)^2 x_B - gamma v_B + k_BA (x_A - x_B)
k_AB = k(1-a); k_BA = k(1+a)
```

using fixed-step RK4 (default `dt=0.02`). At `t=10 s`, only the perturbed copy receives an instantaneous `+2` velocity kick on B. An untouched reference copy receives the same initial conditions and periodic forcing. `a=0` is reciprocal, `a=+1` is maximally B-responsive and A-independent, and `a=-1` is the opposite directional limit. Unequal coupling is an *abstract directed feedback model* and not an assertion about passive mechanical gears.

Defaults: `k=0.85`, `a=0`, `gamma=0.46`, `delta=0.12`, `F=0.75`, horizon `38 s`. Range validation refuses nonfinite and out-of-bounds parameters.

## Metrics / observer separation

- **Full-state residue:** Euclidean norm between *all four* reference and perturbed state components at the same time. This is not an energy or a statistical confidence interval.
- **Recovery:** residue below `0.06` continuously for the final two seconds of the recorded run; recovery time is the first step in that final uninterrupted low-residue window minus pulse time. Missing the horizon yields `NOT OBSERVED`, **not** proof that recovery never occurs.
- **Coordination Keyhole:** Pearson correlation between the two undisturbed oscillator velocities during the final eight seconds. Null if the signal has no variance. This coarse projection can be noninformative about full-state recovery and does not establish phase synchronization or causal direction.
- **Runaway:** negative damping (`gamma<0`) is a deliberately injected energy-gain control; linear instability is not evidence of chaos.

## Comparison arms

1. Reciprocal damped feedback (baseline).
2. Strongly directional coupling, keeping the other parameters fixed.
3. Uncoupled control (`k=0`), which should have null B velocity correlation because B is never driven.
4. Weak damping, which should take longer to recover or remain above threshold at the fixed horizon.
5. Negative damping, an intentionally unstable control (not a chaos experiment).
6. Zero-kick negative control, which should produce exactly zero residue.

## Illustrative deterministic runs (synthetic, not observed data)

With the fixed default horizon and kick, these are reproducible examples, **not** independent empirical validation:

| Arm | Recovery within horizon? | Time to sustained return | Final state residue | Baseline velocity correlation |
|---|---|---:|---:|---:|
| Reciprocal | Yes | 14.40 s | 0.0031 | 0.9131 |
| Directional asymmetry 0.9 | Yes | 14.02 s | 0.0018 | 0.9655 |
| Uncoupled | Yes | 14.82 s | 0.0027 | undefined (B not driven) |
| Weak damping | No | not observed | 0.6674 | **0.9957** |
| Negative damping | No | not observed | 722.4138 | 0.9086 |

The **weak-damping counterexample** is the central Keyhole lesson: a correlation close to 1 on an undisturbed baseline does not imply that a kicked system has recovered. The **directional case** also recovers slightly sooner than the reciprocal case under the selected parameters, falsifying any automatic claim that greater directional asymmetry always reduces resilience. The uncoupled case can recover independently without coordinating, which is another reason not to collapse those concepts.

## Falsifiers and limitations

The blanket hypothesis "greater asymmetry always means poorer recovery" is **not assumed**. Some directional configurations can recover at least as quickly as reciprocal ones; the interactive lab exposes that possibility. This simulator alone cannot establish that imbalance causes chaos, that NBG reveals new physics, or that social hierarchies share the oscillator equations. Correlation is not leadership, domination, agency, or ethics.

No external datasets, people, physical measurements, or ML models are involved. A JSON receipt preserves parameter choices and derived metrics without claiming independently observed evidence. To reproduce: `node scripts/test_balance_recovery.mjs` or interact with the GitHub Pages Balance & Recovery Lab.

## Next independent rung

Freeze a prespecified sweep over `(k,a,gamma,delta)` with full-state recovery time, correlation, and horizon-censoring counts; add negative controls where a high coordination score coexists with poor disturbance recovery. If investigating chaos later, adopt an appropriate nonlinear system and prespecify Lyapunov or return-map diagnostics rather than reading chaos into oscillatory graphics.
