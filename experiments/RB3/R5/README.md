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
