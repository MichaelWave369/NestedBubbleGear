# EG-02 · Independent Model Audit / Differential Force Controls (E0)

**State:** SIMULATED · **provenance:** SIMULATED · **authority:** NONE · **claim level:** Methodology and synthetic fixture math, **not** a demonstrated gravitational anomaly, reproduction of published Li–Torr equations, or a measurement.

EG-01 showed one force trace cannot distinguish two contributions with identical drive signatures. EG-02 improves the measurement model with **SI units, a conventional magnetic force explanation, a mass contrast and a reversed magnetic-gradient contrast**. It also builds a historical source-to-claim audit around the material Amy Eskridge surveyed.

## Evidence map (published claims and limits)

| Work | What the publication concerns | What EG-02 is allowed to claim |
| --- | --- | --- |
| [Li & Torr, Phys. Rev. D 43, 457 (1991)](https://doi.org/10.1103/PhysRevD.43.457) | A theoretical model coupling external magnetic and gravitomagnetic fields inside a pure superconductor. | A published candidate calculation exists. We have **not** reproduced its derivation or demonstrated an effect. |
| [Li & Torr, Phys. Rev. B 46, 5489 (1992)](https://doi.org/10.1103/PhysRevB.46.5489) | A model of gravitational corrections to superconducting magnetic attenuation and its permeability/conductivity interpretation. | A disputed theoretical hypothesis; its quantitative assumptions need independent derivation. |
| [Kowitt, Phys. Rev. B 49, 704 (1994)](https://doi.org/10.1103/PhysRevB.49.704) | Criticism that Li–Torr drastically overestimated gravitomagnetic effects by misinterpreting the meaning of macroscopic Meissner-state magnetic permeability. | A direct theoretical challenge to the 1992 interpretation; **not** an experimental disproof of every imaginable coupling. |
| [Hathaway, Cleveland & Bao, Physica C 385, 488–500 (2003)](https://doi.org/10.1016/S0921-4534(02)02284-0) | Attempt to replicate Podkletnov's **different** spinning-superconductor weight-modification claim; found no force to its sensitivity limit (~0.001% weight change under tested conditions). | A negative test of **Podkletnov's experimental claim under specific conditions**, **not** a direct replication of Li–Torr's mathematical papers. |
| [Eskridge, HAL5 presentation (Dec. 2018)](https://www.hal5.org/PDF/HAL5-Dec2018-Talk-AntiGravity.pdf) | Historical survey of unconventional aerospace and gravity-modification directions. | Research context, not a primary experimental measurement or proof of technology. |

**Source access boundary:** The audit is limited to publication abstracts and accessible experiment summary/material; a line-by-line derivation review and numeric Li–Torr/Kowitt replication remain **PROPOSED**. Do not convert the existence of a DOI into experimental verification.

## Model A: conventional force on a fixed magnetic dipole

For an idealized, fixed, aligned magnetic dipole moment \`m_z\` in a spatially varying field, the **one-dimensional approximation** is

\`F_B ≈ m_z (dB_z/dz)\`.

Units: \`A·m² × (T/m) = N\`. This is a conventional magnetic force and *not* a gravity modification. It is **not** a universal formula for a superconductor (nonlinear response, demagnetization, vortex states and geometry are omitted).

A scale reading, after subtracting nominal static weight, is modeled as

\`ΔF = f × M × g + m_z × gradB + b + ε\`

with \`M\` in kg, \`g=9.80665 m/s²\`, **f** an *injected hypothetical fractional weight-change coefficient*, \`m_z\` in A·m², \`gradB\` in T/m, \`b\` in N representing instrument offset, and \`ε\` deterministic perturbation in N.

For a 100 g sample, \`m_z=0.02 A·m²\`, and \`gradB=0.5 T/m\`, the ordinary magnetic force is \`0.01 N\`, equivalent to **about 1.02%** of nominal sample weight. This demonstrates a *plausible scale comparison in an assumed fixture*, not a measured magnetic moment or a realistic material-specific prediction.

## Model B: declared synthetic mass-scaled response

The coefficient \`f\` multiplies \`M g\`, chosen purely to contrast a mass-scaled signature with a **constant** magnetic pickup moment. The default is \`f=0\`. Nonzero f is **injected by the operator in software** and is not inferred from nature.

At only one mass, the mass-scaled term is indistinguishable from a constant offset \`b\`. With only one gradient, the magnetic moment contribution is indistinguishable from \`b\`. A full 2×2 experiment with two masses and ± gradient, plus repeats, makes the model matrix \`[Mg, gradB, 1]\` rank 3 and lets ordinary least squares recover synthetic coefficients (within this toy).

Physical warnings:
- Magnetic moment *may vary with the specimen mass/material*, invalidating the constant-moment assumption.
- Changing the gradient may also change heating, vibration, fields and calibration offset; a physical gradient reversal does not necessarily isolate only one force.
- A true gravitational test would require independent gravimetry or inertial measurements, established errors, sample controls and replication.
- The model has **no mechanism linking superconducting permeability to gravity**. It cannot validate Li–Torr, Kowitt, Podkletnov or general relativity.

## Protocol and controls

- Pure calculations: \`src/eg02Model.js\` with no dependencies.
- React workbench: \`src/EG02Lab.jsx\` and \`src/eg02Lab.css\` inside the Atlas.
- Deterministic synthetic 2×2 rows with three replicates each; default f=0; gradient inversion and mass contrasts are independently switchable.
- Controls enforce an explicit **NOT IDENTIFIABLE** state if either axis is removed.
- \`scripts/test_eg02.mjs\` covers SI units, nulls, positive synthetic injection, identifiability rejection, inversion, controlled full-rank recovery, input validation and replay.
- Local JSON export is operator-triggered; \`authority: NONE\` and \`provenance: SIMULATED\`.
- Read \`experiments/EG01/PROTOCOL.md\` for the earlier one-observer Keyhole fixture.

## Advancement criteria toward E1

1. Obtain lawful access to full primary theory papers and independently audit each algebraic step, units, constitutive assumptions and limiting cases.
2. Recreate baseline Maxwell–London and weak-field GR calculations in a separately reviewed, unit-tested mathematical package.
3. Implement Li–Torr and Kowitt alternatives only when the precise equations are transcribed from the full papers with independent review and attributable source locations.
4. Construct realistic electromagnetic pickup, temperature, vibration, edge-field, shielding, magnetic susceptibility and instrument-error models with explicit parameters.
5. Establish real-data quality gates, blinded controls, sensitivity floors, negative evidence and independent replication **before** any claim of anomalous gravity.

**Ledger above ego:** passing CI proves these synthetic assumptions are internally consistent and the UI builds. It does not establish physical truth.
