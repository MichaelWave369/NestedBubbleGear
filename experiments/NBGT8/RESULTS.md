# NBG-T8 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT8**

- Python invariant checks: **18/18 PASS**
- Python unit tests: **20/20 PASS**
- browser review-queue acceptance: **PASS_NBGT8_REVIEW_QUEUE**
- Vite production build: **PASS**
- host allow-list enforcement: **PASS**
- private-address refusal: **PASS**
- persist-before-review: **PASS**
- retrieval failure / ambiguity preservation: **PASS**
- reviewer gate: **PASS**
- source-status immutability: **PASS**
- version drift: **PASS**
- contradiction preservation: **PASS**
- offline replay: **PASS**
- no hindsight: **PASS**
- canonical ordering: **PASS**
- replay exact: **PASS**

## Frozen witness

```text
k4 -> ALLEGED
k5 -> ALLEGED
k6 -> CORROBORATED
k7 -> CORROBORATED
k8 -> CORROBORATED
k9 -> DISPUTED
```

At k7 the same logical source locator has changed bytes and produces one explicit `DRIFT_DETECTED` record. The changed version is not silently substituted.

## Frozen semantic / adapter hashes

```text
SPEC.md                              35c9bd9e489f0e623d0e5da529c014162c93e31108e8788a53e55dcedb269a18
src/nbgt8.py                         2e35696fb9e7c57db31d51a2d63d443461516b77613b89696785a6840a06aa4c
tests/test_nbgt8.py                  aaed219260d23e57fecd141cc0bf60ccd9b4d6c1925ddd74b8d1c164da594f27
scripts/nbgt8_capture.py             be9924baaa5dc470e56f6529f79f94a4b2c5cd096626c3ac58984736520a76b4
src/evidenceReviewQueue.js           aaf966a6b25845b8484c0206a5ce69f879be46cf915365a0588d29dd931d8417
scripts/test_evidence_review_queue.mjs a8bd5706294b3cefbfb553c3f3024ac3ab0eb45c582d697df528e11ef53e28c0
```

The shared `App.jsx` and `styles.css` shell is build-tested and witness-checked rather than byte-frozen, so later UI rungs can extend the research site without retroactively failing T8.

## Generated artifact hashes

```text
result.json          1b22aefcfbb575501112237a6fc15c92f75cc9526bcac7f139a336d647377e91
base_claim.json      cd52d647129e43fb6989a60de30abce9aca6deacc92ab848b4e4e4aa907927ef
capture_receipts.json 206dae40f333a35e5d236a80a80eff4c165ef1f45396f3b45d384a4b06fc7d2f
review_decisions.json 6c122a0761ae638cfe4d583f4579271641234950e186a59d050e13a778ba8bf3
drift_report.json     7d3c549ab513d8e2ef8509169b8713030f6acbb393091417606d2424564baaef
review_queue_k8.json  dc4e59fe4fb20d38ef9367e896816e6b7b7b0b71c9355b44c021cfa9a135053b
```

## Claim boundary

The qualification fixture is synthetic. Live network retrieval is optional and operator-triggered, and CI does not fetch external historical sources.
