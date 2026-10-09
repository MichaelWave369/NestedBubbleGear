# NBG-RB3-E0 v0.1.0 — Execution Freeze

## Status

**Executable semantics freeze only. No RB3 literature-model result is authorized by this file.**

RB3-E0 resolves the implementation choices left open by RB1/RB2 before any model sees a completed real extraction table.

## Inherited frozen inputs

RB3-E0 may not change:

- RB2's 14-source primary corpus;
- 11 source lineages;
- five lineage folds;
- endpoint vocabulary;
- context-only registry;
- candidate-frequency policy;
- anti-leakage rules.

The RB2 manifest digest must remain:

`2a91f27c113fb4ae3b63ec8bfad2b2c1c99e84417bd5f3e095c803b9e4c4e351`

The executable independently recomputes that digest from the ordered record digests.

## Real-row gate

One row is one source-backed experimental condition × endpoint observation.

A real RB3 execution is forbidden until the extraction table is separately frozen and every modeled value has row-level provenance.

Unknown values remain null at extraction time. No value may be copied from a related paper, inferred from laboratory convention, or invented to make a row numerically complete.

Rows with `reported_direction` outside:

- INCREASE
- DECREASE
- NULL

are not valid RB3 classification rows.

## Frozen outer evaluation

RB2's hash-derived five folds are exact.

For outer fold `k`:

- test = fold `k`;
- validation = fold `(k + 1) mod 5`;
- train = the remaining three folds.

Transform fitting, category vocabularies, numeric medians and scaling statistics are learned from training rows only.

The validation split is reserved for later threshold/model-selection work and is not merged into training in RB3 v0.1.0.

## Preprocessing

### Missing numeric data

For each numeric feature:

1. compute the training-fold median from nonmissing training values;
2. replace missing numeric values with that training median;
3. append a binary missingness indicator;
4. standardize using the training-fold mean and population standard deviation after imputation.

A field with zero training variance uses scale 1.

This is a model-time transformation. It does not rewrite RB2 extraction provenance.

### Categoricals

Training-fold values are sorted lexicographically and one-hot encoded.

Each field gets an `__UNK__` bucket for nonmissing values unseen in training.

Missing categorical values emit all-zero values for that field. They are not silently converted into `__UNK__`.

## Frozen model family

All learned arms use deterministic multinomial softmax regression implemented in Python standard-library arithmetic.

- classes: DECREASE, NULL, INCREASE
- optimizer: full-batch gradient descent
- steps: 1000
- learning rate: 0.05
- L2 coefficient: 0.01
- intercept is not L2-penalized
- initialization: all zeros
- no shuffle
- no early stopping
- no class weighting
- no hyperparameter search
- no GPU
- no external ML dependency

## Arm features

### FREQ_ONLY

Only:

`frequency_hz`

plus its missingness indicator.

### MULTIPARAMETER

Numeric:

- frequency_hz
- amplitude_value_si
- exposure_duration_s
- repeated_exposure_count

Categorical:

- field_type
- waveform
- geometry_or_orientation
- system_class
- species
- sample_class
- endpoint_class
- bubble_from
- bubble_to

### SHUFFLED_BOUNDARY

Same capacity and preprocessing as MULTIPARAMETER.

Only `bubble_from` / `bubble_to` pairs are deterministically permuted. Targets and every non-boundary feature remain unchanged.

### LABEL_PERMUTATION

Same features as MULTIPARAMETER.

Training labels alone are deterministically permuted. Held-out labels are untouched.

### SYNTHETIC_WINDOW_POSITIVE

A deterministic synthetic fixture contains a planted multiparameter response surface.

It is a pipeline control, not biological evidence.

It must satisfy all of:

- multiparameter balanced accuracy >= 0.75;
- multiparameter macro-F1 >= 0.70;
- multiparameter balanced-accuracy advantage over frequency-only >= 0.25.

Failure yields:

`VOID_RB3_CONTROL_FAILURE`

and prevents interpretation of a real-data negative result.

## Forbidden predictor fields

The model may never receive:

- row/source/lineage identifiers;
- title, author, journal, DOI, PMID;
- publication year;
- reported direction/significance;
- effect size;
- mechanism claim;
- source locator;
- extraction notes;
- record digests.

These may exist in provenance/audit records but not predictor vectors.

## Metrics

Every real-data arm reports outer-fold:

- balanced accuracy;
- macro-F1;
- multiclass Brier score;
- train/validation/test row counts.

All five folds remain in the result artifact.

Primary comparisons use mean outer-fold macro-F1.

## Scientific classification

Structural states take precedence:

1. VOID_RB3_SOURCE_LEAK
2. VOID_RB3_CONTROL_FAILURE
3. VOID_RB3_PROTOCOL_DRIFT
4. VOID_RB3_INSUFFICIENT_LINEAGE_HOLDOUT

Assuming no VOID:

1. FAIL_RB3_NO_REPRODUCIBLE_STRUCTURE
2. FAIL_RB3_MULTIPARAMETER_NO_ADVANTAGE
3. FAIL_RB3_BOUNDARY_NO_ADVANTAGE
4. QUALIFIED_RB3_MULTIPARAMETER_RESPONSE
5. QUALIFIED_RB3_NESTED_RESPONSE_STRUCTURE

MULTIPARAMETER must exceed FREQ_ONLY mean macro-F1 by at least 0.05 to earn a multiparameter advantage.

It must exceed SHUFFLED_BOUNDARY mean macro-F1 by at least 0.03 for a nested-boundary advantage.

The stronger nested-response class additionally requires MULTIPARAMETER to beat SHUFFLED_BOUNDARY on macro-F1 in at least 3 of 5 outer folds.

These are preregistered finite-corpus criteria, not universal biological thresholds.

## Claim firewall

Even a qualified RB3 result would support only a computational statement about the frozen literature table.

It would not establish:

- a healing frequency;
- resonance as the biological mechanism;
- complete regeneration;
- human clinical efficacy;
- direct DNA antenna coupling;
- safety of an exposure;
- a treatment device or dose.

## PR execution boundary

RB3-E0 pull-request CI may run static checks, unit tests and the synthetic positive control.

It may not execute the real literature classification.

A later extraction-freeze/implementation PR must pin the real rows and their hash before a manual main-only execution workflow is added.

The first valid frozen real execution is result-bearing. Unpleasant results are retained rather than tuned away.
