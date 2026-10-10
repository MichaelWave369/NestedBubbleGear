# NBG-RB3-R1 — Primary-source extraction expansion

Status: **PARTIAL SOURCE-ATTRIBUTED CANDIDATE DATA; NOT MODEL-READY**.

This successor keeps RB3-R0 immutable and adds **18** additional condition × assay observations from two open-access PLOS articles, both from RB2 lineage **L002**.

- `RB2-S002` (2016): nine comparisons at 50 Hz, 1 mT, 4 h/day × 3 days. Assays include EdU, secondary neurosphere formation, Tuj1/GFAP differentiation and expression, and three distinct neurite metrics.
- `RB2-S003` (2014): nine comparisons at 50 Hz, predominantly 2 mT, intermittent 5 min on/10 min off, in the 3-day condition; Table 1 also includes distinct 0.5 and 1 mT CCK-8 sham comparisons.

## Evidence first

Each row links to the primary publisher, figure/table number, assay name, and the reported directional/statistical text in `source_evidence.json`.

The articles' exact numeric means and many exact p-values were not available in the extracted text. These are **not fabricated**. Their separate evidence fields record `NOT_EXTRACTED`.

Classification `NULL` means the original study reported no *statistically significant* difference; it does **not** mean equivalence, no effect or proof of zero impact. A CCK-8 metabolic/viability result is not promoted into a direct cell-count observation.

## Exposure data discipline

The 2016 article reports **4h/day × 3 days**: coded `exposure_duration_s=14400`, `repeated_exposure_count=3`, `duty_cycle=null`.

The 2014 article reports **5 min on / 10 min off** for up to three days: coded `duty_cycle=1/3`, with `exposure_duration_s` and `repeated_exposure_count` left null because the frozen numeric column represents a *per-session duration*, which is not independently stated.

Distinct study windows are preserved in notes and evidence rather than guessed into model features.

## Why this is not ready

The combined R0 + R1 candidates cover **27 rows, 3 of 14 source papers, but only 2 of 11 lineages**. Both new papers are **L002**, so no cheating with paper count as independent lineages.

The unchanged RB3 runner still refuses real fitting without full authorized freeze. Candidate CSVs are not promoted to `FROZEN_ROWS.csv`.

## Methodological caveat for RB4

A Tuj1 neuronal-differentiation assay and a GFAP astrocyte assay can share all currently frozen model predictors yet legitimately have different labels. Assay identity belongs in source evidence, **not** an unauthorized new model feature. These coarse-feature collisions must be reported, not patched with post-result tuning.

## Sources

- [2016 PLOS One TRPC1 study](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0150923), DOI `10.1371/journal.pone.0150923`
- [2014 PLOS One embryonic neural stem-cell study](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090041), DOI `10.1371/journal.pone.0090041`

No medical exposure, safety or regeneration claim is authorized by this corpus work.
