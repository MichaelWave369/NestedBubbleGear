# ES-01 E6 | Offline reviewer packet intake and structural custody checks

**Status: SOFTWARE-ONLY INTAKE VALIDATION · NOT SCIENTIFIC VERIFICATION (2026-10-27).**
**Evidence authority: NONE.** **Independent reviewer authentication: NONE.**

## Purpose

E5 creates downloadable JSON drafts. E6 reads those files back locally in the same NBG Research Atlas, checks all protected source-bound fields against the canonical E0–E5 material already compiled in the website, and reports whether the file still follows the E5 schema.

**Crucial limitation:** E5 files are unsigned JSON. An adversary can alter notes or regenerate another valid-looking file. A `STRUCTURE_MATCH_ONLY` result is **not cryptographic integrity, not proof of authorship or completed review, and not confirmation that reviewer statements are true**. Tampering with protected source metadata is detectable relative to the currently deployed NBG source catalogue, but alteration of unsigned notes cannot be authenticated.

## Validation boundaries

The [pure E6 validator](../src/es01PacketIntake.js) checks:

1. Valid JSON object with an E5 source ID that exists in the currently bundled E0–E4 datasets.
2. Six recognized note fields, each plain text of at most 4,000 characters. Unknown fields and malformed values are rejected.
3. Canonical E5 schema keys, product and paper source URLs, E2 claim boundaries, E3 questions, E4 `HOLD_REVIEW_INCOMPLETE` gates and immutable `decisions` flags against a fresh local packet.
4. All E5 sections match the current canonical dataset, except the six reviewer-note text values and dependent note-count metadata, which are recalculated and validated.
5. No `verifiedByIndependentReviewer`, `clinicalEfficacyInferred`, `claimPromoted`, `quantitativeComparisonAuthorized` or `sourceAuthenticityProven` can become true through intake.
6. Local upload limit of **256 KiB** to avoid arbitrary-sized JSON processing in the UI. Nothing gets posted to a server, GitHub, plugin or AI model.

Rejects malformed JSON, altered paper DOI, changed citation statements, modified E4 readiness values, forged 'validated' flags, extra schema fields and inconsistent note counts. It displays the reason for rejection as user-visible errors without presenting imported text as evidence. Local, unverified notes can be inspected separately.

The optional **E6 intake receipt** is a new local JSON download containing status, record ID, discrepancy list and held-evidence flags. By design, receipts do **not** include reviewer note text and **do not authenticate the file or certify a reviewer**.

## Operating instructions

Open Research Atlas > Effect Separation Atlas > **E6 Local Packet Intake**, select an E5 JSON draft (max 256 KiB), read the match/rejection findings, and optionally inspect the unverified notes and download a separate receipt. No installation and no login are needed. Avoid entering protected patient data or personal health information in review notes or source files.

The canonical source library may evolve, so a once-valid old packet may fail the current contract after a documented E0–E5 version upgrade. That is a custody mismatch, **not evidence** the reviewer committed misconduct.

## Exclusions

This is not peer review, clinical research, cryptographic signing, pharmacokinetic modeling, synthetic chemistry, experimental protocols, medical advice, confidence scoring or a system for automatically endorsing or publishing review claims. The **E4 review gate remains HOLD** regardless of outcome. Neither E5 nor E6 mutates published NBG science.

## Qualification

```sh
npm run test:es01-e6
npm run test:es01-e5
npm run test:es01-e4
npm run test:research-atlas
npm run build
```

Software tests cover all 10 sources and adversarial packet alterations. They cannot validate scientific truth, authorship or human clinical efficacy.

**Ledger Above Ego.**
