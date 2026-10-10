# NBG Phase & Closure Lab · proposed observer experiment

## Scope and honest claims

This lab compares mathematical pitch-curve kinematics from the existing Spiral Gear Lab. It is a **deterministic simulation** and NOT a newly qualified frozen AH experiment, and does not certify actual toothed gears, energy, biology, physics, or a previously unmeasured physical residue.

The model compares two identical-focus elliptical gear pairs, parameterized by eccentricities e_ref and e_compare. For each input angle θ from 0 to 2π:

    β_e(θ) = -2 atan2(((1-e)/(1+e)) sin(θ/2), cos(θ/2))

The input motion is uniform. Both outputs rotate exactly -2π across one cycle. The instantaneous output ratios β'_e(θ) differ for distinct eccentricities. The center separation of each matching pair is constant because its pitch radii sum to 2a. No manufactured tooth profile is modeled.

## Observer Keyholes

- O0 ENDPOINT: see start/end input and driven angles only. Two different eccentricities are indistinguishable under O0.
- O1 PROBE: additionally see one intermediate driven phase at an operator-chosen input angle. **180° is a deliberately blind probe** for any of the compared ellipses; 90° generally distinguishes distinct eccentricities.
- O2 PHASE_TRACE: observe the full discretely sampled driven phase trajectory.
- O3 SPEED_TRACE: observe the sampled instantaneous output/input speed ratio.

A finite sampled difference is a witness; equality under a finite observation **does not establish full continuous-equivalence**. The phase trace can distinguish a path difference that O0 or a poor O1 probe misses.

## Closure, controls and memory

At the full cycle each model has zero ideal return error, and a circular e=0 against circular e=0 is the negative control (no phase or ratio difference). Same-eccentricity elliptical comparison also produces no witness.

**Crucial limitation:** equal endpoint state does not imply residual physical state. If we select "retain history", we are augmenting the *observer's state* with recorded past samples. The retained distinction exists in that explicitly added log, not as an unmeasured hidden energy or in the original gear state.

A JSON replay receipt records parameters, channel, sample traces, tolerances, negative control, simulated provenance, and no verified scientific claim. This neither modifies nor promotes any frozen NBG experiment or previous research ledger.

## Acceptance

    npm run test:phase-closure
    npm test
    npm run build

The deterministic model has no network or additional runtime dependency.
