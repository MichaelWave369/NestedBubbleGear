# PHMP-SM1 E1A | Fixed-embedding, equal-information retrieval bench

**Stage:** offline evaluation tool plus hand-authored synthetic fixture. **Authority:** `NONE`. **Origin of fixture:** `SIMULATED`. **Real learned-embedding benchmark:** `NOT YET RUN`. **NBG/phase advantage:** `NOT CLAIMED`.

## Why this is the next rung

E0 showed binary polarity phase and signed-real cosine tie when given the same information; an unsigned baseline ignores the sign and predictably loses some toy examples. E1A keeps that honest comparison while allowing **real, fixed embedding vectors supplied by an operator** to replace the hand-authored vectors. It does not generate or install models, connect to Ollama, query outside networks, persist memory, modify existing datasets, or change any PHMP-3 reserved evaluation.

## Run the bundled contract

```bash
node scripts/test_phmp_semantic_memory_e1a.mjs
node scripts/phmp_semantic_memory_e1a.mjs --input experiments/PHMP1/fixtures/phmp_sm1_e1a_synthetic_vectors.json
node scripts/phmp_semantic_memory_e1a.mjs --input experiments/PHMP1/fixtures/phmp_sm1_e1a_synthetic_vectors.json --out /tmp/phmp-sm1-e1a.json
```

Requires Node 20+ only. Output with `--out` is exclusive-create; it refuses overwrite. No external calls. Reports are deterministic and SHA-256 hashed; hashes identify what a report contains but **do not establish truth, provenance or independent attestation**. The input JSON can contain text and vectors that reveal private data: do not commit private corpora or reports.

## Input schema

A standalone JSON object:

```json
{
  "schema": "PHMP-SM1-E1A-CORPUS",
  "embeddingSource": {
    "kind": "OPERATOR_SUPPLIED_LOCAL",
    "model": "exact-local-model-and-version-label"
  },
  "dimension": 3,
  "records": [
    {
      "id": "test-01",
      "text": "Router accepted after validation.",
      "scope": "lab",
      "sourceId": "operator-supplied-local-claim",
      "origin": "OBSERVED",
      "authority": "NONE",
      "validFrom": "2026-01-01",
      "validTo": null,
      "claim": {"subject": "router", "predicate": "passes", "object": "acceptance", "polarity": 1},
      "vector": [0.2, 0.9, 0.4]
    }
  ],
  "queries": [
    {
      "id": "q01",
      "text": "Did the routing module pass?",
      "scope": "lab",
      "asOf": "2026-03-01",
      "family": "paraphrase",
      "claim": {"subject": "router", "predicate": "passes", "object": "acceptance", "polarity": 1},
      "expectedIds": ["test-01"],
      "vector": [0.3, 0.8, 0.4]
    }
  ]
}
```

Vectors must already have been produced by the **same pinned encoder**, with identical dimension. `origin` is merely a declared label from the input; `OBSERVED` or `VERIFIED` does not magically verify a source. The evaluator rejects unknown authority values, NaN/Infinity, zero vectors, malformed dates, duplicate IDs, mismatched dimensions, invalid/ineligible labels and oversize inputs. All records remain local, read-only inputs. Bounds: 16 MiB input JSON, 2–2048 dimensions, at most 2500 records and 500 queries, at most 1 million record-vector components.

**Labels:** `expectedIds` contains all records pre-judged relevant to that query, based on a separate human/reference adjudication. Empty means an intentional no-answer trial. Do not alter these labels after observing a reserved set. The validator only proves schema/eligibility, not relevance or absence of hidden positives. For a genuine E1 comparison, pre-register and freeze real human-labeled examples and a held-out split **before** inspecting any results.

## Comparators and interpretation

Every comparator can read the same artifact, including signed polarity, scope, timestamps and provenance:

1. **`raw_cosine`**: normal embedding cosine; deliberately ignores polarity; eligibility gates always apply.
2. **`metadata_filter`**: standard cosine plus exact sign filter (same information as phase).
3. **`signed_real`**: sign-aware real cosine (`sign(query)*sign(record)*cosine`).
4. **`complex_phase`**: binary complex phase difference `0/π`; equal by definition to signed real cosine, checked query-by-query.

The phase mode is a **binary phase comparator**, not a learned or dimension-wise complex waveform. It is not ResonanceDB's exact kernel. Complex `d`-vectors can always be embedded in `2d` real dimensions for real-inner-product scoring. If a phase mechanism ultimately beats something, compare it to **equally expressive real baselines** with the **same metadata**, not to a baseline deliberately denied negation.

The tool emits top-1 hit rate, recall@5, MRR@5, nDCG@5, abstention accuracy and false recall counts on empty-ground-truth queries, broken down by family. The metrics are *retrieval-only* and are not end-to-end answer correctness. All eligible claims are marked `CANDIDATES_ONLY`, `CONFLICT`, or `INSUFFICIENT`; no ranking method returns `TRUE` or permission to insert memory into a prompt.

The standard provenance gate accepts only declared `OBSERVED` and `VERIFIED` records; `DREAMED` and `SIMULATED` never enter evidence-side retrieval. Exact scope and date-window checks happen before semantic ranking. A conflict is both polarities active for the same structured triple. Query labels do not affect ranking.

## What the bundled fixture actually means

The fixture has nine labeled records and ten queries with manually chosen four-component vectors. It exercises negation, temporal replacement, paraphrase labels, tenant isolation, excluded dream records and no-answer questions. It **does not** contain output of any embedding model. Results are only deterministic tests of code and scoring behavior. It cannot validate improvements to real semantic memory.

## Next gate: E1B real local embeddings, operator-driven

- Define a consented, **local-only** embedding collection workflow pinned to an already-installed Ollama embedding model; never auto-download weights or call a cloud reference.
- Keep an independent human-labeled development set and a still-sealed reserved holdout. Save the model digest, embedding dimensions, input hashes, CPU/latency information, source commit and provenance on all receipts.
- Measure parity against the sign-aware real and metadata-filter controls, including confidence intervals per independent query group, and explicitly publish ties/failures.
- No Vessie, TMC, SML, NBG source-frozen study or live memory prompts may be mutated by this benchmark.

**Ledger Above Ego.**
