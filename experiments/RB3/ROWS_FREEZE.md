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
