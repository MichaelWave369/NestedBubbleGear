# PHMP-SM1 E1C | Calibrated Abstention and Source-Aware Candidate Admission

**Status:** development-only, deterministic synthetic software qualification. **Origin:** SIMULATED. **Authority:** NONE. **Not** a production memory runtime, real-world semantic retrieval benchmark, physical experiment, or proof of phase superiority.

## Purpose

E1A/E1B can return high-ranked records and flag conflicting claims, but their ranking tables do not have an explicit governed decision for when **not** to return a candidate as usable memory. A high similarity score is neither source truth nor authorization.

E1C adds a distinct **candidate admission layer** and a deliberately strong conventional baseline. The research question is whether separating rank, scope, provenance, temporal validity, typed claim agreement and contradiction improves the system's ability to **abstain without inventing certainty**.

### Methods compared under identical input access

| Mode | Ranking score | Same source/scope/time gates | Explicit admission claim gate |
| --- | --- | --- | --- |
| `raw_cosine` | plain cosine, intentionally sign-blind | yes | yes |
| `metadata_filter` | cosine with exact polarity filter | yes | yes |
| `signed_real` | signed real cosine | yes | yes |
| `complex_phase` | phase difference 0 or π | yes | yes |
| `exact_claim_filter` | cosine after full subject/predicate/object/polarity filter | yes | yes |

The last mode is a strong, ordinary **metadata-aware vector retrieval baseline**; it is allowed the same explicitly structured fields as the phase mode. The `signed_real` and `complex_phase` paths must tie in scores, ranking and governance outcomes. Differences versus `raw_cosine` do **not** establish an equal-information improvement because that comparator ignores information it was given.

The exact-claim filter is useful when claims have already been structured. This pilot does **not** automatically parse sentences, discover correct subjects, or determine which source is truthful.

### Decision rule

For each query and scoring mode:

1. Filter records by exact **scope**, declared evidence-eligible **origin** (OBSERVED or VERIFIED), and **as-of time** (closed-open validity interval).
2. Identify contradictory active positive/negative claims of the same triple. If both sides exist, return `CONFLICT_DEFER` rather than quietly selecting the best-looking assertion.
3. Rank eligible records with the chosen comparator. No eligible candidate returns `INSUFFICIENT`.
4. An otherwise highly ranked candidate whose declared triple and polarity disagree with the query returns `CLAIM_MISMATCH_DEFER`.
5. A candidate beneath the frozen development-calibrated threshold returns `LOW_SCORE_DEFER`.
6. An eligible, matching, nonconflicted candidate clearing the threshold returns **`CANDIDATE_ONLY`**, never `TRUE`, `VERIFIED` or automatic prompt-admission permission.

The original record text, source identity and evidence remain available to the caller who has permission to inspect them, but a score does not grant that permission.

### Development-only threshold selection

The manifest `fixtures/phmp_sm1_e1c_development_split.json` defines distinct **development** and **validation** query groups (9 and 4 queries in the hand-authored E1B template). The split is *subject-disjoint*; the same declared entity cannot occur on both sides. Every input query must be assigned exactly once.

Each comparator calibrates an independent scalar threshold using **only development-query labels**:

- Enumerate candidate top-score cutoffs and the mandatory abstain-all cutoff 2.
- Require zero wrong admissions on exposed development queries.
- Maximize correct development admissions, breaking ties in favor of the stricter cutoff.
- Freeze the chosen cutoff and evaluate on the separate validation group **without retuning**.

This is a *demonstration of the mechanism*, not an independent untouched holdout: the templates, labels, vectors, split, and evaluation code are public, tiny and deliberately synthetic. Optimizing to zero **observed** wrong admissions does not guarantee zero future false recall. `CANDIDATE_ONLY` does not imply a calibrated probability or a human-certified fact.

The output compares development and validation candidate coverage, wrong admissions, conflict deferrals, false admissions on explicitly no-answer queries, and selective precision. A zero-risk-looking score from four validation queries has no statistical generality.

## Reproduce without Ollama, private data or internet

```bash
npm run test:phmp-sm1-e1c
```

The tests generate a synthetic E1A-compatible in-memory corpus from the committed E1B public development text, using **manually assigned deterministic toy vectors**. No Ollama installation or model inference is performed by CI.

### Optional operator-run E1B corpus, after explicit local approval

If you already produced `artifacts/local/phmp-sm1-e1b-development-corpus.json` with E1B's separate explicit local Ollama `--execute` command, you can evaluate candidate admission offline:

```bash
node scripts/phmp_semantic_memory_e1c.mjs --input artifacts/local/phmp-sm1-e1b-development-corpus.json --split experiments/PHMP1/fixtures/phmp_sm1_e1c_development_split.json --out artifacts/local/phmp-sm1-e1c-pilot-report.json
```

The exporter is **not** started by E1C. This command reads an existing corpus and writes a new report with exclusive-create semantics, refusing overwrites. Keep reports/embeddings outside Git. The corpus must contain **exactly the same query IDs and typed subject groups** as the public E1B development template. If the original E1B operator-run attempt has not happened, this is a prospective instruction, not evidence it was done.

### Proof boundaries and next experiment

E1C's receipt hashes the entire evaluated corpus and split and documents each comparator's threshold plus validation decisions. SHA-256 detects mismatched bytes but does not provide independent source attestation or trusted signatures. No private data, remote APIs, model weights, PHMP-3 reserved dataset, Vessie runtime, or production prompt pipeline are touched.

**Future E1D** should measure real local embedding behavior from consented data using a new independently annotated, pre-registered held-out corpus, with robust conventional hybrid baselines, uncertainty intervals and recorded operator-hardware latency. For any *learned* phase model, compare against **equally expressive real-valued representations** and account for parameter, training and index-memory budgets.

A phase-derived advantage should be rejected if it is explained entirely by explicit polarity or typed metadata already available to classical retrieval.

**Ledger Above Ego.**
