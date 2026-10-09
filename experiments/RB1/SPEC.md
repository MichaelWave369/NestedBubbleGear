# NBG-RB1 v0.1.0 — Frozen Protocol Candidate

## Status

**Protocol only. No scientific result is authorized by this file.**

RB1 is the first rung of NBG-RB.

Its purpose is to test whether **frequency alone** provides reproducible held-out closure for reported biological EMF responses, and whether a frozen multiparameter description performs better.

## Unit of analysis

One row represents one reported experimental condition / arm from an eligible source.

Minimum row fields:

- source_id
- study_year
- system_class
- species
- sample_class
- endpoint_class
- frequency_hz
- field_type
- amplitude_value
- amplitude_unit
- waveform
- duty_cycle
- exposure_duration_s
- repeated_exposure_count
- geometry_or_orientation
- reported_direction
- reported_significance
- mechanism_claim_class
- provenance_origin
- source_locator

Unknown values must be encoded as null / unknown, never inferred from neighboring studies.

## Endpoint classes

RB1 does not collapse all biology into one "regeneration" label.

Allowed initial endpoint families:

- PROLIFERATION
- SURVIVAL
- SELF_RENEWAL
- MIGRATION
- DIFFERENTIATION
- NEURITE_OUTGROWTH
- ION_CHANNEL_ACTIVITY
- CALCIUM_SIGNAL
- GENE_EXPRESSION
- PATTERNING
- TISSUE_ARCHITECTURE
- FUNCTIONAL_RECOVERY
- OTHER_DECLARED

Each row must retain its original endpoint family.

## Bubble map

Initial frozen biological map:

- B0_FIELD
- B1_MEMBRANE_CHANNEL
- B2_INTRACELLULAR_SIGNAL
- B3_TRANSCRIPTION_CELL_STATE
- B4_CELL_BEHAVIOR_PATTERN
- B5_TISSUE_FUNCTION

A source may touch multiple bubbles. That mapping must be explicit and source-attributed.

## Model arms

### A — FREQ_ONLY

Input is frequency_hz only.

No study identifier, source title, author, DOI, outcome label, endpoint result, or manually coded "interesting frequency" flag may enter the model.

### B — MULTIPARAMETER

Inputs are limited to preregistered physical/context variables: frequency, amplitude or flux density, field type, waveform, duty cycle, exposure duration, repeated exposure count, geometry or orientation if reported, system class, species, sample class, and endpoint class.

No post-result feature may be added inside the same frozen execution.

### C — SHUFFLED_BOUNDARY

Same feature capacity as MULTIPARAMETER, but biological bubble labels are permuted under a frozen seed schedule while preserving row counts.

This tests whether the chosen bubble partition contributes anything beyond bookkeeping.

### D — LABEL_PERMUTATION

Outcome labels are permuted under frozen seeds.

This is a leakage / accidental memorization negative control.

### E — SYNTHETIC_WINDOW_POSITIVE

Synthetic data are generated from a known response surface containing a preregistered frequency x amplitude window and state modifier.

The pipeline must recover the planted structure within frozen tolerance.

Failure voids the interpretability of a negative real-data result.

## Holdout rule

Splits must be performed by **source lineage**, not random row split.

Rows from the same paper / experimental lineage may not appear in both train and held-out partitions.

Where source count permits, the preferred hierarchy is train, validation, and held-out source test.

If the corpus is too small for this structure, RB1 remains protocol-only until enough eligible sources exist.

## Primary metrics

Metrics must be fixed before execution and reported for every arm.

At minimum:

- held-out balanced accuracy or macro-F1 for declared response classes;
- calibration metric where probabilistic outputs exist;
- per-endpoint-family performance;
- source-lineage leakage audit;
- missingness profile;
- model-capacity report.

A single pooled accuracy is not sufficient.

## Closure interpretation

RB1 uses "closure" operationally.

A model earns a closure advantage only if its coarse state retains enough information to predict preregistered held-out response classes better than the specified simpler baseline under the same source split.

RB1 does not claim thermodynamic, quantum, clinical, or ontological closure.

## Result precedence

Structural failures take precedence over scientific interpretation.

### VOID states

1. VOID_RB1_SOURCE_LEAK
2. VOID_RB1_CONTROL_FAILURE
3. VOID_RB1_PROTOCOL_DRIFT
4. VOID_RB1_INSUFFICIENT_LINEAGE_HOLDOUT

### Scientific states

1. FAIL_RB1_NO_REPRODUCIBLE_STRUCTURE
2. FAIL_RB1_MULTIPARAMETER_NO_ADVANTAGE
3. FAIL_RB1_BOUNDARY_NO_ADVANTAGE
4. QUALIFIED_RB1_MULTIPARAMETER_RESPONSE
5. QUALIFIED_RB1_NESTED_RESPONSE_STRUCTURE

QUALIFIED_RB1_NESTED_RESPONSE_STRUCTURE additionally requires the biologically motivated partition to beat the shuffled-boundary control under the frozen criterion.

## Frequency-only interpretation rule

A frequency peak, correlation, or coefficient is not a "healing frequency."

Even if FREQ_ONLY performs well, authorized language is limited to the exact endpoint/source domain tested.

No frequency receives privileged status because it appears in a viral claim, natural resonance, or prior narrative.

## DNA direct-coupling firewall

Mechanism labels may include DIRECT_DNA_ASSERTED, MEMBRANE_CHANNEL_MEDIATED, INTRACELLULAR_SIGNAL_MEDIATED, UNRESOLVED, and OTHER_DECLARED.

Downstream gene-expression change cannot by itself upgrade a row to DIRECT_DNA_ASSERTED.

The Blank/Goodman fractal-antenna paper and Foster criticism remain separate evidence objects.

## Provenance

Every imported row must retain source ID, DOI / PMID / stable locator where available, source type, whether the value was directly reported or derived, extraction version, reviewer identity or process, and hash / receipt when implemented.

Epistemic origins follow the repository-wide vocabulary:

OBSERVED · VERIFIED · INFERRED · DREAMED · SIMULATED · UNKNOWN

For literature rows, bibliographic existence may be VERIFIED while empirical results remain OBSERVED **in the cited source**, not independently replicated by NBG.

## Safety boundary

RB1 is computational / literature-facing.

Forbidden outputs include human treatment instructions, exposure prescriptions, MedBed claims, complete-human-regeneration claims, cure claims, and unsupervised wet-lab instructions.

## No-rerun rule

Once an implementation PR, source freeze, and execution freeze are merged, the first valid frozen execution is result-bearing.

A disappointing result is not a reason to alter thresholds, splits, candidate frequencies, feature families, or controls inside RB1.

Any scientific change becomes a new rung/version.
