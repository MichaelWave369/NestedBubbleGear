# ES-01 E3 | Falsifiability-first Research Question Contracts

**Status: DRAFT / NOT PREREGISTERED / NOT EXECUTED (2026-10-27).**
**NBG experimental authority: NONE.** All ten hypotheses are conceptual questions attached one-to-one to existing ES-01 E0 sources. **Zero** physical, biological, animal or human tests have been conducted for E3.

## Why E3 exists

E0 catalogs evidence, E1 blocks incomparable cross-study rankings, and E2 audits the boundary between published observations and tempting overstatements. E3 asks a different question: **What observation would count against a proposed claim, rather than merely sound consistent with it?** Each entry has a candidate interpretation, a conventional alternative explanation, a high-level discriminating observation, a failure criterion, and missing evidence.

E3 does *not* automatically promote an E0 paper into a new discovery or conclude that hallucinations are causally unnecessary for therapy. Null outcomes, alternative mechanisms, exposure differences, placebo/expectancy, measurement choices, and setting must remain legitimate possibilities.

## Contract

The machine-readable register [`src/es01Hypotheses.json`](../src/es01Hypotheses.json) holds ten frozen-for-review **draft questions**, not preregistered studies. Every entry:
- references exactly one source ID from [E0 evidence](../src/es01Evidence.json) and therefore its E2 claim provenance;
- identifies a **candidate** scientific claim alongside an **alternative**;
- names an observation that could discriminate only given suitable empirical conditions;
- names something that could **count against** the claim, rather than promising confirmation;
- lists missing evidence requirements at a high level (not procedures, dose, synthesis, lab instructions or self-experimentation guidance);
- remains `DRAFT_UNTESTED`, `result: NONE`, and `evidenceAuthority: NONE`.

The UI is an interactive research-question reader. Selecting a question changes what explanation, possible disconfirming evidence, missing information, and original source are shown. The UI does not evaluate the hypothesis against data or assert that required evidence has been collected.

## Scientific interpretation gates

**Preclinical → human:** Neuronal spine growth, rodent fear extinction and head-twitch behavior are not equivalent to validated patient-level antidepressant or PTSD outcomes. Translational claims require genuinely relevant human evidence.

**Molecule identity:** CBD is a distinct cannabinoid, not a chemically edited version of THC. 5-MeO-DMT is not DMT. DFNZ is a synthetic opioid, not an isolated opium alkaloid. R-MDDMA and JRT are analogues; MDA and (2R,6R)-hydroxynorketamine are metabolites within their specified pathways.

**Human evidence differences:** Human MDA-versus-MDMA acute crossover comparisons do not study PTSD treatment. Phase 1 healthy-volunteer hydroxynorketamine observations do not establish depression treatment efficacy. Specific FDA-approved CBD and esketamine indications are not general pharmacological 'effect separation' certificates.

**Clinical safety:** No safe exposure, lack of addiction, lack of dissociation in all humans, or removal of hallucinations is inferred. Any future studies would require ordinary independent ethics, regulatory and scientific oversight.

**NBG role:** NBG offers the conceptual vocabulary of Keyholes, competing hidden-state models, and observational distinguishability. E3 has **no NBG-specific validated drug model or new biological law**.

## Qualification commands

```bash
npm run test:es01-e3
npm run test:es01-e2
npm run test:es01-e1
npm run test:es01
npm run test:research-atlas
npm run build
```

Tests verify referential integrity, universal untested status, distinct alternative/failure fields, and website rendering anchors. They **do not** run a biomedical experiment, establish scientific truth, or count as independent replication.

## Follow-on, not authorized by E3

A future literature-only E4 might structure systematic review quality or registered-report eligibility; it must not silently treat these conceptual drafts as preregistered or independently verified findings.

**Ledger Above Ego.**
