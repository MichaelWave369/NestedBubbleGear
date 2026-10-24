# PHMP-SM1 E1E | One-click, GitHub-hosted REAL embedding pilot

**State on opening this PR:** code and mock-only CI qualification. **No claim yet of a real hosted-model execution.** Once merged, the single operator-approved Action can run public test statements against a small pretrained embedding model on a **temporary GitHub runner**. Nothing is installed, downloaded or cloned on the user's computer.

## The problem this solves

E1D provides operator-run local Ollama measurements, but many contributors work directly on GitHub and never have the repo locally. E1E preserves that workflow: **GitHub Actions runs the model on GitHub**, produces a downloadable summary, and discards the temporary computer/model installation when the run finishes. The source repo and the live React GitHub Pages site remain read-only.

This is *not* a backend reachable from the React website and does *not* interact with anyone's private memories.

## Click-only instructions, after merge

1. Open [NestedBubbleGear Actions](https://github.com/MichaelWave369/NestedBubbleGear/actions).
2. Select **PHMP-SM1 E1E Hosted Embedding Pilot** in the left workflow list.
3. Choose **Run workflow** and keep the branch as **main**.
4. Check **acknowledge_public_model_download**. This approves downloading public, fixed-revision pretrained model files **only onto GitHub's ephemeral runner** and embedding the 25 synthetic statements in the repository. Leave unchecked to refuse the operation.
5. Click **Run workflow**, open the new run, and inspect the job results. Under its **Artifacts** section, download `phmp-sm1-e1e-public-development-summary`. The artifact contains **one JSON summary** (not raw vectors, not input texts, not model weights).
6. The downloaded JSON can be shared for analysis if desired; it includes only public fixture IDs, model provenance, timings, scores, and hashes. Anyone with access to the Actions run may be able to access the artifact; no sensitive data belongs in this pilot.

GitHub Actions quota and network access apply. If a model download or package installation fails, the workflow reports failure rather than fabricating a result. No GitHub secrets, paid inference API account, Ollama installation or local repository clone is needed.

## Fixed model and hosting provenance

- Provider / model: [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2), **Apache 2.0**; exact published model git revision `751bff37182d3f1213fa05d7196b954e230abad9`.
- Inference library: `@huggingface/transformers@3.8.1`, installed on the ephemeral runner only.
- Model inference request: `pipeline('feature-extraction', MODEL_ID, {revision: MODEL_REVISION, dtype: 'q8', device:'cpu'})`; mean-pooled and normalized vectors for each public record/query.
- Inputs: exactly the existing E1B `phmp_sm1_e1b_dev_template.json` (12 records + 13 questions) plus the existing E1C subject-disjoint `phmp_sm1_e1c_development_split.json`. No GitHub issue comments, user files, repository secrets, arbitrary input URLs, or personal conversations are fed to the encoder.
- Output: E1A/E1C retrieval/admission analyses and E1D's paired subject-level comparisons; new `OPERATOR_SUPPLIED_HOSTED` provenance label **distinct from** E1B/E1D's `OPERATOR_SUPPLIED_LOCAL`.
- Integrity: result includes exact model repository revision, npm engine version, fixture/split/corpus hashes, nested scoring receipts and operator-triggering Git commit. Hashes support input identity but do not independently attest model weights, external repo security, inference hardware or source factual correctness.

The Actions workflow is **workflow_dispatch only**, read-only `contents: read`, permission-gated on `main` plus affirmative acknowledgement, and time-bounded. Model packages/weights are fetched from public upstream endpoints by GitHub's runner. The output is stored as a GitHub Actions artifact for seven days; it is **not automatically posted to GitHub Pages** or committed back to the repo.

## Claims and controls

The E1A, E1C and E1D evaluators already compare raw cosine, polarity-aware metadata filtering, signed real cosine, binary complex phase, and ordinary full exact-claim filtering. Every comparator has the same structured polarity/scope/time/origin data. **Binary phase and signed real scores are mathematically identical** for the explicitly supplied binary polarity, so a tie is required.

A real, off-the-shelf embedder running on 25 synthetic, publicly exposed statements provides much stronger pipeline qualification than hand-authored vectors, but **not**:
- a fresh independent held-out benchmark or fair proof of improved general recall;
- evidence that phase is superior to equally expressive real embeddings;
- proof of source truth, real-world time validity, biological resonance or quantum memory;
- permission to admit a similarity-ranked candidate to an agent's prompt;
- independent measurement of GPU utilization, energy use, or user hardware.

E1C can respond `CONFLICT_DEFER`, `CLAIM_MISMATCH_DEFER`, `LOW_SCORE_DEFER`, or `INSUFFICIENT` rather than promoting unsupported content. Its threshold is fitted on public development labels only. The subject bootstrap over four groups is **exploratory**, not a valid estimate of real-world confidence.

A real held-out corpus and trusted provenance review would still be required before shipping as a memory engine.

## Mock qualification on normal PR/CI

```bash
npm run test:phmp-sm1-e1e
```

All standard tests inject a small fake tensor-producing encoder. **Normal PR and push CI do not import the inference package or download model weights.** Only the separately named manual workflow installs the fixed embedding engine on an ephemeral runner.

**Ledger Above Ego.**
