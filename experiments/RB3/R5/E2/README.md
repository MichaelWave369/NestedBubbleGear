# NBG-RB3-R5-E2: Reviewer evidence dispatch

**STATUS: UNATTESTED SOURCE REQUESTS. Zero new approved or model-ready observations.**

R5-E2 bridges the gap between having reviewer templates and actually distributing enough information to ask an independent person for specific source checks.

## Generate the review bundle

From the repository root:

```bash
python experiments/RB3/R5/E2/build_dispatch.py --audit
python experiments/RB3/R5/E2/build_dispatch.py --out-dir /tmp/nbg-review-dispatch
```

This produces a deterministic, source-only **review dispatch bundle**, which must be written *outside* the repository:

- `README.md`: 14-source review index, priority, lineage and available candidate counts;
- `dossiers/RB2-S001.md` through `dossiers/RB2-S014.md`: primary citation links, source-specific risks and precise missing evidence questions, plus row SHA-256 identifiers where candidates exist;
- `review_packet.json`: untouched R5-E0 review packet, including all 64 candidate references;
- `artifact_manifest.json`: hashes of every generated output file, source count, packet hash, and **execution_authorized=false**.

A GitHub Action builds these files and uploads them as a downloadable **Actions artifact** for the PR. The artifact contains no copies of academic articles, private contacts, peer-review attestations, or fitted model outputs.

## GitHub reviewer issue intake

The repository now has a **RB3 primary-source evidence request** issue form.

To start: open GitHub Issues, choose *New issue*, select the primary-source evidence form, pick a frozen `RB2-Sxxx` source, and paste the *exact* missing figure/table, timepoint, arm and comparator question. Refer to the attached R5-E2 dossier.

Issue creation is a request, not a human study review. A comment or successful GitHub Actions workflow cannot authorize `REVIEWED_ELIGIBLE`.

## First external evidence requests

- **S008 / L005:** the abstract distinguishes the 3h/6h comparison from sham exposure and early versus 16h readout; we need the *specific* figure/assay × arm significance entries for both timepoints.
- **S009 / L006:** retrieve the 15 Hz/1 mT per-duration exposure schedule and per-endpoint figures, separating MEK/ERK inhibitor arms from baseline.
- **S013 / L010:** obtain vertical 50 Hz, nulled, ambient and cyclotron-related comparisons for 1/4/7/21 days, without multiplying the study-level null into pseudo-replicate rows.

Existing R0–R3 evidence is **not** independently approved. A future reviewer may supply source locators and independent comments in a separate PR through `../E1/review_intake.py`; actual adjudication remains another controlled step.

## No-review guard

CI verifies that these generated documents contain **64 pending candidates**, 14 study dossiers, an empty human review ledger and zero authorized fits. Model execution still requires the separate immutable `REAL_ROWS_FREEZE.json` and `FROZEN_ROWS.csv`, neither present.

R5-E2 prepares evidence requests, nothing more. No healing frequency, complete tissue regeneration, DNA antenna mechanism, safety profile or treatment inference follows from this rung.
