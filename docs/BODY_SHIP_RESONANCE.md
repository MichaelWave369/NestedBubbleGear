# BSR-1: Body-Ship Resonance (synthetic pilot)

**Status:** SIMULATED / model illustration only. **Source:** original implementation,
inspired by the oscillation imagery associated with Itzhak Bentov's
*Stalking the Wild Pendulum* and its discussion in the 1983 Gateway report.
No part of the historical diagram is treated as an empirical biological dataset.

## Question

If three abstract oscillators exchange energy through nearest-neighbor spring
coupling, does their trajectory differ from the same three oscillators evolved
independently? Does rotating the resulting drawing change any physical
quantities? What happens to accounted energy at an oscillator's turning point?

This is a mathematically answerable question. It does **not** test whether humans
are spacecraft, whether conscious experience accesses other dimensions, whether
there is an “Absolute,” or whether energy “clicks out” of spacetime.

## Frozen synthetic model (BSR-1.0.0)

Let dimensionless displacement q_i and velocity v_i denote three independent
coordinates, i=1,2,3. Set m=1, natural angular frequencies
ω = (1-Δω, 1, 1+Δω), and nearest-neighbor coupling k. The conservative equations
of motion are

```text
q''_i = -ω_i² q_i - k Σ_{j adjacent to i} (q_i - q_j)
q(0)  = (1, 0.15, -0.6)
v(0)  = (0, 0.55, 0.2)
E     = 0.5 Σ(v_i² + ω_i² q_i²)
        + 0.5 k [(q_1 - q_2)² + (q_2 - q_3)²]
```

Simulation uses the velocity-Verlet algorithm, dt=0.01 for t∈[0,12],
with an exported observation every eight steps. No stochastic seed or
hidden external input is used. The model is deterministic. All frequencies,
times, lengths and energies are dimensionless and synthetic.

The web console offers control ranges k∈[0,0.8] and Δω∈[0,0.45]. An energy
drift diagnostic (max |E(t)-E(0)|/E(0)) detects numerical error rather than
asserting exact arithmetic conservation.

## Predeclared controls and expected observations

1. **Negative control:** k=0, same initial conditions, ω, integration and
   sampling; candidate and control displacement curves must coincide when k=0.
2. **Coupled positive control:** with k>0, expect trajectories to differ from
   their uncoupled counterpart. Report the full time-grid root-mean-square
   displacement difference, not a subjective resemblance score.
3. **Energy accounting:** for the frozen presets, require max relative drift
   below 0.001. This is a numerical stability check, not proof of new physics.
4. **Turning-point check:** detect a velocity sign change and record total
   system energy. Velocity vanishing locally is not energy vanishing globally.
   In a coupled chain, the local oscillator is not an isolated system.
5. **Orientation negative control:** rotation by 90 degrees is applied only in
   SVG rendering. The simulator receives no orientation parameter and its
   trajectories, energy, controls, and comparison scores are unchanged.

## Rejection and promotion rules

- Reject claims of mechanical energy disappearance based on turning-point
  velocity alone. Such a claim would require independent measurement and
  a sound open-system energy accounting protocol; this toy model provides neither.
- Reject claims of body, tree, astronomical, archaeological or consciousness
  equivalence based on silhouettes or rotating a plot.
- Reject inference about heartbeat, respiration, EEG, electromagnetic biology,
  medical outcomes, or Planck-scale transitions from this synthetic model.
- Promote only the narrow claim that a conservative, coupled *mathematical*
  chain shows trajectory changes from an uncoupled null if the tests are green,
  and publish numerical drift and control settings with each result.

A future **BSR-2** can examine independently sourced physiological time-series
with explicit units and sampling rates, synthetic/real provenance separation,
time-shuffle and phase-randomized controls, missing-data policy, holdout
evaluation, and independent statistics review. No physiological data are used
in BSR-1.

## Replay instructions

```bash
node scripts/test_body_ship_resonance.mjs
npm run dev
```

Open the `#body-ship` section of the React lab, use the preset or sliders,
select the 90-degree view and negative control overlay, and export the
deterministic JSON receipt. A receipt records parameter settings,
provenance=SIMULATED, drift, comparison RMS and the experimental exclusions.

**Evidence classification:** proven mathematics of this chosen discrete model,
numeric simulation of those equations, unverified physical analogies.
Neither the image nor the historical source adds empirical measurements.
