# NBG-RB3-R2 — Cross-lineage source-backed extraction

**Status: PARTIAL. Source-attributed candidate observations, not reviewed final input, not a model result.**

RB3-R2 continues the original RB2 fixed 14-source corpus without adding a paper, changing a model feature, choosing new train/test folds, or executing real-data training.

## Added sources and counts

| Source | New lineage | Candidate rows | Scope |
|---|---|---:|---|
| RB2-S006, Zhang et al. 2013 | L004 | 9 | 1, 10, 50 Hz × 3, 5, 7 days; MTT proliferation proxy, 5 mT |
| RB2-S010, Pasi et al. 2016 | L007 | 12 | Six 5/50 Hz × intensity combinations × proliferation and viability |
| RB2-S011, Supino et al. 2001 | L008 | 8 | 20/500 microtesla × 1/4 days × MCF-7 growth and viability |

**Total: 29 additional candidate rows, 56 across R0/R1/R2, 6 papers, 5 of 11 independent source lineages.**

These counts are descriptive only. Each row can belong to a shared cell sample or assay family and must NOT be treated as an independent replicated experiment.

## Primary evidence

- **S006** author-uploaded original full text says all nine 1/10/50 Hz × 3/5/7-day MTT comparisons showed increased proliferation vs corresponding controls (p<0.05). This is an **MTT metabolic signal**, an indirect cell-number/proliferation proxy. Exact individual values/p-values are not transcribed.
- **S010** original full text specifies 5 Hz × 0.25/0.5/0.8 mT and 50 Hz × 0.5/0.8/1.6 mT. Four exposure arms were significantly lower in 24-hour proliferation relative to sham: all three 5 Hz arms and 50 Hz/0.8 mT. The other two proliferation arms are NULL/non-significant, not biologically equivalent. Viability was author-reported unchanged across exposure conditions.
- **S011** publisher-indexed abstract says 20 and 500 microtesla at 50 Hz produced no appreciable change in MCF-7 growth or viability after 1 and 4 days. These rows use **NOT_REPORTED** for specific p-values; they must not claim per-arm proof of exact zero difference.

## Important new hidden-state clue

S010 explicitly reports higher harmonics from the exposure hardware. A nominal 5 Hz or 50 Hz sinusoidal device setting does not prove an ideal pure-frequency stimulus. The candidate table preserves `NOMINAL_SINUSOIDAL_HARMONICS_REPORTED` as an auditable descriptive waveform class, not proof that any single harmonic caused a biological effect.

## Conversion and missingness

- 5 mT -> 0.005 T
- 0.25 mT -> 0.00025 T
- 20 uT -> 0.000020 T
- 500 uT -> 0.000500 T

Field geometry/orientation, precise per-arm p values, and unreported duty cycles remain unknown. Exposure seconds encode **source-reported time per session** or the entire **continuous exposure** when appropriate; R2 does not infer a hidden repeated-dose schedule.

## Null ≠ equivalence

For source-reported unchanged/nonsignificant outcomes, `NULL` remains an operational target class, not a claim of no biological response. Broad author-reported nulls with no extracted per-arm p use `NOT_REPORTED` significance, not an invented statistical test.

## Remaining work

Eight of the RB2 papers remain without condition-level candidate data; six independent lineages still have no candidate rows.

`R2/validate_candidate.py` checks source membership, lineage consistency, endpoint/data-type vocabulary, allowed frequency-amplitude combos, unit conversion, evidence linkage, per-arm label/significance source correspondence, source-specific exposure rules, frozen context exclusion and absence of execution authorization.

No `FROZEN_ROWS.csv` or `REAL_ROWS_FREEZE.json` is introduced.

## Sources

- S006: https://pubmed.ncbi.nlm.nih.gov/22926783/
- S010: https://pubmed.ncbi.nlm.nih.gov/27254779/
- S011: https://pubmed.ncbi.nlm.nih.gov/11510961/

These are in-vitro cell findings, not evidence of complete human tissue regeneration, DNA radio-antenna coupling, or an effective/safe treatment frequency.
