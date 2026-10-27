# ES-01 E5 | Reviewer handoff and portable source packets

**Status: SOFTWARE HANDOFF FEATURE, NOT SCIENTIFIC REVIEW (2026-10-27).**
**Evidence authority: NONE.** **Clinical conclusions: NONE.** **Data collection or new biomedical tests: NONE.**

## Motivation

The E0–E4 layers document published scope, incomparable evidence, source provenance, falsification questions, and uncompleted source-review needs. E5 makes that custody **portable** without upgrading any result. A reviewer may open the NBG Research Atlas, choose one existing ES-01 record, enter *optional* notes for six methods/outcome/replication categories, preview the resulting packet, and export it as **plain JSON**.

The packet composes **immutable source-origin fields** from the existing repository's committed E0 evidence, E1 study context, E2 source-scope audit, E3 hypothesis, and E4 readiness ledger. Separately labeled `reviewerNotes` hold browser-tab text and are always **unverified**. Empty fields remain explicit; filling all six fields does not make a review complete or qualify any biomedical claim.

## Data model

[`src/es01ReviewPacket.js`](../src/es01ReviewPacket.js) produces `ES01-E5-REVIEW-HANDOFF` objects with:

- `source`: original record identity, study tier, title, URL, year, study setting and unaltered original observation.
- `sourceCustody`: E2 source-supported text, not-established inference, original source scope and review state.
- `researchQuestion`: E3 untested question, competing explanation and possible disconfirming observation.
- `readiness`: E4 six pending statuses, missing evidence, confound and **HOLD_REVIEW_INCOMPLETE**.
- `reviewerNotes`: six optional free-text annotations kept separate from published source claims. Notes are text only, at most 4,000 characters per field.
- `intake`: number of nonblank reviewer note fields, **not** percentage completion of research or quality score.
- `decisions`: fixed `claimPromoted:false`, `clinicalEfficacyInferred:false`, `quantitativeComparisonAuthorized:false`.

The packet always says `status:DRAFT_UNVERIFIED`, `evaluationAuthority:NONE`, and `verifiedByIndependentReviewer:false`. A reviewer cannot change those with the interface. JSON export operates locally in the web browser using a download URL; there is **no new server, API, GitHub write, model, third-party upload, or persistent storage**. Notes disappear after reload unless the reviewer downloads the packet.

## Guardrails

- This is **not** a completed systematic review, data-extraction validation, peer review, registration, ethical approval, or confirmation of findings.
- `NOT_EXTRACTED` does **not** mean a paper failed to report the result. `NOT_SEARCHED` does **not** prove there are no replications.
- Regulatory evidence for **Epidiolex** and **Spravato** remains indication-specific. Phase 1 human tolerability is not antidepressant efficacy; an acute MDA/MDMA comparison is not PTSD treatment evidence; mouse head-twitch cannot rule out human hallucinations.
- For any collaborative use, reviewers must verify original source texts and methods independently. Since the JSON allows arbitrary text annotations, do not treat reviewer text as NBG-endorsed findings. Avoid entering private patient or personal health information: exported files belong to the browser user.
- No synthesis, dosing, experimental drug protocols, self-administration recommendations, efficacy prediction, or effect-size ranking is included.
- The E4 source ledger and readiness flags remain unchanged; E5 cannot promote research by editing or exporting metadata.

## Qualification

```bash
npm run test:es01-e5
npm run test:es01-e4
npm run test:es01-e3
npm run test:es01-e2
npm run test:es01-e1
npm run test:es01
npm run test:research-atlas
npm run build
```

The tests check all ten source IDs, E0/E1/E2/E3/E4 lineage integrity, blocked inferences, immutable source references, local browser download wiring and optional note behavior. They do **not** verify external research or make scientific assertions true.

**Ledger Above Ego.**
