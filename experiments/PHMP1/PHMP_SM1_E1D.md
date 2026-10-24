# PHMP-SM1 E1D | Local-model evidence pilot and paired-comparison receipt

**Status:** original operator-run **local-only measurement protocol** plus deterministic, mock-only CI tests. The repository **does not claim an actual Ollama embedding model was run**. Fixture questions and labels are public/synthetic. Authority `NONE`. No held-out/general-purpose retrieval advantage claimed.

## What E1D adds

E1B requires multiple manual steps to export vectors, and E1A/E1C independently analyze ranking/admission. E1D joins them into **one explicit operator action** for the public fixture, with model digest, input hashes, bounded timing and source-linked comparison receipts.

The single report includes:
- Real embedding model's *self-reported* name and pinned SHA-256 digest, source fixture checksum, split checksum and complete evaluated corpus hash;
- E1A retrieval metrics (top-1 hit, recall@5, nDCG@5, MRR@5, empty-query error);
- E1C governed memory admissions and abstentions from development-calibrated thresholds, including source/claim mismatches and contradictions;
- **Paired per-validation-subject comparisons** of binary phase against standard metadata sign filtering, full exact-claim metadata cosine and signed-real scoring, with observed deltas, discordant pairs and a tiny **exhaustively enumerated cluster bootstrap**;
- Timing from the calling computer for the combined local embedding requests and local evaluation stage. This is **elapsed wall time**, not GPU utilization, model-only latency, energy or a database throughput benchmark.

The report intentionally **does not include raw embeddings or text**. It contains public fixture IDs, model identity/digest and source metadata. The E1B exporter remains available if raw vectors are needed, with separate opt-in.

## Windows PowerShell run: public data only

Requirements: Node 20+, running Ollama on the same computer at `127.0.0.1:11434`, and an **already-installed embedding-capable local model**. No weights installation, cloud API or auto-pull.

Run from the `NestedBubbleGear` repository root:

```powershell
# STEP 1: inventory only (no embedding request).
node scripts/phmp_semantic_memory_e1d.mjs --inspect

# STEP 2: select a model name and 64-character SHA-256 digest from inventory.
# Important: a chat-only model may appear in the inventory but fail /api/embed.
# No model will be downloaded automatically.

# STEP 3: only after choosing to send the repo's *public* 12 records and
# 13 questions to the local Ollama process, explicitly start this experiment.
node scripts/phmp_semantic_memory_e1d.mjs --execute --ack-public-fixture --model "YOUR_LOCAL_EMBEDDING_MODEL:TAG" --digest "sha256:YOUR_ACTUAL_64_HEX_DIGEST" --out "artifacts/local/phmp-sm1-e1d-model-trial-01.json"
```

The fixed source dataset is `experiments/PHMP1/fixtures/phmp_sm1_e1b_dev_template.json`; the fixed, subject-disjoint development/validation split is `experiments/PHMP1/fixtures/phmp_sm1_e1c_development_split.json`. E1D **refuses modified text, altered typed claims, changed labels, unseen record IDs or a changed E1B template hash**. It cannot be pointed at private chat histories using `--execute`; private memory integration is explicitly out of scope.

`--execute` asks E1B to check the *exact* model digest before and after encoding, then runs both E1A and E1C unchanged. Endpoint is fixed in E1B as loopback `http://127.0.0.1:11434`. A model failing the endpoint, a wrong hash, or nonfinite/mismatched vectors aborts without producing a success report. It writes a single result JSON under Git-ignored `artifacts/local/` **using exclusive-create** and does not overwrite previous reports. Before any embedding request the script checks that the destination does not exist. A local service can still log the public fixture text.

The output's reported model digest is provided by the installed Ollama service; it is **not** an independent model or hardware attestation. An operator should keep the output file private until checking its metadata.

### Offline replay: zero Ollama network calls

If you already created an E1B corpus from exactly the same public fixture, run:

```powershell
node scripts/phmp_semantic_memory_e1d.mjs --offline --input "artifacts/local/phmp-sm1-e1b-development-corpus.json" --out "artifacts/local/phmp-sm1-e1d-replay-01.json"
```

This only reads the existing E1B corpus and calculates the same comparisons locally. It is labeled `REPLAY_EXISTING_CORPUS`, and new model-embedding wall time is **not measured**. The replay refuses arbitrary user data or a simulated fixture masquerading as an operator-exported E1B corpus.

## Bootstrap and statistical caveat

The committed split has **four distinct validation subject groups**, so the exact nonparametric subject bootstrap enumerates `4⁴ = 256` resamples. It resamples each subject as a whole rather than treating repeated paraphrases of a subject as independent. Its percentile interval is labeled:

`EXPLORATORY_DEVELOPMENT_ONLY_NO_INDEPENDENT_CI`

This interval is a descriptive perturbation of **four publicly exposed development groups**, **not** a statistically valid 95% confidence interval for a future population, a p-value, or a preregistered independent evaluation. A score of zero false admissions on four queries is not evidence of production safety.

The phase and signed-real modes are **equivalent mathematical representations** for binary 0/π polarity and must have identical paired outcomes and calibrated thresholds. Standard and full-claim classical retrieval receive exactly the same typed information. A future multidimensional phase algorithm must be compared to an equally expressive real-vector control with matched information and budgets.

## CI and qualification

```bash
npm run test:phmp-sm1-e1d
npm run test:phmp-sm1-e1c
npm run test:research-atlas
npm run build
```

CI uses a *fake injected* localhost transport, pre-authored deterministic eight-component vectors, source-metadata corruption cases, path traversal refusal, no-overwrite tests and CLI acknowledgement rejection. **It never starts Ollama or makes a real network call**. Only an operator-executed command can establish local-model evidence, and a real held-out corpus is still a separate later authorization.

The `#research-atlas` website links to this protocol after merge and successful GitHub Pages deployment, but the public website does not attempt to call a local model, accept private memory or upload reports.

**Ledger Above Ego.**
