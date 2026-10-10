# RB3-R5-E7: Dual-review reconciliation, without automatic approval

**Phase:** reviewer coordination only. **Zero** independently authenticated reviewer submissions, **zero** approved eligible training rows and **zero** authorized RB3 real-data model runs.

## Why

The prior E0–E6 rungs established immutable study identities, reviewer draft forms, 64 candidate observations, missing evidence, biological assay timing and the frozen model's label conflicts. R5-E6 could only extract abstract-level assertions for S008/L005, S009/L006 and S013/L010. Those abstracts cannot responsibly become per-arm numeric measurements.

This rung implements a **two-person reconciliation workflow** so actual external reviewers can eventually check a specific source twice, compare what they independently transcribed and surface disagreements.

Two declared reviewer handles do **not** verify independence. The output always states it is a *structural reconciliation*, not scientific peer review or model eligibility. Real provenance must be checked via original article figures and GitHub's authenticated review records in a separate reviewed change.

## Usage

Create two independent E1 drafts, e.g.:

```sh
python experiments/RB3/R5/E1/review_intake.py --source RB2-S002 > reviewer-a.json
python experiments/RB3/R5/E1/review_intake.py --source RB2-S002 > reviewer-b.json
```

Reviewers work **separately** with their own lawful access to original primary Methods, Results, and figures, fill their `reviewer.github_handle` and set `reviewer.is_original_extractor=false` only when true. Any `PROPOSE_ELIGIBLE` row also requires fulltext URL, methods section, figure/table, exact assay, exposure window, assay readout time, sham/reference comparator, author-reported direction and statistics.

Then:

```sh
python experiments/RB3/R5/E7/reconcile_reviews.py --audit
python experiments/RB3/R5/E7/reconcile_reviews.py --compare reviewer-a.json reviewer-b.json
```

`--audit` verifies all 14 untouched source templates, unchanged 64 candidate IDs and hashes, original absence of reviewers/fit files, and the existing E1/E6 review contracts.

`--compare` validates both drafts using E1, checks source identity/packet hash/row IDs, requires **distinct** declared reviewers who both claim not to be the original extractor, and compares the seven material evidence fields **byte-for-byte** for any agreement in proposed eligibility.

### Possible unapproved outcomes

- `AWAITING_BOTH_PRIMARY_REVIEWS`: no substantive, finalized comparison.
- `CONCORDANT_UNATTESTED_ELIGIBILITY_PROPOSALS`: reviewers' reported evidence agrees *in form*, but there is still no authenticated reviewer approval or model data.
- `MATERIAL_EVIDENCE_DISAGREEMENT_REQUIRES_HUMAN_ADJUDICATION`: assay/field/readout/statistics disagree, even when both mark the row as potentially eligible.
- `AGREED_PROPOSED_REJECTION_NOT_FINAL`: both tentatively reject the same existing candidate observation.
- `AGREED_NEEDS_PRIMARY_TEXT`: both lack sufficient original source material.
- `CONFLICT_REQUIRES_HUMAN_ADJUDICATION`: different proposed outcomes.
- `CONCORDANT_SOURCE_DISCOVERY_NEEDS_NEW_EXTRACTION_PR`: a previously unrepresented paper has matching fulltext condition *discovery proposals*. **Zero rows are created; a separate extraction PR is mandatory.**
- `SOURCE_DISCOVERY_CONFLICT_REQUIRES_HUMAN_ADJUDICATION`: different proposed source-level disposition or new condition details.

No output uses `REVIEWED_ELIGIBLE` as its automatic status. The E1 and E0 authoritative ledgers are untouched. No second reviewer has actually been recruited or authenticated by this code.

## Scientific blockers enforced

- A publisher or PubMed **abstract** is not a figure/table. Source-only studies stay zero candidate rows.
- A 3h-versus-6h exposed comparison is not a sham null.
- A pooled field-regime statement does not prove a separate null for every regime and time.
- Gene/marker/readout differences underlying E4/E5 collisions cannot be silently dropped or added as post-hoc RB3 features.
- Identical source/row signatures are checked, but a written URL and GitHub handle are **declarations, not verified licenses, signatures or identities**.
- Disagreements stay visible for a human to resolve; two matching proposals do not bypass frozen RB2 lineage CV, fit authorization or `VOID_INSUFFICIENT_CORPUS` criteria.

The original 64 candidates across 8/11 lineages remain unapproved and real model execution remains refused.
