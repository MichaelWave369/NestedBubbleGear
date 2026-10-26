# EG-03 · Maxwell–London Conventional Baseline (E0)

**Status:** SIMULATED · **provenance:** SIMULATED · **authority:** NONE. **No physical experiment, superconductor measurement, or anomalous-gravity result.**

This rung independently implements a finite-difference boundary-value solver and a closed-form analytic reference for the *conventional* second London equation, using Ampère's law in an ideal static, isotropic, infinite planar slab. It builds on the synthetic EG-01 and EG-02 identifiability studies but does **not** change their frozen assumptions or claim authority.

## Primary pedagogy and peer-reviewed mathematical anchors

- [NPTEL/IIT, Solution of London Equations: Flat slab in a magnetic field](https://archive.nptel.ac.in/content/storage2/courses/115101012/modules/Module-3/lec2/1.2.html): explicitly specifies the two surface boundary conditions and analytic \`cosh\` solution.
- [Walther-Meißner-Institut, Chapter 3 (2023), superconductivity lecture notes](https://www.wmi.badw.de/fileadmin/WMI/Lecturenotes/SC_and_LT_Physics_1/SC_LT-Physics-Chapter3-2023.pdf): finite parallel-field slab and penetration depth.
- [Prozorov et al., Phys. Rev. B 62, 115 (2000)](https://doi.org/10.1103/PhysRevB.62.115): literature discussing actual finite-geometry London solutions and their experimental applications. The simple EG-03 slab is **not** a numerical reproduction of that finite-geometry paper.
- Historical context from [Li & Torr, Phys. Rev. B 46, 5489 (1992)](https://doi.org/10.1103/PhysRevB.46.5489) and [Kowitt, Phys. Rev. B 49, 704 (1994)](https://doi.org/10.1103/PhysRevB.49.704). **Their gravitational claims/critique are NOT implemented here**; the Maxwell–London model is a prerequisite for a later independent derivation audit.

## Equations and boundary conditions (SI)

Under a stationary Meissner state with no free currents other than supercurrent,
\`∇×B=μ₀J\`, \`∇×J=−B/(μ₀λ_L²)\` and \`∇·B=0\`, so

\`∇²B=B/λ_L²\`, with \`λ_L=sqrt(m/(μ₀n_s q²))\`.

For an infinite planar slab with its two faces at \`x=±d/2\`, a tangential uniform applied field \`B_y(±d/2)=B_s\`, and spatially uniform \`λ_L\`:

\`B_y(x)=B_s cosh(x/λ_L)/cosh(d/(2λ_L))\`.

The surface value is \`B_s\`; center fraction is \`sech(d/(2λ_L))\`; average fraction is \`(2λ_L/d)tanh(d/(2λ_L))\`. Via Ampère's law, \`J_z(x)=(1/μ₀)dB_y/dx\`, with opposite signs on the two surfaces. Signed integrated current across both faces cancels, although nonzero local screening currents remain. No gravitational term appears.

This assumes **parallel field**; the ideal geometry omits perpendicular-field demagnetization, flux vortices/type-II mixed state, finite edges, temperature, nonlinear penetration, critical-current limits, displacement current, and time-dependence. The sliders do not establish the existence of Meissner screening at arbitrary field strength or temperature. The unscreened control \`B(x)=B_s\` is a mathematical contrast, not a sample-specific normal-metal simulation.

## Independent numerical implementation

Uniform odd-numbered grid \`N\` on \`[-d/2,+d/2]\`; centered finite difference for \`B''=B/λ²\`:

\`-B_(i−1)+(2+(Δx/λ)²) B_i−B_(i+1)=0\`.

The two endpoints are held at \`B_s\`. A Thomas tridiagonal elimination implementation solves the interior without calling the \`cosh\` analytic expression. Only **after** obtaining the solution does the code compare its profile to the analytic reference. Diagnostic residual is the dimensionful algebraic residual of the finite-difference recurrence; accuracy is the absolute analytic mismatch in microtesla.

This is genuinely separate *numerical and closed-form mathematics* but **not** an independent scientific replication across researchers, laboratories, or languages. Convergence should be quadratic in \`Δx\` when the slab and \`λ\` are fixed. A discrete pointwise error is not a measured instrument uncertainty.

## Controls / gates

- Default \`λ=80 nm\`, \`d=400 nm\`, \`B_s=10 mT\`, \`N=101\`. Slab center fraction \`sech(2.5)≈0.163\`, while the unscreened contrast is constant \`B=B_s\`.
- Change thickness, penetration length and field; compare numerical and analytic curves plus unscreened reference.
- Negative control: \`B_s=0\`. Scale control: double \`B_s\` doubles field/current, not the normalized screening fraction.
- Even boundary and left/right symmetry; signed surface currents; tested \`λ\`- and \`d\`-monotonicity.
- **Refinement convergence:** compare \`N=41,81,161\` at identical continuous parameters; finite-difference error must decrease approximately ×4 when halving the mesh size.
- Explicit JSON export marks all data SIMULATED / authority NONE.
- \`npm run test:eg03\` / \`npm run test:research-atlas\` / \`npm run build\`; CI remains a software proof only.
- EG-01/EG-02 continue to be independently searchable and available in the Atlas.

## Next gated work: EG-04, critical historical derivation comparison

Obtain and cite the exact full derivations, numerical constitutive assumptions and dimensions in Li–Torr 1991/1992 and Kowitt 1994. Compare their common conventional Maxwell–London terms to this baseline, identifying where additional gravitational assumptions enter. Do **not** infer a gravitational correction from screening alone. Peer-reviewed full-text and independent derivation verification are prerequisites to claiming an exact reproduction. All observed effects remain unverified until independently measured under adequate controls.

**Ledger above ego.**
