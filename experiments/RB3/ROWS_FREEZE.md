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

## RB3-R4 admission audit

R4 adds **no new model rows**. It formalizes the distinction between an in-scope original RB2 **source**, a partially attributed R0–R3 **candidate**, and an independently reviewed **eligible condition × endpoint** observation.

An accessible primary abstract reporting a pooled 3h/6h proliferation effect (S008), duration-dependent 15 Hz osteogenesis (S009), or an aggregate null across ambient/nulled/cyclotron/vertical 50 Hz field regimes over several days (S013) cannot be expanded into precisely assigned per-arm outcomes. All five unextracted sources are recorded in `R4/unresolved_studies.json`, with explicit `eligible_for_model_freeze: false`.

`R4/admission_policy.json` requires independently reviewed source-specific control comparison, exposure regime, endpoint identity, statistical source evidence, provenance and a no-pooling gate before any future `REVIEWED_ELIGIBLE` state. Without admissible rows across all frozen lineage folds, the appropriate conclusion is `VOID_INSUFFICIENT_CORPUS`, not synthetic filling or altered split rules.

At this stage: **14 frozen sources, 11 lineages, 64 candidate comparisons, 9 represented sources, 8 represented lineages, 0 newly reviewed fit-eligible rows, 0 model runs**. CI confirms this *readiness classification*, not the validity of the original papers' findings.

## RB3-R5-E0 independent-review preparation

`R5/build_review_packet.py` cross-links all 64 unchanged R0–R3 candidate rows to their frozen RB2 source/lineage, source-specific evidence receipt, intervention features, caution flags, and source risk classification. It emits a deterministic SHA-256 fingerprint for the reviewer packet and each original candidate row. This is bookkeeping to support future audits, not statistical analysis.

The `R5/review_decisions.json` adjudication ledger starts **empty** and is required to remain empty in this preparatory PR. No reviewer signatures or independent primary-source checks have been acquired by this change, and automated validation must never promote `PENDING_INDEPENDENT_REVIEW` to `REVIEWED_ELIGIBLE`.

The next R5 review/adjudication rung must be a separately reviewed change with actual article-specific evidence and attributable independent reviewer decisions. Missing conditions or unresolved pooled results remain unresolved and may ultimately require `VOID_INSUFFICIENT_CORPUS`.

**Real RB3 fit remains blocked.**

## RB3-R5-E1 review intake

R5/E1 makes the reviewer packet **actionable without falsely promoting evidence**. For any frozen `RB2-Sxxx` source, `review_intake.py --source RB2-Sxxx` emits a structured draft containing DOI, PMID, source lineage, evidence risks and the SHA-256 fingerprint of each already extracted candidate row. `--validate draft.json` performs structural checks against the current immutable R5-E0 packet and requires actual full-text figure/assay/comparator descriptions for any **proposed** eligibility.

The only successful output is `STRUCTURAL_REVIEW_DRAFT_VALID_NOT_ATTESTED`. No authenticated reviewer identity is established by CLI; even apparently complete draft proposals require an independent human reviewer and a separately reviewed PR. A source with zero existing candidate rows may report discovered, documented conditions in a draft but cannot directly mint a model row.

The S008/L005, S009/L006 and S013/L010 access records identify the exact missing comparator-by-duration evidence. Publisher or PubMed landing-page accessibility is **not** equivalent to an inspected primary full-text figure/table.

The authoritative R5-E0 `review_decisions.json` remains empty. `FROZEN_ROWS.csv` and `REAL_ROWS_FREEZE.json` remain absent, so real execution remains refused.

## RB3-R5-E2 reviewer dispatch

E2 creates a deterministic reviewer handoff **without changing the 64 R0–R3 candidate CSVs**. `R5/E2/build_dispatch.py --out-dir /tmp/nbg-review-dispatch` writes 14 readable source dossiers, the complete untouched R5-E0 review packet and a SHA-256 manifest. A dedicated GitHub Action exposes the bundle as a downloadable workflow artifact, and a GitHub issue form accepts source-specific evidence requests.

The five frozen papers without candidates are recorded as missing-evidence sources, **not** as measured null outcomes. E2's tests reject simulated reviewer approval, changed source identity, altered candidate hashes and any writing of generated dispatch artifacts into the tracked repository.

The authoritative `R5/review_decisions.json` remains empty and R4's source-versus-row evidence admission barrier remains unchanged. No independent human source review has been completed by this rung; no final model input, freeze authorization or scientific result is created.

## RB3-R5-E3 timing crosswalk

E3 adds an assistant-authored primary-publisher HTML source inspection for the existing nine R0 S001 records and nine R1 S002 records, with exact figure/assay crosswalk and selected verified numeric source values. **It does not modify the frozen candidate CSVs, target outcomes or the E0 feature set**.

The 2016 PLOS study explicitly counts secondary neurospheres **seven days after re-plating without exposure** and GFAP-positive differentiated cells **three days after the three-day exposure ends**. In contrast, GFAP mRNA is sampled after the exposure course. The original RB3 feature list has no post-exposure-readout-delay term, so these biologically different measurement windows must not be explained away as a pure frequency response. The timing information is attached as non-model evidence in `R5/E3/primary_html_spotcheck.json`.

A successful E3 audit confirms the crosswalk's consistency with published text and prior internal receipts, **not independent scientific validation**. Existing `review_decisions.json` remains empty, source eligibility stays unapproved, and real fit remains blocked.

## RB3-R5-E4 frozen-predictor collisions

E4 inventories **57 unique exact E0 model predictor vectors across 64 candidate rows**. Four groups spanning ten rows map an identical 13-field input vector to more than one source-attributed directional label. All four groups are within the L002 source lineage (S002 2016 and S003 2014).

The affected records reflect **different measured quantities**: Tuj1- versus GFAP-positive differentiated-cell proportions (including an independently documented *assay schedule*, not an independent reviewer); Tuj1 versus GFAP transcripts; neurite length versus primary-number versus branch count; and Tuj1/Sox2/Ngn1 transcripts. Only the first case has a documented 3-day GFAP post-exposure timing discrepancy; E4 does **not** assert timing explains the other cases.

The evidence is an assistant-prepared source crosswalk and **not a new RB3 outcome**, an accepted independent review, or proof of biological oscillatory hidden state. The original source set, row labels, features and grouped folds remain unchanged. Neither dropping conflicting rows to improve performance nor adding target identity/readout time post-hoc is allowed under the original freeze.

The model remains blocked awaiting independent article-level adjudication and adequate coverage across L005/L006/L010.
