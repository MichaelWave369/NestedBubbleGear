# PHMP-SM1 E0 | Typed Semantic Phase Memory, the baseline that matters

**Status:** executable synthetic-only research / no deployment, learned embedding, or independent semantic validation. **Origin:** `SIMULATED`. **Authority:** `NONE`. **NBG-specific improvement:** `NOT CLAIMED`.

## Why this belongs in the existing NBG track

PHMP-1 has already investigated complex phase and delayed observability; PHMP-3 investigates bounded causal memory and ties an exact classical baseline; Optical Keyholes O1/O2 analyze when relative phase can be observed. This new **independent** E0 thread asks whether phase-aware retrieval provides a genuine **retrieval advantage once the same contextual information is given to conventional baselines**. It does not edit or score PHMP-3's reserved evaluation split and does not change any frozen work.

## Scope and reproducibility

```bash
node scripts/test_phmp_semantic_memory_e0.mjs
node scripts/test_phmp_semantic_memory_e0.mjs --out /tmp/phmp-sm1-e0.json
```

The second command exclusively creates a new receipt file; it refuses overwriting existing outputs. Node.js 20+ built-ins only, no npm install, network, machine learning, private data, or database service.

Two modules:
- `scripts/phmp_semantic_memory_e0.mjs`: original, auditable typed-claim encoding, plain/signed-real/phase ranking, temporal/provenance/scope filters, conflict state, SHA-256 receipt.
- `scripts/test_phmp_semantic_memory_e0.mjs`: 12 synthetic paired claims and negative controls.

## Conceptual specification

A memory has explicitly structured `subject, predicate, object, polarity (+1/-1)`, identity, validity range, scope, declared provenance origin, source ID and authority. Provenance origin is **not** an evidence verification, and authority does not follow from origin. E0 does not parse a sentence or infer the correct sign: an upstream system must provide and validate that context.

E0 hashes fixed weighted subject/predicate/object features into a 96-dimensional magnitude vector, and assigns phase 0 or pi based on **explicit supplied polarity**. It does not use pretrained embeddings, and hash collisions are possible. There is no claim that the feature hash is a realistic semantic encoder.

Three ranking modes receive identical *amplitudes* but differ in accessible contextual information:

1. `plain`: unsigned cosine, deliberately blind to polarity;
2. `signed-real`: ordinary real-vector cosine with explicit signed polarity;
3. `phase`: classical complex phase-coherence real part, with the same signed polarity.

All modes share the same record input and eligibility gates. Importantly, mode 1 **does not** receive a polarity feature, while modes 2 and 3 do; any improvement against it is not a same-information superiority claim.

The signed-real and phase scores are expected to tie. More generally, the real part of a complex inner product on `d` complex coordinates is exactly a real dot product on `2d` real coordinates after expansion into cosine and sine components. A property test directly checks this equivalence for nontrivial phases. Phase is a representation choice, not inherently an extra source of meaning.

## Governance rules

- Filter exact scope, validity interval (`validFrom` inclusive, `validTo` exclusive), and permitted provenance origin **before ranking**.
- `DREAMED`/`SIMULATED` are *not* part of the default evidence-origin allowlist. They can be explicitly included for exploratory, non-authoritative retrieval.
- Both + and - assertions active for the same exact claim in a permitted evidence window produce `CONFLICT`. No winner is inferred from score alone.
- No non-matching or inaccessible record can be promoted into authority. E0 returns `CANDIDATES_ONLY`, `CONFLICT` or `INSUFFICIENT`, never `TRUTH`.
- Canonical output records hashes of eligible records and claim, fixed-precision scores, and SHA-256 receipt. The hash detects *accidental or deliberate mutation of that receipt*, but it is **not** a digital signature or independent source attestation.
- Storage remains in memory during the test. No agent, cloud access, network listener, or auto-write path exists.

## Local E0 results (synthetic fixtures)

| Mode | Correct first record / 24 signed queries | Interpretation |
| --- | ---: | --- |
| Unsigned cosine | 12/24 | Expected tie ambiguity because sign was omitted |
| Signed-real cosine | 24/24 | Sign information supplied explicitly |
| Phase coherence | 24/24 | Same sign information; ties signed-real by construction |

Additional tests check invalid dates, duplicate identifiers, illegal origin values, provenance and scope isolation, two disjoint temporal windows, explicit conflict detection, receipt determinism/integrity, and the generalized complex/real identity.

**This establishes no improvement over a sign-aware conventional vector store**, no general language understanding, no quantum computing, no NBG-specific mathematical result, and no retrieval speed or scale claim. Runtime is an in-memory linear scan of 24 records, not a database benchmark.

## Next research stages (not authorized by E0)

- **E1:** compare with actual *fixed* local embeddings from Ollama or a supplied sentence encoder, with held-out human-labeled negation, temporal change, compositional scope, and paraphrase data. Preserve a sign-aware real baseline and a structured metadata baseline. Measure recall@k, nDCG, calibration, conflicts, false recalls, CPU latency, memory, and storage.
- **E2:** design a local TMC / SML read-only adapter. Data never passes to SPV prompt admission automatically. Any persistent storage or prompt admission remains a separate explicit governance decision.
- **E3:** pre-register prospective claim/phase encoding rules, maintain distinct validation and one-shot held-out evaluation, and audit source/commit hashes. Reject the hypothesis if the classical, same-information baseline ties or wins.

This E0 is independently implemented using standard algebra and original source, not copied from ResonanceDB. Evaluate all third-party licensing and IP constraints before any separate integration.

**Ledger Above Ego.**
