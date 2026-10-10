# RB3-R5-E1: actionable reviewer intake and source requests

**Status:** ready for external reviewer intake; **zero reviewer approvals collected**. This rung does not promote any row or authorize a fit.

## Review workflow

1. Run `python experiments/RB3/R5/E1/review_intake.py --source RB2-S008` (change source ID as needed). This prints a structured, unapproved source-specific review form with the existing candidate row hashes and evidence gaps.
2. Obtain the original Methods, Results, figures or tables from the paper, publisher, institutional library or author. A searchable abstract alone does **not** settle a condition-by-endpoint comparison.
3. Fill reviewer notes, precise experimental arm, comparator, timepoint and source locator. Use `PROPOSE_ELIGIBLE`, `PROPOSE_REJECT` or `NEEDS_PRIMARY_TEXT` as a **proposal**, not a final decision.
4. Run `python experiments/RB3/R5/E1/review_intake.py --validate path/to/draft-review.json`. This checks the frozen packet identity, row hashes, source membership, decision vocabulary and required fields, and rejects any claim of execution authority.
5. Submit the draft in a **separate** PR for independent human full-text adjudication. That PR must be reviewed by someone other than the original extractor. CI cannot prove a claimed reviewer identity, determine the actual figure content or substitute for a real signoff.

For studies with **zero** existing candidate rows, record `CONDITIONS_FOUND_PENDING_EXTRACTION` only as a source-level discovery outcome. Do not fabricate or fit condition rows; a later PR must create them with full source evidence and independent review.

## Readiness vs proof

`--audit` reports source access and the ability to create consistent draft forms.

A structurally complete proposal is **not** `REVIEWED_ELIGIBLE`. The validator outputs only `STRUCTURAL_REVIEW_DRAFT_VALID_NOT_ATTESTED`. It never edits `../review_decisions.json`, the immutable R0–R3 candidate records, or `FROZEN_ROWS.csv`.

## Evidence acquisition priorities

- **L005 / S008:** 3h or 6h exposures, sham controls, early/16h observation time, cell-cycle versus proliferation. Note that a null comparison *between two exposed arms* isn't a null *against sham*.
- **L006 / S009:** 15 Hz, 1 mT, exact duration by proliferation, gene expression, ALP and mineralization. MEK/ERK inhibitor condition is not a baseline sham.
- **L010 / S013:** 50 Hz 6 µT RMS vertical field versus nulled, ambient and cyclotron conditions; separate 1/4/7/21 day endpoints. No pooled-null multiplication.

The source access ledger deliberately distinguishes public landing pages from inspected primary full text. If the source isn't obtainable, preserve `FULLTEXT_NOT_OBTAINED` without interpreting it as an experimental null.

## Privacy and independence

Reviewer IDs or handles in JSON forms are declarations, not authenticated identities. The tooling rejects fake `attested` or `approved` state but **cannot cryptographically establish independence**. GitHub review history and direct inspection of cited source material are required out-of-band. Don't embed credentials, private article copies or personal contact information in the repo.

## Hard stop

Training remains blocked under `BLOCKED_RB3_REAL_FIT_AWAITING_INDEPENDENT_REVIEW`. Even with reviewed sources, RB2's original lineage holdout, complete admissible freeze, and separate main-only authorization are required.

No treatment, DNA-antenna, or healing-frequency inference is justified.
