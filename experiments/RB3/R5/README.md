# NBG-RB3-R5 — Independent evidence-review packet

**Status: REVIEW PREPARATION ONLY. There are no independent review signoffs and no real-data model runs.**

The project has 64 candidate condition × endpoint rows from 9 of the 14 RB2 source papers and 8 of its 11 independent lineages. This rung freezes a deterministic **review packet generator**, a case/risk index, and an empty, fail-closed adjudication ledger. It does not assert that a prior CI pass independently established the source claims.

## Why R5 exists

Earlier R0–R4 audits establish source references, field-unit consistency, lineage membership, and source-attribution consistency. They **do not prove** every abstract or full-text conclusion has been correctly assigned to a particular intervention arm, comparator, assay, and measurement time.

An automated test which confirms that a CSV matches an expected direction is not an independent replication of that publication's conclusion.

R5 keeps these activities separate:

- **Machine-prepared review packet:** reproducible inventory of 64 rows with their provenance links and source-specific risk flags.
- **Independent human review:** a different reviewer inspects the primary article's actual methods/results/figures, identifies the correct comparator and exposure, and records a signed, attributable decision in a *subsequent PR*.
- **Admissible modeling input:** may only be assembled from reviewed-eligible rows after review signoff, canonical hashing, RB2 source/lineage evaluation checks and separate main-only authorization.

## Files

- `review_protocol.json`: the 14-source risk register, hard promotion rules, and immutable freeze references.
- `review_decisions.json`: **empty initial decision ledger**. Must remain empty in R5.
- `build_review_packet.py`: read-only `--audit` and `--packet` modes, cross-checking all 64 candidates against their evidence receipts, mapping each to original RB2 source/lineage, calculating source coverage and classifying risks.
- `tests/test_review_packet.py`: controls for forged signoffs, misaligned evidence, source drift and deterministic hashes.
- `.github/workflows/rb3-r5.yml`: qualification without real-data fitting.

`--packet` writes a JSON review packet to stdout. It does not rewrite old evidence or commit generated scientific labels.

## Reviewer requirements in a successor PR

For each source, record one of:

- reviewed with eligible condition-level evidence;
- reviewed but no admissible rows;
- full text unavailable or inconclusive;
- conflicting/ambiguous evidence requiring further adjudication.

Each proposed `REVIEWED_ELIGIBLE` row needs the original DOI, page/figure/table, exact frequency/amplitude/duration and comparator, endpoint assay, reported directional/statistical result, comments about absent data, independent reviewer identity and attributable review receipt.

An *AI summary*, abstract-level pooled claim, or pass from the existing automated CI is not an independent reviewer attestation.

## Priority cases

The risk index flags:

- S008: difference between 3h and 6h exposed arms **is not** a sham comparison;
- S009: duration-by-endpoint matrix not extracted;
- S013: ambient, nulled, and 50 Hz exposed regimes must remain distinct;
- S011/S012: abstract-pooled nulls require per-arm full-text review;
- S014: proliferation and DNA damage coexist; no invented cell-line-specific effects;
- S010: higher harmonic content makes nominal carrier frequency an incomplete stimulus descriptor.

## Output / readiness

The current expected report is:

`BLOCKED_RB3_REAL_FIT_AWAITING_INDEPENDENT_REVIEW`

- frozen source papers: 14;
- candidate papers: 9;
- candidate rows: 64;
- represented lineages: 8;
- missing candidate lineages: L005, L006, L010;
- independently attested/verified rows: **0**;
- scientific training/execution authorized: **false**.

A future genuine review may reject rows, retain unknowns, or conclude `VOID_INSUFFICIENT_CORPUS`. That is a valid outcome, not a reason to adjust the frozen hypothesis.

**No treatment-frequency, tissue-regeneration, DNA-antenna, or safety claim is authorized.**

## E1: reviewer-intake workbench

See [E1/README.md](E1/README.md). `E1/review_intake.py` generates draft forms and rejects structural inconsistencies for all 14 frozen sources. It also provides a source-access ledger for the three unrepresented lineages and other unresolved papers.

The forms are **not signed evidence**. Even after a human supplies a proposal, the script only validates structure and source fingerprints. Any scientific promotion must occur later in a separately approved review process; this E0 ledger and the frozen model inputs remain untouched.

## E2: external evidence-request dispatch

See [E2/README.md](E2/README.md). The E2 script generates 14 source-specific evidence dossiers and a SHA-256 manifest of the unchanged R5-E0 review packet. The PR workflow uploads these records as a downloadable Actions artifact, while the GitHub Issues template permits outside contributors to report exactly which source figures and exposure comparisons remain unresolved.

An evidence issue, a reviewer draft, a CI pass or an artifact hash is **not** a human peer-review decision and does not change `review_decisions.json` or the real-fit guard.

## E3: primary-publisher readout timing

[E3/README.md](E3/README.md) documents the assistant-conducted HTML spotcheck of the 2025 Scientific Reports neural-stem-cell article and 2016 PLOS embryonic NSC article. The key finding is **nonuniform post-exposure readout time** despite matching nominal exposure schedules (7-day secondary-neurosphere count and 3-day GFAP cell maturation, versus immediate post-exposure assays).

`E3/audit_timing.py` cross-checks the 18 inspected rows against their frozen candidate/evidence receipts, prevents timing and numeric source tampering, and explicitly refuses any independent-review or real-fit promotion. This is a *preparatory source check*, not human adjudication.
