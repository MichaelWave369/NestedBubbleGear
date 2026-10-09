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
