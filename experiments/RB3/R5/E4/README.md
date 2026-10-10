# NBG-RB3-R5-E4 — Frozen-predictor identifiability audit

**Status:** source-attributed diagnostic, **not independent review**, not a new statistical model and not a medical finding.

RB3 has **64 candidate condition × endpoint observations** from nine primary papers (eight RB2 lineages). Some of those rows share **identical values for all 13 frozen E0 predictor fields** yet carry different author-attributed outcome classes. A deterministic classifier using only those 13 values cannot be exactly correct on all those opposing-label observations simultaneously.

This does **not** mean any individual research paper contradicted itself: these models compress distinct genes, cells and morphology measurements into broad endpoint categories. Exact-source outcome disagreements and within-study heterogeneity are different things.

## Reproduce the audit

```bash
python experiments/RB3/R5/E4/audit_identifiability.py --audit
python experiments/RB3/R5/E4/audit_identifiability.py --markdown
python -m unittest discover -s experiments/RB3/R5/E4/tests -v
```

The static audit compares original R0–R3 candidate CSVs and receipt evidence, the R5-E0 reviewer packet, and the R5-E3 primary-publisher timing crosswalk. It does **not** download or retrain anything.

## Counts

| Metric | Candidate value |
|---|---:|
| Condition/endpoint candidate rows | 64 |
| Distinct exact frozen model predictor vectors | 57 |
| Vector groups with contradictory output classes | 4 |
| Rows inside contradictory groups | 10 |
| Independent human reviewer approvals | 0 |
| Authorized real model runs | 0 |

These counts are on **source-attributed, not independently reviewed** labels. They do not measure scientific reproducibility or predictive model accuracy.

## Four documented collision groups

| Case | Original source | Same frozen coarse class | Existing attributed labels | Scientific distinction |
|---|---|---|---|---|
| C1 | S002 / 2016 PLOS | DIFFERENTIATION | Tuj1 INCREASE, GFAP NULL | Distinct cellular marker and 3-day additional GFAP culture time |
| C2 | S002 / 2016 PLOS | GENE_EXPRESSION | Tuj1 INCREASE, GFAP NULL | Different transcripts; both linked to end-of-exposure readout, **no known timing mismatch** |
| C3 | S002 / 2016 PLOS | NEURITE_OUTGROWTH | Length INCREASE, primary number NULL, branches INCREASE | Three different neurite-morphometry assays |
| C4 | S003 / 2014 PLOS | GENE_EXPRESSION | Tuj1 INCREASE, Sox2 DECREASE, Ngn1 INCREASE | Three distinct genes; specific per-assay readout-time difference **not established** |

Primary articles:

- Ma et al. 2016: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0150923
- Ma et al. 2014: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090041

The 2016 source documents a 4-hour/day, 3-day exposure followed by different biological assay arrangements. E3 documents the delayed GFAP-positive cell count and secondary-neurosphere count. E4 uses that timing **only for the cases where the original article supports it**. It does not transfer an E3 readout-time inference to S003.

## Meaning for the frozen experiment

The R5 casebook is a sidecar **review evidence diagnostic**. The original RB3 model has 13 frozen predictors and three outcome classes and must not gain post-exposure delay, gene target or fine-grained assay identity after results were examined. A *new, separately preregistered study* could evaluate these variables, but **the original RB3 result must not be repaired post hoc**.

Missing fine-scale analyte identity can make the mapping from the frozen inputs to the author-coded label non-identifiable within this candidate corpus. Conflicts must be retained and declared. Dropping one label or cherry-picking a readout to boost model accuracy would be selection bias.

An apparent conflicting outcome does **not** prove a causal nested-bubble resonance, a hidden gamma state or oscillating DNA. The biology may genuinely respond differently across gene targets, measurements, cell cultures and observation time.

## Peer review and fit remain blocked

The E4 crosswalk, like E3, is assistant-authored. It is **not independent external review**, cannot make a row `REVIEWED_ELIGIBLE`, and does not change the original R5-E0 empty adjudication ledger.

The project still lacks admissible per-arm outcomes across L005, L006 and L010 and may need to return `VOID_INSUFFICIENT_CORPUS`. No tissue-regeneration, safe exposure frequency or treatment recommendation is established.
