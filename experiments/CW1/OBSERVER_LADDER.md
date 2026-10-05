# NBG-CW1 Observer Ladder

The observer ladder is ordered by progressively richer access to cosmic-web state. Exact features remain dataset-dependent, but each level has a fixed semantic boundary.

## (O_0) — Environment / object summary

Permitted information may include:

- halo or galaxy positions;
- pair separation;
- halo/stellar mass proxies when available;
- local overdensity;
- redshift/snapshot;
- simple scalar environment summaries.

Not permitted:

- explicit filament skeleton;
- Ly-alpha morphology;
- interface profiles;
- velocity-resolved filament state;
- latent simulation fields.

## (O_1) — Connectivity / skeleton

Adds:

- filament existence/connectivity;
- spine or skeleton geometry;
- graph degree and path-length summaries;
- coarse filament orientation.

Purpose: test whether topology alone closes the future.

## (O_2) — Emission morphology

Adds observationally motivated Ly-alpha morphology such as:

- surface-brightness profile summaries;
- filament width/extent;
- asymmetry;
- connected emitting area;
- projected substructure descriptors.

This remains an observational projection, not the full gas state.

## (O_{IF}) — Interface-aware observer

Adds explicit boundary/interface information, for example:

- CGM-to-IGM transition radius;
- transverse profile around the filament spine;
- gradients at the interface;
- boundary-conditioned density/emission summaries;
- transport-oriented descriptors that are defined without future information.

This is the first observer explicitly testing the NBG Gear/interface hypothesis.

## (O_K) — Kinematic / spectral observer

Adds admissible velocity- or spectrum-resolved information, such as:

- line centroid/width summaries;
- velocity gradients;
- multiple spectral components;
- kinematic coherence along/across a filament.

Exact use depends on the source data and radiative-transfer caveats.

## (R^star) — Latent reference state

Simulation-only reference state. It may include:

- dark-matter density/potential;
- gas density;
- temperature;
- ionization state;
- velocity field;
- clumping/sub-resolution variables where defined;
- lineage identifiers.

(R^star) is not an observational Keyhole and must not be used as though directly observed.

## Refinement rule

If (O_i) has present-equivalent pairs that diverge in the future, refine only along the predeclared ladder.

A richer observer is useful when it explains/reduces future divergence on held-out lineages.

The target is **minimal sufficient state**, not maximal feature accumulation.

## Interpretation rule

The physical mapping is intentionally conservative:

- halo/CGM domain -> candidate Bubble;
- filament-mediated coupling -> substrate for a candidate Gear description;
- measurable projection -> Keyhole;
- discarded but future-relevant state -> Altermath/hidden causal residue.

This mapping is a modeling hypothesis to test, not a conclusion.
