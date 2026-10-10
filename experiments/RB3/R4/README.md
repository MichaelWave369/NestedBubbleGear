# NBG-RB3-R4 — Admissibility Gate and Unresolved-Lineage Evidence

**Status: source-evidence triage and qualification only. No new predictive rows; no model run.**

The R0–R3 path contains 64 source-attributed candidate records from 9 primary studies, across 8 of the 11 RB2 lineages. The remaining three lineages are **L005, L006 and L010**.

R4 did not turn the three source-level abstracts into counterfeit condition-by-endpoint records. Instead, it freezes an explicit machine-readable **source-versus-row admissibility distinction**.

## Evidence reviewed

**L005 / RB2-S008:** 50 Hz, 10 mT PEMF, 3 h and 6 h. Authors report a significant early proliferation response but no significant *difference between the two exposure-duration groups*. This is **not** proof that both groups individually differ from sham. They also report no significant difference 16 h later. Without per-arm assay × follow-up timing, no classification row is admitted.

**L006 / RB2-S009:** 15 Hz, 1 mT sinusoidal magnetic field. Authors report duration-dependent proliferation, RUNX2/BSP/OPN osteogenic expression, ALP activity, and calcium deposition, with some MEK/ERK inhibitor effects. Missing the actual duration × assay grid, no row is admitted.

**L010 / RB2-S013:** FDCP-mix(A4) hematopoietic cells; ambient, nulled, calcium-cyclotron and vertical 50 Hz 6 µT RMS field regimes, for 1/4/7/21 days. Authors report a pooled absence of significant differences in growth/cell cycle/clonogenicity. A **nulled magnetic field is not equivalent to 50 Hz/6 µT**, and a pooled null is not automatically sixteen independent nulls. No row is admitted.

Additional unfrozen source records RB2-S005 (L003) and RB2-S007 (L004) remain blocked pending per-arm evidence; those lineages already have provisional candidate coverage.

## Artifacts

- `unresolved_studies.json`: exact primary DOI/PMID, field regimes and measurement claims, blockers and explicit no-promotion flags.
- `admission_policy.json`: source/candidate/reviewed/blocked/VOID states, independent-review checklist, no-guess rules and corpus stop condition.
- `audit_readiness.py`: read-only scan across frozen RB2 manifest + R0/R1/R2/R3 candidate files and evidence receipts.
- `tests/test_readiness.py`: checks for source counts, exact lineage coverage, pooled-claim quarantine, and tamper-fail behavior.
- `.github/workflows/rb3-r4.yml`: qualification only. No data-model fitting.

## Expected audited counts

| Measure | Value |
|---|---:|
| Original frozen RB2 primary studies | 14 |
| Original independent RB2 lineages | 11 |
| Candidate comparison rows in R0–R3 | 64 |
| Distinct sources with any candidates | 9 |
| Lineages with any candidates | 8 |
| Lineages with **no** candidates | 3 |
| Independently reviewed, fully admissible source rows | **0 confirmed** |
| Additional R4 prediction rows | **0** |

The zero-confirmed-admissibility count is intentionally conservative. Previous PR validators establish internal consistency and attributed source text, **not an independent full-text extraction audit**.

## Decision

`BLOCKED_RB3_REAL_FIT_SOURCE_EVIDENCE_INCOMPLETE`

A model comparison over only the easier-to-access published arms would risk selection bias and break the frozen source-lineage holdout.

If a source cannot yield independently verified condition-level observations, the correct future result can be `VOID_INSUFFICIENT_CORPUS`. Never invent observations simply to make the study count 11/11.

## Sources

- https://pubmed.ncbi.nlm.nih.gov/22676915/
- https://pubmed.ncbi.nlm.nih.gov/24068522/
- https://pubmed.ncbi.nlm.nih.gov/8919028/
- https://pubmed.ncbi.nlm.nih.gov/20816824/
- https://pubmed.ncbi.nlm.nih.gov/22568519/

Neither an exposure prescription nor evidence for a healing frequency, direct DNA antenna mechanism, or human regeneration is claimed.
