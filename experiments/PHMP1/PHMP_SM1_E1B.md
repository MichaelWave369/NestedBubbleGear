# PHMP-SM1 E1B | Operator-Approved Local Ollama Embedding Pilot

**State:** Runnable exporter and deterministic mock qualification. No real Ollama run has been executed by this PR or CI. **Origin of committed inputs:** `SIMULATED`. **Authority:** `NONE`. **No claim of phase advantage, new physics, model correctness, or GPU/CPU speed.**

## Why this is E1B

E0 established that representing *explicitly supplied binary polarity* as either a sign or phase cannot itself beat a same-information real-vector comparator. E1A built an offline retrieval evaluator with four baselines (raw cosine, standard polarity-filtered cosine, signed-real cosine and binary-phase coherence).

E1B provides the missing operator-controlled bridge from a **previously installed local Ollama embedding model** to the existing E1A corpus and benchmark. It is not a deployed memory system and never touches SPV, Vessie, TMC, SML, PHMP-3's reserved split, private conversations or the network beyond a fixed loopback Ollama endpoint.

## Safety boundary

- CLI only. No automatically executed model requests in CI, no scheduler, no installation, no weights download, no `ollama pull`, no use of cloud references or API keys.
- The only HTTP target is hard-coded `http://127.0.0.1:11434`. There is **no override** to substitute a remote address, even by environment variable.
- `--inspect`: asks local Ollama for installed model metadata only. `--preflight`: checks an exact model **name and digest**. Neither embeds any text.
- **Embedding happens only with explicit `--execute`**, explicit local input and new output path.
- Every embedding batch is bounded (8 texts per POST), with `truncate:false` and an explicit 90-second response timeout. The exporter checks model metadata **before and after** the run.
- Missing models, aliases not present in `/api/tags`, changed digests, reported zero-sized or cloud-tagged models, bad dimensions, non-finite values and malformed data fail closed.
- The generated corpus is written using **exclusive create** `wx`, mode 0600 where supported, into a user-chosen location. The output is *not* saved during preflight, has no automatic upload and is never read by the CI test.
- The operator's local Ollama installation is trusted for the reported model name, digest, local size and embedding response. This is not a cryptographic attestation that GPU was used, that an embed actually came from the claimed model, or that Ollama itself has no logging. A local service can log request text.
- The fixture contains invented, non-sensitive project statements. **Do not run with private memory, secrets, passwords or real sensitive conversations.**
- Source sidecar metadata is only a self-reported record, not independently verified provenance.
- No embedding score gives anyone authority, permission to execute, or automatic prompt-admission rights.

## Requirements

Node.js 20+ and a local Ollama server, already running at `127.0.0.1:11434`, with a **previously installed embedding-capable model**. If no local embedding model is installed, **stop**; do not substitute a cloud model and do not assume an installed chat model supports `/api/embed`.

These commands work in **Windows PowerShell** from the root of `NestedBubbleGear`:

```powershell
# Model inventory only. Copy the exact name and digest of your local embedding model.
node scripts/phmp_semantic_memory_e1b.mjs --inspect

# Metadata-only preflight. Replace the placeholders with exact values from --inspect.
node scripts/phmp_semantic_memory_e1b.mjs --preflight --model "LOCAL_EMBED_MODEL:TAG" --digest "sha256:ACTUAL_64_HEX_DIGEST"

# Optional: run all local, mock-only qualifications first, without Ollama.
npm run test:phmp-sm1-e1b

# ONLY when you explicitly approve local embedding of the supplied public fixture:
New-Item -ItemType Directory -Force -Path "artifacts/local" | Out-Null
node scripts/phmp_semantic_memory_e1b.mjs --execute --model "LOCAL_EMBED_MODEL:TAG" --digest "sha256:ACTUAL_64_HEX_DIGEST" --input "experiments/PHMP1/fixtures/phmp_sm1_e1b_dev_template.json" --out "artifacts/local/phmp-sm1-e1b-development-corpus.json"

# Once created, run the existing offline E1A four-way comparison.
node scripts/phmp_semantic_memory_e1a.mjs --input "artifacts/local/phmp-sm1-e1b-development-corpus.json" --out "artifacts/local/phmp-sm1-e1b-development-report.json"
```

If the output file exists, the exporter refuses to replace it. Choose a new output path for another trial. The output directory must exist. The `artifacts/local/` directory is ignored by Git in this project after this PR; treat these files as **private local artifacts** nonetheless.

**What the pilot can establish:** whether, for these small pre-authored labels and whatever already-installed local embedding encoder you select, the four scoring variants rank records differently. It can also detect contradictory declared claims and expired records.

**What it cannot establish:** robust general-language understanding; improved hallucination rates; phase beating an equally expressive real embedding; better than vector stores broadly; measured CPU vs GPU usage; or generalization from the hand-authored development data to unseen conversations.

## Frozen development fixture, not a sealed evaluation

File: `experiments/PHMP1/fixtures/phmp_sm1_e1b_dev_template.json`

- 12 synthetic text records, including positive/negative pairs, changing bridge validity intervals, a private scope, dream and simulated origins.
- 13 development questions with pre-authored record IDs as labels; families include negation, time, paraphrase, scope and abstention.
- Claims and polarity are provided manually. **No negation parser or automatic source-truth checker** is implemented. The words `OBSERVED` and `VERIFIED` within a fixture are declared retrieval-gate categories, not independent attestations.
- Query/record vectors are generated **by the same exact installed local encoder** in batches, with `truncate:false`. The source model's reported tag, digest, size, template SHA-256, and vectors enter the output. The local report then records its corpus hash.
- The absence of a relevant record for an `expectedIds: []` query is a deliberate development label. Current scorer has no calibrated "reject all" threshold beyond eligibility; false recall on empty-label questions is reported rather than quietly suppressed.

This dataset is visible, tiny, synthetic and editable. Do not promote its success rates as research validation.

## Research gate after E1B

**E1C** requires a *new* independently annotated corpus, pre-registered task families, disjoint development/held-out queries, one frozen embedding model identity, and a locked comparator set. Run exactly one reserved evaluation after tests and code hashes are frozen. Report recall, conflict/abstention, per-query group uncertainty, source commit, measured wall-clock time and memory usage **from the actual hardware**. Explicitly publish null/tie/negative results.

`phase` and `signed_real` in E1B are still expected to tie mathematically. Any future graded per-dimension complex-phase policy must face its strongest same-information real-vector analogue, with exactly the same metadata and source access.

**Ledger Above Ego.**
