# NBG-RB3-R0 — Source-backed extraction audit (partial)

**Status: PARTIAL, NOT FROZEN FOR MODELING.**

This rung opens auditable row-level extraction without manufacturing values from RB2's study-level summaries. RB3-E0 has frozen the modeling semantics, but no literature fit may occur until a separately reviewed complete row freeze.

## What is actually in this PR

- `candidate_rows.csv`: **9 source-backed condition × endpoint rows**, all from RB2-S001 / lineage L001 only.
- `row_evidence.json`: original figure locations, assay names, comparator means, exposed-group means, source-reported p-values, and sample n.
- `extraction_queue.json`: source-by-source review status for all 14 RB2 primary sources.
- `validate_candidate.py`: schema, source-lineage, source-manifest amplitude/frequency, unit-conversion, evidence-p-value, and training-execution gate checks.
- tests + CI static qualification.

## Why only nine rows?

We validated Figure 3B/3C/3G from the original Scientific Reports paper (DOI 10.1038/s41598-025-14738-x). It explicitly reports the exposure intensity, duration and endpoint-specific comparison against 0 mT sham. Other included papers may offer useful outcomes, but their broad abstracts often do **not** identify which exact condition × endpoint comparison produced a significant/null result.

No one may expand a paper-level phrase like "enhanced proliferation" into invented rows for every field amplitude or every exposure duration.

## Explicit label rule

`NULL` encodes **not statistically significant vs sham at the reported comparison**, not zero measured effect, no biological response, or equivalence. NBG must keep the observed mean and p-value in its separate source evidence record.

The read-only `candidate_rows.csv` is **NOT** the frozen input to `rb3.py --execute`.

## Why the model must remain blocked

Only one of the eleven source lineages has verified condition-level rows here, leaving four or more folds empty. Any attempted grouped holdout would be invalid.

Real execution stays unapproved until full condition-level extraction, duplicate/lineage audit, reviewer signoff, receipt and immutable row-data hash.

## References

- Primary article: https://www.nature.com/articles/s41598-025-14738-x
- RB2 source manifest: ../RB2/corpus_manifest.json
- RB3 execution freeze: EXECUTION.md

## Next move

Continue the **same frozen 14-source eligibility set**, retrieving individual tables/results for other lineages. Do not change model features, thresholds, split definitions or the source set in response to extracted labels.

No human therapy/exposure inference is authorized.
