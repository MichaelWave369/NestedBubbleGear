# RB3 Real-Row Freeze Gate

RB3-E0 intentionally does **not** contain a completed real literature extraction table.

Before real execution, a successor PR must add a canonical condition-by-endpoint table satisfying `experiments/RB2/extraction_schema.json`.

That PR must:

1. extract only values supported by the frozen RB2 sources;
2. preserve nulls rather than guess missing values;
3. include row-level source locators / notes for audit;
4. document any unit conversion as DERIVED_UNIT_CONVERSION;
5. map every row to exactly one RB2 source ID and lineage ID;
6. preserve the RB2 fold assignment;
7. hash the canonical table;
8. run schema/leakage checks but **not** fit the real predictive models;
9. freeze the table before the first real RB3 execution.

Synthetic rows, review summaries, planarian context papers and the DNA-antenna debate may never be substituted for missing real rows.

A sparse or inconvenient table is an empirical limitation, not permission to manufacture data.

## RB3-R0 partial extraction

`R0/candidate_rows.csv` holds nine figure-level source-backed examples for validation only. They are not a complete RB2 extraction, must not be fed to `--execute`, and cover only lineage L001. `R0/row_evidence.json` preserves original means and p-values. `R0/extraction_queue.json` tracks all 14 sources without invented rows. `R0/validate_candidate.py` checks each datum and its source lineage.

The RB3 runner now requires a separate `REAL_ROWS_FREEZE.json` with `status=REVIEWED_FROZEN`, `execution_authorized=true`, and the SHA-256 of a committed `FROZEN_ROWS.csv`, plus full RB2 source/lineage coverage. Neither file is supplied by R0. Execution is therefore refused.

This closes an E0 guard weakness without changing the frozen model family, feature set, optimizer, metrics or folds. The nine-source-data rows remain observations attributed to the cited mouse-cell paper, not NBG experimental reproduction. `NULL` represents a non-significant measured difference in the original paper, not biological equivalence or a zero effect.

## RB3-R1 primary-source expansion

`R1/additional_rows.csv` adds 18 condition × assay candidate observations from RB2-S002 and RB2-S003 without changing RB2 eligibility, lineages, five folds or any RB3 model semantics. Their assay/statistical support and explicit unextracted numerical values are in `R1/source_evidence.json`.

The combined **27 rows / 3 source papers / 2 lineages** remain too incomplete for real fitting. Both added papers belong to L002, not two independent holdout lineages. The `R1/validate_candidate.py` contract checks lineage, exact exposure metadata, figure/table references, unknown fields, SI units, unresolved numeric effects and tamper refusals.

This line also reports feature-vector collisions where different assays yield different labels for the same coarse predictors. Such collisions are a limitation/latent-variable clue, not permission to add assay IDs or tune model features after the freeze.

## RB3-R2 cross-lineage extraction

`R2/additional_rows.csv` adds 29 literature-attributed candidate rows from RB2-S006 (L004), RB2-S010 (L007) and RB2-S011 (L008). The source-level evidence files preserve study-specific exposure combinations, assay distinctions, per-arm unextracted numerical fields, and explicit source limitations.

The total R0+R1+R2 candidate pool contains **56 rows / 6 RB2 source papers / 5 of 11 lineages**. These are not frozen as fit-ready `FROZEN_ROWS.csv`. The R2 validator enforces original source identity, exposure-intensity combinations, field-unit normalization, correct source-attributed reported direction/significance, missingness, waveform-harmonic caveats, the original R0/R1 row counts, and no real-fit authorization.

Special caution: S010's nominal frequency has measured higher harmonics, and S006 uses an MTT metabolic proxy. Model features must not be secretly altered or replaced with full-spectral measurements that do not exist. Source-reported NULL / no appreciable effect is not formal equivalence.

The final full-corpus freeze and independent extraction review remain required before any real fitting.

## RB3-R3 provisional-source triage

R3 adds 8 conditional literature **candidates**, not fit-ready rows, from S004/L003, S012/L009 and S014/L011, bringing the unreviewed aggregate to 64 candidate rows in 9 source records / 8 distinct lineages.

The S012 source reports a pooled null across 10 microtesla and 1 mT conditions without a per-arm statistical table; the S014 source reports an aggregate approximately 30% proliferation response at 1 mT/72 h while separately reporting DNA damage. Such claims require **independent fulltext per-arm confirmation** before model promotion, and candidate metadata explicitly tags each row as `eligible_for_model_freeze: false`.

R3 also introduces `source_triage.json` for unresolved S005, S007, S008, S009 and S013. In particular, **L005/L006/L010 remain without admissible candidate data** because the available abstracts do not justify assigning pooled conclusions to exact intervention windows.

The R3 static audit checks source DOI/PMID/lineage, schema, amplitude units, missingness, outcome provenance, aggregate/arm review status and the absent execution authorization. PR CI does not train on these rows.
