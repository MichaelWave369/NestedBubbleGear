# ES-01 E1 | Evidence Comparison Gate: Protocol and Interpretation

**Status: PREPARED / literature metadata gate only (2026-10-27).** The software checks whether a *comparison claim* has adequate common study context. No NBG biological experiment, drug-design procedure, clinical study, causal identification, potency prediction, or medicinal efficacy finding occurred.

## Goal
A user can view two ES-01 records and learn why they **cannot safely infer** that molecule A is more effective, less toxic or non-hallucinogenic in humans based solely on unrelated published endpoints. This is a conservative methodological gate, not a discovery system.

## Source custody
The E0 [source-linked registry](../src/es01Evidence.json) anchors primary articles and regulatory records for all eight research families. E1 adds explicit, **manually curated** context: each of the 10 entries has a recorded study setting, broad endpoint-domain labels and a boolean saying whether that source supports an established human *indication*. This boolean is true for *Epidiolex in its labeled epilepsy indications* and *Spravato in its labeled depression indications*, **not** for 'effect-free variants' of THC or ketamine.

High-priority primary records checked for bibliographic identity and study scope:
- LSD/JRT: 2025 PNAS https://doi.org/10.1073/pnas.2416106122 (animal and cellular observations; no demonstrated human treatment).
- 5-MeO-DMT analogue: 2024 Nature https://doi.org/10.1038/s41586-024-07403-2 (rodent behavioral proxy, not verified human subjective experience).
- Psilocybin L5 pyramidal neurons: 2026 Nature Neuroscience https://doi.org/10.1038/s41593-026-02490-y (head twitch is a proxy, not human hallucination).
- R-MDDMA: 2026 ACS Chemical Neuroscience https://doi.org/10.1021/acschemneuro.5c00891 (preclinical).
- MDA vs MDMA: published online 2025, 2026 issue, Neuropsychopharmacology https://doi.org/10.1038/s41386-025-02248-3 (23 healthy volunteers, *acute* pharmacology; not PTSD treatment efficacy).
- MDMA→MDA exposure variation: 2016 https://doi.org/10.1097/FPC.0000000000000231 (139 participants from pooled studies; CYP2D6 metabolism difference does not prove causal therapeutic selectivity).
- Ketamine→(2R,6R)-hydroxynorketamine: 2024 Phase 1 https://doi.org/10.1002/cpt.3391 (healthy-volunteer tolerability, no patient efficacy).
- DFNZ: 2026 Nature https://doi.org/10.1038/s41586-026-10299-9 (rodents, some reinforcement; nitazenes remain high-risk synthetic opioids).
- Purified CBD indication: https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd (FDA approval is indication-specific, not evidence that cannabidiol is 'THC without the high').
- Esketamine regulatory comparator: FDA prescribing information documents monitored administration, dissociation and other warnings. https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/211243s016lbl.pdf

## Predeclared gate rules
1. Same record selected twice: display **SAME_RECORD** and reject any claim of independent confirmation.
2. Two different records: **CONTEXT_ONLY**, no standardized effect size, potency ranking, human safety ranking, or causal separation score. Different primary publications do not supply a head-to-head causal contrast.
3. Report study setting for both, source links, and independent caveats for differences in: primary source, evidence tier, substance family, coarse endpoint-domain overlap, and established human indication.
4. Shared endpoint labels such as 'plasticity' or 'dissociation' only signal *topic overlap*, not identical scales, species, treatments, protocols, or timing.
5. The 'next measurement' is a *high-level methodological standard*: matched populations, exposure and readouts in a pre-specified appropriately controlled study. Never generate dosing, synthesis, bioassay recipes, self-experiment instructions or efficacy promises.
6. Preserve the distinction between a human regulatory **clinical indication** and an experimental scientific claim that removing intoxication preserves beneficial effects. Do not label the former as proof of the latter.

## Representative comparisons
- **R-MDDMA vs MDA**: different sources and evidence tiers (preclinical vs human acute effects). **No** claim that R-MDDMA is a safer PTSD treatment; MDA's human acute-effects trial is not a treatment trial.
- **JRT vs psilocybin circuit data**: related plasticity questions and rodent results, but neither establishes a universal serotonin-plasticity tradeoff nor an effect-size ranking.
- **Hydroxynorketamine vs esketamine**: human Phase 1 healthy-volunteer tolerability compared against FDA-labeled efficacy/risk evidence; **not** a validated demonstration that equal antidepressant benefit comes with less dissociation.
- **CBD vs DFNZ**: dissimilar indications, mechanisms and settings; **no** clinically meaningful comparison of analgesia, addiction risk or intoxication.

## Tests and limits
```sh
npm run test:es01-e1
npm run test:es01
npm run test:research-atlas
npm run build
```

The test suite qualifies: full record-context coverage; conservative output for every unique pair; self-comparison safeguards; text/UI wiring; regulatory-label specificity; and source paths. It **does not** independently replicate the papers, check live links, infer causal mechanisms, or certify clinical evidence.

**Ledger Above Ego.**
