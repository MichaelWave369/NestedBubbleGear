# ES-01 E8 | Open-question reconciliation queue

**Status: SOFTWARE-ONLY REVIEW WORKFLOW, DRAFT AND UNVERIFIED (2026-10-27).**
**No independent reviewer authentication, peer review, adjudication or clinical evidence is claimed.**

## What E8 adds

E7 records literal text matches and differences between two E5 draft packets. E8 offers a next-action **queue** for the six domains without treating text similarity as scientific agreement. Reviewers can record a planned check and an open question for a future human researcher. It is not a panel that decides whose biological interpretation is correct.

In the NBG Research Atlas, the E8 interface accepts **exactly two JSON packets** (maximum 256 KiB each) and reruns E7/E6 source-chain checks. Packets must refer to the same E0 study and preserve canonical E0–E4 metadata. Otherwise E8 rejects the pair.

For each of the six fields, the user can choose one documentary next action: `NOT_SELECTED`, `CHECK_PRIMARY_SOURCE`, `CLARIFY_ENDPOINT`, `CHECK_COMPARABILITY`, or `REQUEST_INDEPENDENT_REVIEW`. The optional open question is plain text of at most 1,200 characters. E8 never imports its own textual conclusions into a source or research registry.

## Export

The browser-local [E8 model](../src/es01FollowupQueue.js) constructs `ES01-E8-OPEN-QUESTIONS-QUEUE` JSON with canonical source ID/title/URL, the six E7 comparison states, six optional actions, six draft questions, and explicit limitations.

No original reviewer note text is copied into the E8 export. **Newly written open questions do appear in the downloaded JSON**, so they must not contain private patient data, identifying information or other sensitive material. The tool has no remote upload, browser storage, GitHub write or third-party connector.

The queue always retains:

- `status: DRAFT_UNVERIFIED`
- `assessment: UNRESOLVED_NOT_EVALUATED` for every field
- `independentReviewerIdentityVerified: false`
- `scientificClaimsEvaluated: false`
- `adjudicationCompleted: false`
- `biomedicalFindingsConfirmed: false`
- `gate: HOLD_REVIEW_INCOMPLETE`
- `evidenceAuthority: NONE`

Progress counts describe **number of text fields filled or actions selected**, not research progress, strength of evidence, consensus, effect separation, therapeutic safety or efficacy. No approval state is implemented.

## Limits and threats

E5 JSON is unsigned and may be copied or edited. E6 validates schema and public-source metadata but does not authenticate reviewers or their words. E7 compares **characters**, not semantic meaning, study design, mechanisms or biomedical results. E8's questions can be wrong, biased, incomplete or malicious because they are user-entered drafts.

E4 stays on hold until genuine independent review and relevant scientific evidence exists. A future institutional review or empirical study requires separate ethics and regulatory oversight; E8 does not authorize laboratory drug design, synthesis, dosing, self-experimentation, medical claims or treatment.

## Test contract

```sh
npm run test:es01-e8
npm run test:es01-e7
npm run test:es01-e6
npm run test:research-atlas
npm run build
```

The tests assert rejection of altered/different-study packets, strict field/action constraints, 10-source coverage, note-text exclusion, and no ability to certify results. They test software invariants, not biomedical facts.

**Ledger Above Ego.**
