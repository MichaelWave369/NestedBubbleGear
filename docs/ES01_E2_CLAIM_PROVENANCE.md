# ES-01 E2 | Claim provenance and source-scope custody

**Status:** EDITORIAL SOURCE-SCOPE REVIEW · 2026-10-27. **NBG experimental authority:** NONE. **Independent replication:** NOT PERFORMED.

## Question

For each published observation in the [E0 literature registry](../src/es01Evidence.json), what does the named source actually support, what study population or setting produced the observation, and what tempting inference **must not** be made?

The machine-readable ledger is [`src/es01ClaimAudit.json`](../src/es01ClaimAudit.json). Its 10 entries cover all eight registered families. A source-scope audit is **not** a full-text reproducibility audit or scientific validation. It does not indicate that NBG has generated new biomedical evidence.

## Rules

1. **Exact source binding.** An E2 audit row must point to a unique E0 record ID, repeat its original source URL exactly, and declare its study setting.
2. **Support versus inference.** Each audit records a concise, paraphrased source-supported result and an explicit non-established claim.
3. **Methods first.** Evidence based on cells or rodents remains preclinical. Human Phase 1 tolerability is not demonstrated efficacy. Acute healthy-volunteer pharmacology is not a therapy trial.
4. **Label specificity.** FDA approval attaches to a **named approved product and indication**, not to the whole plant class or to a proposed non-intoxicating analogue.
5. **Read limits.** 'SCOPE_CHECKED_NOT_REPLICATED' means manual inspection of publicly available abstracts, article summaries, or FDA/regulatory pages. It is not peer review, independent replication, a live URL health check, confirmation of every method, or a claim of safety.
6. **No recipes.** No synthesis, dosing, self-medication, pharmacological optimization, animal testing procedures, or unsupported predictions.
7. **Evidence promotion is blocked.** Nothing from this E2 ledger changes E0's preclinical/human/regulatory evidence tiers. A passed unit test proves metadata integrity only.

## Selected cross-checks

- JRT/LSD analogue: PNAS 2025, DOI [10.1073/pnas.2416106122](https://doi.org/10.1073/pnas.2416106122). Preclinical spinogenesis/behavior; not verified human treatment.
- MDMA analogue R-MDDMA: ACS Chemical Neuroscience 2026, DOI [10.1021/acschemneuro.5c00891](https://doi.org/10.1021/acschemneuro.5c00891). Cortical neurons and mice; no clinical safety or PTSD efficacy claims.
- Psilocybin L5 circuit: Nature Neuroscience 2026, DOI [10.1038/s41593-026-02490-y](https://doi.org/10.1038/s41593-026-02490-y). Head twitch is a mouse surrogate, not direct human hallucination measurement.
- MDA versus MDMA: Neuropsychopharmacology published September 25, 2025 (2026 issue), DOI [10.1038/s41386-025-02248-3](https://doi.org/10.1038/s41386-025-02248-3). A controlled **23-person acute-effects trial**, not a PTSD outcome trial.
- MDMA metabolism to MDA: Pharmacogenetics and Genomics 2016, DOI [10.1097/FPC.0000000000000231](https://doi.org/10.1097/FPC.0000000000000231). A pooled analysis of **139 participants** examining exposure and short-term effects, not improved therapy.
- Ketamine metabolite (2R,6R)-HNK: Clinical Pharmacology & Therapeutics 2024, DOI [10.1002/cpt.3391](https://doi.org/10.1002/cpt.3391). Phase 1 safety/tolerability, not antidepressant benefit.
- Synthetic opioid DFNZ: Nature 2026, DOI [10.1038/s41586-026-10299-9](https://doi.org/10.1038/s41586-026-10299-9). Rodents and receptor assays; some reinforcement remained.
- 5-MeO-DMT analogue: Nature 2024, DOI [10.1038/s41586-024-07403-2](https://doi.org/10.1038/s41586-024-07403-2). Tested rodent responses do not demonstrate non-hallucinogenic effects in humans.
- Epidiolex: [FDA cannabis/CBD products FAQ](https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd). Named prescription purified CBD, certain seizure indications; this is not THC with intoxication removed.
- Spravato: [current DailyMed prescription labeling](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d81a6a79-a74a-44b7-822c-0dfa3036eaed). Known dissociation and sedation warnings persist.

## UI

Each existing E0 study card now has an expandable **Claim provenance / E2** section showing source type, recorded study setting, source-supported summary, explicitly unsupported inference, and an independent link to its original source. This avoids adding a duplicate evidence library and keeps E1 comparison gates unchanged.

## Qualification

```sh
npm run test:es01-e2
npm run test:es01-e1
npm run test:es01
npm run test:research-atlas
npm run build
```

The tests assert coverage, exact source-url matching, uniqueness, caution fields, and website wiring. They do **not** validate pharmacological mechanisms, source truth or therapeutic efficacy.

**Ledger Above Ego.**
