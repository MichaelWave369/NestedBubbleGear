# RB3-R5-E8 | Lawful full-text discovery without fake reviewer signoffs

**Status:** working research-metadata access probe, **not** primary-full-text review.

E0–E7 gave us 14-source review packets, two-person draft reconciliation and safeguards against invented model rows. The open evidence gap is that five frozen papers have **zero** extracted condition-level observations, including three source lineages **L005, L006 and L010** missing entirely.

The new E8 tool makes an actual Europe PMC REST metadata request for each unresolved PMID. It is intentionally limited to publicly available index metadata and *candidate links* to an open repository. It never requests, copies, stores, republishes or analyzes article content. A Europe PMC `hasPDF: Y` field **does not mean** a PDF is openly licensed or that we saw its figures. Even `isOpenAccess: Y` with a matched PMCID is only a location candidate, not a reviewed scientific finding. See [Europe PMC REST API](https://europepmc.org/RestfulWebService).

## Reproduce

```sh
# Offline: deterministic, no network, fails if our frozen source identities change
python experiments/RB3/R5/E8/access_probe.py --audit

# Live: requests only Europe PMC index metadata, no article bodies
python experiments/RB3/R5/E8/access_probe.py --probe-live --out-dir /tmp/nbg-r5-e8-access

# Optional: verify the generated metadata-only machine report
python experiments/RB3/R5/E8/access_probe.py --validate-report /tmp/nbg-r5-e8-access/access_report.json
```

The live output directory must be **outside** the repository and empty/new. It contains only:

- `access_report.json`: exact matched DOI/PMID, OA/PDF metadata signals, possible PMCID repository URL, request failures, source-specific unresolved figure questions and explicit non-review statuses
- `access_report.md`: short reviewer-readable source access summary

The GitHub Actions qualification performs a deterministic **offline** source/schema audit and a separate **live** metadata probe which uploads the report as a temporary downloadable workflow artifact. Network failures become `METADATA_PROBE_FAILED` with no assertion that the article cannot be obtained elsewhere.

## Sources searched

| Frozen source | Lineage | PMID | Main unresolved issue |
|---|---|---|---|
| RB2-S005 | L003 | 20816824 | Separate hippocampal-neurogenesis exposure arms vs sham |
| RB2-S007 | L004 | 22568519 | Human epidermal cells in collagen scaffold, source-specific proliferation comparator |
| RB2-S008 | **L005** | 22676915 | 3h-vs-control and 6h-vs-control, 3h-vs-6h, early vs 16h endpoints |
| RB2-S009 | **L006** | 24068522 | Duration × proliferation/osteogenic assays with U0126 separately |
| RB2-S013 | **L010** | 8919028 | Vertical 50Hz field vs ambient, nulled and cyclotron regimes at 1/4/7/21 days |

## Source/provenance protections

An index result must match **frozen DOI + PubMed ID + MED source**. A PMCID by itself or `hasPDF` by itself cannot mark full text as inspected. An OA/PMCID record yields `OA_REPOSITORY_CANDIDATE_NOT_INSPECTED`, never `REVIEWED_ELIGIBLE`. If the provider is unavailable, its response is empty, or an identifier mismatches, the report explicitly says unknown or invalid instead of inventing source results.

The audit checks all 64 original unreviewed candidates, 14 frozen source identities, previous E7 review reconciliation, empty actual human reviewer receipts and absence of `FROZEN_ROWS.csv` / `REAL_ROWS_FREEZE.json`. It produces **zero** additional biological observations or training eligibility.

## What counts as progress from here

An **actual independent reviewer** follows any candidate link, verifies legal access and original Figures/Methods, identifies precise sham/control arms, assay/readout time and significance, then submits a separate E1 review draft. E7 can compare two drafts but does not independently authenticate human reviewers. Source discoveries with no prior candidate rows still require a **separate original extraction PR**, and the original 11-lineage study may correctly result in `VOID_INSUFFICIENT_CORPUS`.

Follow existing [evidence request issue #92](https://github.com/MichaelWave369/NestedBubbleGear/issues/92).

This is **access discovery**, not validation of human tissue regeneration, therapeutic fields, direct DNA resonance or any medical benefit.
