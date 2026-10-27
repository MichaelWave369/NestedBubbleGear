# ES-01 E7 | Local reviewer note difference mapping

**Status: SOFTWARE DIFFERENCE MAP · 2026-10-27. NOT AN INDEPENDENT REVIEW OR SCIENTIFIC CONSENSUS.**

## Research need

E5 exports a draft reviewer packet. E6 imports and checks the structure of one unsigned packet. **E7 compares two E5 packets for the same source** after each passes E6 local source-custody checks. It shows six categories of literal note differences, not independently verified *reviewer disagreements*. The two inputs may have been written or copied by the same person.

Nothing is uploaded, saved remotely, signed, scored for scientific merit or written to E0–E6 source records.

## Immutable gates

E7 [pure comparison model](../src/es01ReviewerDifference.js) verifies both packets through the existing E6 function, rejects any altered source-bound section, and rejects two different E0 source IDs. Comparisons are limited to the six optional E5 note fields:

- **BOTH_BLANK:** neither has a note.
- **ONLY_A_HAS_TEXT:** A has text, B is blank.
- **ONLY_B_HAS_TEXT:** B has text, A is blank.
- **EXACT_TEXT_MATCH:** identical characters, which **does not** demonstrate independent agreement or validation.
- **TEXT_DIFFERS:** different characters, which **does not** establish substantive scientific disagreement or decide who is correct.

No natural-language inference, embeddings, AI model, semantic agreement score, safety calculation, biomedical effect-size estimate or source-truth certification is performed.

All E7 results preserve `evidenceAuthority: NONE`, `reviewerIndependenceVerified: false`, `semanticAgreementEvaluated: false` and `gate: HOLD_REVIEW_INCOMPLETE`. A valid structural match means the canonical public-source **metadata** survived, not that unsigned reviewer note text is authentic. A duplicate file is accepted as two structurally compatible files but expressly flagged as **not evidence of independent agreement**.

## Workflow on GitHub Pages

1. Use the existing E5 browser tool to export two JSON drafts (different researchers may create these, but E7 does not check their identities).
2. In Research Atlas > Effect Separation Atlas > E7 Local Difference Map, select exactly **two files**, no more than **256 KiB** each.
3. Read the outcome labels for six note fields; expand side-by-side raw notes if useful.
4. Optionally download a **note-free receipt** with only the field-status labels and held-inference flags.

The receipt has no source note content, no reviewer identity, no signature, and no independent-review certification. E7 accepts no patient data uploads or network submission; users should still avoid placing sensitive or identifying patient information in local review packets.

## Safety and interpretation

- A perfect text match may mean copied content, not consensus.
- Different notes may describe compatible ideas using different wording.
- A reviewer can still make false statements in a structurally valid draft.
- NBG does not change any existing E4 screening fields, evidence tier or medical claim based on E7 output.
- A real independent review or biomedical study requires separate human scientific oversight, source verification and relevant ethical/regulatory controls.
- No synthesis, dosage, self-experimentation, drug optimization or clinical guidance is provided.

## Qualification

```sh
npm run test:es01-e7
npm run test:es01-e6
npm run test:es01-e5
npm run test:research-atlas
npm run build
```

Tests inspect all ten E0 sources, matching/blank/different note classifications, adversarial altered-source packets, different-source rejection, and note-free receipts. They establish only software behavior, never scientific consensus.

**Ledger Above Ego.**
