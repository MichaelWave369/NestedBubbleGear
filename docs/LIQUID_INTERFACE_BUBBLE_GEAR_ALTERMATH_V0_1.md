# LIQUID-BGA-01 — Liquid Interface: Bubble/Gear/Altermath Choreography

**Version:** 0.1.0 (concept draft)  
**Date:** 2026-10-26  
**Research status:** PROPOSED / UNTESTED  
**Provenance:** Human movement insight and speculative engineering design; formalization is an inferred model, not experimental observation  
**Experiment authority:** NONE  
**Parent framework:** Nested Bubble/Gear (NBG)  
**Candidate applied laboratory:** PhiGrooveDrive (proposed, separate repository)  
**Frozen NBG protocol impact:** NONE

## Abstract

This note proposes a formal, testable control-system translation of **Liquid and Digits** dance: apparent non-contact motion between two hands, sequential digit articulations, variable gaps, and continuous whole-body waves. The central design is a distributed actuator network in which **bounded modules (“bubbles”)** carry internal state, **articulating submodules (“gears”)** impose timed local boundary motion, and a measured **interface** carries coupling, phase, force, and recoverable-energy information.

The name **Altermath** has a narrower existing NBG meaning than “magnetic space.” In NBG, it denotes causally relevant structure concealed by a coarse observer or cancellation. Accordingly, the physical gap between two actuators is *not automatically* Altermath. An Altermath-like hidden-state case is present only if apparently equivalent coarse measurements conceal internal states that produce distinguishable future outcomes under an admissible intervention.

This note does not claim new physical fields, reactionless propulsion, excess energy, or demonstrated performance. It sets up falsifiable comparisons of relative-gap choreography against independent actuator control in simulation, and subsequently in mechanically or fluid-coupled prototypes.

## 1. Embodied origin and terminology

The motivating observation is that an experienced Liquid dancer can initiate a motion with the fingers, preserve a near-contact gap between opposing hands, and propagate a visible chain of shape changes through fingers, wrists, arms, and the surrounding space. The human act is expressive motor control, not evidence that an invisible force acts between the hands.

| Dance-language construct | Model construct | Operational variable |
| --- | --- | --- |
| Hands | Bounded modules / “bubbles” | Pose, boundary geometry, internal energy, actuation state |
| Fingers | Timed articulators / “gears” | Joint angles, pulse timing, phase, stiffness |
| Near-contact gap | Coupling interface | Separation, relative velocity, field or contact-force estimate |
| Invisible ball | Virtual shared control geometry | Target volume/center/shape; not a physical object |
| Wave | Traveling phase relationship | Phase offsets, amplitude and propagation direction |
| Pop | Short actuation impulse | Finite bounded force/torque waveform |
| Lock | Timed hold or high impedance | Brake or stiffness command, with energy cost |
| Remote | Leader/follower control illusion | Delayed or coupled reference trajectory |
| Altermath | Hidden causal distinction under a Keyhole | Matched coarse observations, divergent intervention outcomes |

“Bubble” and “gear” are mechanical abstractions here. A sphere is not required, and a “gear” does not imply meshing teeth. Magnetic repulsion is an **optional implementation** of a coupling law, not a property of dancing hands.

## 2. State, interface, and control

Let a model contain N modules. The state of module i is

    z_i(t) = (x_i, R_i, q_i, qdot_i, I_i, E_i, phi_i),

where x_i and R_i denote pose, q_i denotes articulation, I_i denotes any coil currents, E_i denotes a measured or estimated energy state, and phi_i denotes a controller phase. Actuator controls are u_i(t).

For two idealized spherical module boundaries with centers x_i and x_j and radii r_i and r_j, a signed gap is

    d_ij(t) = ||x_j(t) - x_i(t)|| - r_i(t) - r_j(t).

For non-spherical modules, use the signed minimum surface separation rather than the spherical approximation. The interface state may include

    c_ij(t) = (d_ij, d_dot_ij, Delta_phi_ij, F_ij, P_ij).

Here d_dot_ij is separation velocity, Delta_phi_ij is phase difference, F_ij is interaction force, and P_ij is estimated instantaneous power flow. The symbols describe variables to observe or estimate, not measured phenomena already discovered.

A baseline traveling-wave command to submodule k at longitudinal position s_k is

    q_ref,k(t) = A_k sin(omega t - kappa s_k + phi_0).

The Liquid-inspired candidate extends this baseline with bounded pulses, holds, phase-synchronized counter-motion, target-gap control, and disturbance-responsive state transitions:

    u(t) = Controller(q, qdot, d, d_dot, Delta_phi, energy, target_shape).

Any controller must obey joint, current, force, voltage, speed, thermal, and separation constraints.

## 3. Mechanism and conservation firewall

For a candidate electromagnetic implementation, define a measured or calibrated **interaction potential** U(q, I) only under a stated quasi-static and current-controlled approximation. Conservative force components are then obtained from the appropriate generalized derivative of U with electrical drive conditions held fixed. A full powered electromagnet requires electromechanical state equations and an electrical power budget; merely drawing field lines is not such a model.

A schematic dynamics model is

    M(q) q_ddot + C(q,q_dot) q_dot + D(q_dot)
      = tau_drive + tau_coupling + J_ext(q)^T F_ext.

Internal coupling forces exchange momentum among parts. They do **not** produce net center-of-mass acceleration of an isolated system. In a vacuum without expelled reaction mass or external interaction, internal magnetic choreography cannot act as translational propulsion. For locomotion or thrust the apparatus must exchange momentum with water, air, a supporting surface, expelled mass, or a genuine external field/structure. Do not mislabel orientation changes as net translation.

With consistent sign conventions and over a measured finite interval, the energy accounting must close:

    E_external_input
      = W_useful_output + Delta_E_stored + E_irrecoverable_loss

where regenerative transfers between modules are *internal flows*, not new sources. Include bus, driver, coil, bearing, spring, thermal, and sensing losses as applicable. The energy ledger must never count the same regenerated joules both as input and as new output.

**Claim firewall:** “Altermath field” is an NBG modeling term in this proposal. It is *not* a newly observed electromagnetic field, a force law, antigravity, or free-energy mechanism.

## 4. Explicit NBG Altermath interpretation

Let z_a and z_b be distinct full states and let H be a selected, explicitly specified observer/Keyhole. The proposed test for hidden causal distinction is:

    H(z_a) = H(z_b),

but for at least one admissible intervention u and future horizon T,

    H(Phi_T(z_a, u)) != H(Phi_T(z_b, u)).

Phi_T is the state evolution under the same intervention and boundary conditions.

Example: two paired actuator arrangements both report zero **aggregate** lateral force, yet have different internal preloads, phase states, or stored elastic energy. After the same commanded release, their measured gap trajectories may differ. If the distinction survives controls, the initial coarse measurement was insufficient. If richer sensors reveal the difference, the interpretation becomes an ordinary observability result, not exotic physics.

Crucially, **zero summed internal force alone is not evidence** for any special phenomenon: Newton's third law already requires balanced internal forces. The research question is whether a *specified* Keyhole hides a behaviorally relevant state distinction.

NBG's canonical Altermath definitions and frozen AH experiments remain unchanged by this prospective application.

## 5. Falsifiable hypotheses

**H1 — Relational control.** In matched simulations with disturbances, gap-and-phase feedback will reduce gap tracking error or improve maneuvering relative to an open-loop wave command at the same commanded amplitude, frequency range, and actuation limits.

**H2 — Choreographic efficiency.** Under controlled mechanical/fluid loading, optimized Liquid-inspired timing may improve a predeclared thrust-per-net-electrical-energy or task-level efficiency objective versus a tuned sinusoidal and a tuned generic feedback baseline. The null is equal or worse performance.

**H3 — Recovery accounting.** Regenerative compliant actuation can reduce net bus energy versus an otherwise matched dissipative-drive configuration. It cannot raise total output work above measured supplied energy after accounting for stored energy and losses.

**H4 — NBG Keyhole distinction.** At least one intentionally constructed pair of coarse-equivalent states may yield different post-intervention trajectories. Null controls must eliminate the difference when the hidden states or couplings are matched.

No hypothesis is considered supported by an attractive animation, a nonphysical simulation, or an uncalibrated force sensor.

## 6. Proposed experiment ladder

### LIQ-E0 — Isolated-pair sanity simulator

Create two modules with optional symmetric magnets or a conservative spring surrogate and articulate both over bounded choreography sequences. Measure both module trajectories, relative gap, internal forces, total momentum, total energy, and external work.

Required gates:
- Equal-and-opposite internal forces within numerical tolerance.
- No net center-of-mass acceleration without external forces.
- Stable integration convergence when time step is reduced.
- Matched coarse-observation / different-hidden-state Keyhole pairs and a richer-observer control.
- No positive net-work or energy-creation artifact.

**Output:** deterministic simulated traces, numerical errors and a provenance receipt, never a thrust claim.

### LIQ-E1 — Six-segment fluid-coupled control comparison

Model an externally loaded six-segment fin. Begin with a documented reduced-order fluid model, then qualify with CFD or a physical water test before asserting measured thrust.

Controllers:
- C0: independent periodic segment actuation.
- C1: tuned phase-shifted traveling sinusoid.
- C2: closed-loop gap/phase control.
- C3: Liquid-derived pulse/lock/wave controller.

Hold geometry, loading, input voltage, actuation limits, frequency range, and optimization budget constant. Log the effect of each controller on task performance and power. Negative controls include zero medium coupling, disabled feedback, shuffled phase order, and zero-amplitude forcing.

Primary metrics: time-averaged forward thrust or measured travel velocity, net electrical energy per distance or per delivered impulse, tracking error, peak currents/forces, and thermal losses. Report confidence intervals for repeated trials; use predeclared task success criteria.

**Output:** comparison only, not proof of novelty or an unmeasured physical effect.

### LIQ-E2 — Bench interface with regenerative actuators

If LIQ-E0/E1 pass their gates, build an electrically protected, low-energy two-module bench rig with force/gap/current/voltage measurement, current limiting, thermal protection, mechanical guards and a stop circuit. Record actual recovered energy at the bus, not merely reversed motor motion. A later water-tank fin test must use independent thrust instrumentation and control runs.

**Output:** measured physical evidence with calibration references and uncertainty, separately from simulation.

## 7. Reproducibility and evidence labels

Every run should preserve:
- Protocol revision, commit SHA, controller ID, numerical method and dependency versions.
- Seed, initial states, boundary conditions, time step, model constants, limits and stopping conditions.
- Explicit observable/Keyhole definition and alternative model controls.
- Raw samples, derived metrics, tolerance checks, and failure reason if any.
- Provenance enum **OBSERVED / VERIFIED / INFERRED / DREAMED / SIMULATED / UNKNOWN**.
- **Authority NONE** for proposal/simulation unless an independent review and physical evidence support a different scoped claim.

Do not relabel synthetic datasets as observations. A failed conservation gate invalidates the physical interpretation even if a controller appears to outperform the baseline.

## 8. Repository boundaries and implementation contracts

**NestedBubbleGear:** Holds this formal proposal, NBG observability/Altermath crosswalk, experiment hypotheses and provenance rules. Do not mutate frozen protocols.

**Proposed PhiGrooveDrive repository:** Owns simulation engines, controller implementations, numerical and energy tests, visualization, and hardware adapters. Initial simulator should run in a browser with an offline-capable reference test runner. Use a clean, versioned JSON trace/receipt format.

**PhiBox:** Optional tempo/event/beat source. BPM is a user-interface and timing parameter, not a physical energy source.

**PhiMathAtelier:** Optional field and phase visualizer. Its art shaders must not be treated as physical validation.

**PhiOS:** Future governed runtime integration. No autonomous hardware actuation without explicit authority, bounded commands, physical fail-safes, and verified telemetry.

## 9. Decision and next milestone

Create an independent **PhiGrooveDrive** lab *when implementing LIQ-E0*. Keep this note discoverable in NBG now and link to the eventual engineering repository. The immediate next deliverable is an executable E0 model with a numerical conservation test and paired Keyhole demonstration; an animated UI is secondary.

**Promotion rule:** A beautiful visualization cannot promote a concept to experimentally supported physics. Only passed prespecified controls and independently auditable evidence can do that.

## 10. Background literature and physics foundations

The following demonstrate established neighboring phenomena, *not* validation of this proposed architecture:

1. **Ribbon-fin hydrodynamics during impulsive motion** (2008), numerical and particle-image analysis of thrust-generating traveling waves. https://pubmed.ncbi.nlm.nih.gov/18931321/
2. **Propulsive performance of an under-actuated robotic ribbon fin** (Liu & Curet, 2017), measured tradeoffs among thrust, power and passive fin coupling. https://pubmed.ncbi.nlm.nih.gov/28481218/ ; DOI 10.1088/1748-3190/aa7184
3. **Swimming performance of a bio-inspired robotic vessel with undulating fin propulsion** (2018), tested forward/reverse swimming and maneuvering. https://pubmed.ncbi.nlm.nih.gov/29911657/
4. **NASA Glenn, Conservation of Momentum**, conservation foundation and external momentum exchange. https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/conservation-of-momentum-2/
5. **NASA, Basics of Space Flight, Chapter 3**, rocket reaction-mass basis. https://science.nasa.gov/learn/basics-of-space-flight/chapter3-2/

---

**Proposed attribution:** Concept inspiration: Michael “Mikey” Hughes (Liquid dance movement-to-system analogy); formal computational translation: collaborative research draft. This attribution does not claim invention of existing wave propulsion or electromagnetic actuator principles.
