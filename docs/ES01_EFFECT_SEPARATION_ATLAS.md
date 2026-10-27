# ES-01 | Effect Separation Atlas (v0.1.0 E0)

**Status:** PROPOSED / LITERATURE REVIEW. **Evidence:** SOURCE-ATTRIBUTED. **NBG empirical authority:** NONE. Updated 2026-10-27.

## Research question
Can desired therapeutic endpoints and unwanted effects be *empirically distinguished* for related bioactive compounds, metabolites, cellular targets, or observation windows? If so, what experiments or observations establish that distinction, and what is still unmeasured?

This is a cross-family **evidence index**, **not** a drug-design recipe, chemical synthesis plan, pharmacological equivalence claim, medical advice, or validation of novel NBG biology. NBG supplies an explicit observability vocabulary only. No molecular design, synthesis, animal studies, clinical investigations, or medicinal product development were performed by this project.

## Scope
Eight starting families: LSD; cannabis/cannabinoids; opioids (including but not limited to plant-derived opium alkaloids); psilocybin; DMT/5-MeO-DMT; MDMA; MDA; ketamine. Track mixtures and constituent molecules separately. DMT and 5-MeO-DMT are **different substances**. DFNZ is a **synthetic nitazene**, not an opium constituent. JRT and R-MDDMA are **analogues**, not established metabolites. MDA is both a related drug and an **MDMA metabolite**; (2R,6R)-hydroxynorketamine is a ketamine metabolite. CBD is not THC with the high chemically removed.

Each entry records: source, study design, family/compound/comparator, structural or metabolic relationship, candidate mechanistic Keyhole, desired and undesired endpoint, observed finding, and **unresolved boundary**. The complete machine-readable and UI-linked registry is [src/es01Evidence.json](../src/es01Evidence.json); the React explorer is [src/ES01Explorer.jsx](../src/ES01Explorer.jsx).

## Evidence interpretation / no promotion by analogy
- **Regulatory:** Only an individual product's approved *labeled indication* is established (e.g. purified CBD/Epidiolex); this does not establish the proposed separation for THC or cannabis in general.
- **Human safety:** Healthy-volunteer safety/PK studies, such as hydroxynorketamine Phase 1, **do not** show patient benefit.
- **Human comparison:** Acute crossover pharmacology, such as MDA vs MDMA, **does not** show therapeutic efficacy.
- **Preclinical:** Cells and rodents are not human clinical evidence; rodent head twitch is an imperfect surrogate, **not** a measurement of human hallucinations.
- A desired **proxy** (spine growth, rodent fear extinction, antidepressant-like behavior) is **not** an interchangeable measure of real-world human recovery. Distinct observed endpoints are not automatically independent underlying mechanisms.
- Some subjective experiences, therapeutic setting, and psychological intervention may contribute to outcomes. We do not assume reducing *all* psychoactivity preserves efficacy.
- No record carries dosage, synthesis instructions, experimental bioassay procedures, or recommendations to self-administer compounds.

## NBG observability bridge: E0 only
**Bubble / compartment:** compound exposure, metabolism, target tissue, neural circuit, observed behavior, clinician-reported endpoint. **Gear / coupling:** transport, receptor signaling, neuronal plasticity, psychological context, physiological adverse effects. **Keyhole:** an explicitly defined readout at a stated biological scale and time. **Altermath / distinguishability:** two proposed histories may be indistinguishable at one coarse endpoint but distinguishable after additional measurements, *conditional on accessible data*. These are conceptual annotations of ordinary biology, not an observed new law.

### Pre-registered question for a future E1 (not executed)
A coarse observer might label both MDMA and R-MDDMA “plasticity-promoting.” A richer observer with published readouts for monoamine efflux, thermoregulation, fear extinction, and controlled follow-up might distinguish them. Competing explanations include pharmacokinetics, dose/exposure mismatch, different target engagement, assay sensitivity, and species differences. **No matched-data quantitative test is reported here.**

## Linked source anchors (primary literature / regulator)
- JRT (2025), PNAS: https://doi.org/10.1073/pnas.2416106122
- Purified CBD (FDA): https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd
- DFNZ (2026), Nature: https://doi.org/10.1038/s41586-026-10299-9 (rodents; some reinforcing effects)
- Psilocybin layer-5 cell-type split (2026), Nature Neuroscience: https://doi.org/10.1038/s41593-026-02490-y (mouse head twitch proxy)
- 5-MeO-DMT selective analogue (2024), Nature: https://doi.org/10.1038/s41586-024-07403-2
- R-MDDMA (2026), ACS Chemical Neuroscience: https://doi.org/10.1021/acschemneuro.5c00891
- Human MDA vs MDMA crossover (2025), PubMed: https://pubmed.ncbi.nlm.nih.gov/40999236/
- Human MDMA/MDA metabolic exposure (2016), PubMed: https://pubmed.ncbi.nlm.nih.gov/27253829/
- (2R,6R)-HNK Phase 1 (2024), CPT: https://doi.org/10.1002/cpt.3391
- Esketamine regulatory comparator: https://www.fda.gov/consumers/womens-health-topics/depression-medicines

## Existing ecosystem links
- [Cannabiverse](https://github.com/MichaelWave369/Cannabiverse): specialist cannabis education and documentation; cross-reference candidate, no repo modifications in ES-01 E0.
- [Cannabis as Sacred Medicine](https://github.com/MichaelWave369/cannabis-as-sacred-medicine): separately maintained research and cultural material, not interchangeable with clinical approval or medical evidence.
- [Research Atlas](RESEARCH_ATLAS.md): public source-linked index, not a new clinical certification pipeline.

## Qualification
```sh
npm run test:es01
npm run test:research-atlas
npm run build
```
Do not merge claims into *validated human therapy* solely because checks pass. Tests cover local schema, links, documentation boundaries and UI wiring; they cannot verify scientific truth or that external URLs remain accessible.

**Ledger Above Ego.**
