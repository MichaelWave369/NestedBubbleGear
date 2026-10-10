# NBG-RB3-R3 — Cross-lineage evidence triage

**Status: PARTIAL CANDIDATES, NOT REAL-MODEL INPUT.**

R3 adds eight provisional **source-attributed** comparison rows from three frozen RB2 sources and lineages not previously represented: S004/L003, S012/L009, and S014/L011. These are deliberately marked `NEEDS_PRIMARY_FULLTEXT_PER_ARM_VERIFICATION`. The PubMed-indexed primary-study abstracts establish the general comparison, but exact per-arm p-values and some exposure schedules remain unavailable.

## Added R3 candidates

- **S004 / L003 (3):** cultured newborn mouse neural-stem/progenitor cells, 50 Hz/1 mT; neuronal marker-positive differentiation, Ca(v)1-channel current response, and KCl-triggered Ca2+ transients. Exact exposure duration and assay means not extracted.
- **S012 / L009 (2):** purified human hematopoietic progenitors, 50 Hz at 10 microtesla and 1 mT; source reports no significant changes overall in cell proliferation. **These two amplitude-specific NULL labels are provisional pooled-summary interpretations, not verified per-arm statistical results.**
- **S014 / L011 (3):** HL-60 human leukemia cells, Rat-1 fibroblasts, and WI-38 human diploid fibroblasts, 50 Hz at 1 mT/72h; source reports roughly 30% proliferation increase across tested cell types. **Do not translate this into a per-line quantitative 30% effect. The same paper reports DNA damage.**

## Accounting

R0=9, R1=18, R2=29, R3=8 gives **64 provisional candidate rows, 9 source papers, 8/11 represented lineages**. These are candidate rows, not independent biological replications.

**No real fitting permitted.** R3 candidate data may not become `FROZEN_ROWS.csv` without a separate independent full-text audit verifying precisely which arm/assay produced each reported outcome.

## Unrepresented and ambiguous evidence

`source_triage.json` explicitly records withheld sources S005, S007, S008, S009 and S013. Three remaining independent lineages L005, L006 and L010 lack candidate rows because the accessible abstracts do not establish per-condition results. In S008 the 3h vs 6h and post-exposure timing comparisons remain entangled; in S009 reported outcomes are duration-dependent without the precise duration/outcome grid; S013 contains multiple field regimes and days with a pooled null conclusion. Multiplying those pooled statements into an apparent dataset would be pseudoreplication.

## Outcome semantics

`NULL` denotes an author-reported lack of significant change, **not equivalence or biological zero**. `NOT_REPORTED` is used where a specific per-arm p-value is not available. Pooled/qualitative outcomes are `CANDIDATE_PENDING_FULLTEXT_REVIEW`, **not final model labels**.

## Scientific boundary

This is a literature audit. It establishes no resonant regenerative frequency, causal EMF-to-DNA mechanism, exposure safety or therapeutic efficacy.

## References

- https://pubmed.ncbi.nlm.nih.gov/17941084/
- https://pubmed.ncbi.nlm.nih.gov/9364198/
- https://pubmed.ncbi.nlm.nih.gov/15777847/
- https://pubmed.ncbi.nlm.nih.gov/22676915/
- https://pubmed.ncbi.nlm.nih.gov/24068522/
- https://pubmed.ncbi.nlm.nih.gov/8919028/
