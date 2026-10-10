# RB3-R5-E3: primary-publisher timing crosswalk

**Research audit status:** `UNATTESTED_PRIMARY_HTML_SPOTCHECK`. The inspection in this rung was conducted by an assistant against publicly accessible primary-publisher HTML, *not* by an independent researcher. The frozen candidate rows and original fit guard are unchanged.

## Why it matters

A field-frequency/amplitude schedule is only one part of an experiment. Exposure duration, subsequent **unexposed culture time**, endpoint, assay and measurement time can differ between rows. RB3's existing frozen feature vector includes exposure duration/count and coarse endpoint family, but **does not encode a separate post-exposure readout time**.

Collapsing biologically different assay windows into the same feature vector can create conflicting labels, an unobserved variable, and an apparent frequency-response effect that cannot be assigned causally to frequency.

## S001: 2025 Scientific Reports

- Primary article: https://www.nature.com/articles/s41598-025-14738-x
- DOI: `10.1038/s41598-025-14738-x`
- R0's nine sham-referenced records represent 3 field strengths × 3 assays under 50 Hz, 1 hour/day for three days.
- Section 'ELF-EMFs facilitate the differentiation ...' and Figure 3B/3C report the NeuN-positive fraction and NeuN mRNA values and significance used in R0.
- The following neuronal-morphology section and Figure 3G report the neurite-count comparison.
- E3 records the original per-condition numerical means, p-value and n with explicit figure mapping and checks that these *match the pre-existing R0 evidence*. It does not claim an independently verified biological result.

## S002: 2016 PLOS ONE

- Primary article: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0150923
- DOI: `10.1371/journal.pone.0150923`
- Source Methods, Figure 1: 50 Hz, 1 mT, **4 hours/day across three days** for exposure.
- Source Methods, 'Neurosphere Assays': the secondary-neurosphere assay uses the three-day exposed culture, **dissociation and replating without exposure, then a seven-day counting period**.
- Source Methods, 'Immunocytochemistry and cell counts': Tuj1-stained differentiated neurons were fixed after three exposure days, but GFAP-stained astrocytes were **fixed only after three further culture days**.
- Source Results, Figure 3: Tuj1 and GFAP mRNA readouts were performed after three exposure days, so **GFAP mRNA and GFAP-positive-cell fraction do not share the same post-exposure measurement window**.
- Source Results, Figure 4: neurite length, primary-neurite count and branching after three exposure days have distinct response classes despite the shared nominal stimulus.
- Exact 2016 per-arm numerical means/p-values remain `null` in the E3 crosswalk if not separately extracted. No made-up statistical precision.

## Frozen dataset consequence

The original R1 CSV correctly records the three-day *exposure schedule*. Its metadata **does not represent** these later readout delays. E3 provides a **separate auditable measurement-timing ledger** rather than editing the frozen E0 model features or violating R1 immutability.

| Candidate row | Readout | Post-exposure culture time |
|---|---|---:|
| RB3R1-S002-02 | Secondary-neurosphere self-renewal count | 7 additional unexposed days |
| RB3R1-S002-04 | GFAP-positive astrocyte fraction | 3 additional days |
| RB3R1-S002-06 | GFAP mRNA expression | 0 additional days |
| Remaining S002 rows | their specified immediate endpoint | 0 additional days |

E3's validator requires exact R0 means/p/n, figure and assay match, R1 published assay/figure IDs, unchanged original exposure fields, a fixed source lineage, unreviewed status and absent fit authorization. Tamper tests refuse erasing or moving the GFAP and neurosphere delays into the exposure time.

## What the results do not establish

- A source-text transcription is **not** independent human re-review, experimental replication, or reproducibility certification.
- A nonsignificant `NULL` comparison is not formal equivalence.
- A model feature collision may reflect assay timing, biological system, measurement type or other confounding. This does **not** prove a hidden causal oscillator or a general healing-frequency effect.
- The original RB2 source set and fixed RB3 feature/holdout plan are unchanged. A later **predeclared** extension might explicitly test readout time as a feature, but that would be a new protocol and cannot be silently introduced into the frozen RB3 result.

This rung still reports `BLOCKED_RB3_REAL_FIT_AWAITING_INDEPENDENT_REVIEW`: **64 candidates, 0 independently approved rows, 0 real fits**.
