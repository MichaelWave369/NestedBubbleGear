# CO-01 | Metabolite-Gated Intracellular Drug Synthesis

**NBG status:** PROPOSED E0 literature-anchored causal-observability mapping (2026-10-26).
**Primary-paper status:** Peer-reviewed, source-attributed **cell-line results**, not validated cancer treatment.
**Empirical authority of NBG mapping:** NONE. No NBG biological prediction, animal model, clinical trial, or treatment protocol is claimed.

## Primary reference and scope

Kawai, M., Chang, T.-C., Pradipta, A. R. & Tanaka, K. (2026). *Harnessing endogenous carbon monoxide for cancer-selective drug synthesis*. Nature Communications **17**, 9603. Published 2026-09-17. https://doi.org/10.1038/s41467-026-77616-8

The paper reports an albumin-palladacycle-complex (APC) system. Albumin binds and protects the palladium complex from intracellular thiol-mediated deactivation. Endogenous carbon monoxide (CO), associated with heme oxygenase-1 (HO-1) activity, is incorporated as a **carbonyl building block** in a chemical reaction that can produce a phenanthridinone drug inside cells. This is not CO 'poisoning' cancer, and normal cells also produce endogenous CO.

## Reported measurements (primary source, not NBG experiments)

| Paper assay | Published observation | Important limit |
| --- | --- | --- |
| APC-9 reporter, 48 h | Product 10 per million cells: HepG2 liver 77 pmol; HeLa S3 cervical 59; MCF7 breast 92; A549 lung 136; normal TIG3 fibroblasts 15. | A tested normal cell line is not zero activation and is not a survey of all healthy tissues. |
| APC-17 therapeutic precursor | Drug 14 formation detected by HPLC-MS in HepG2 cells; estimated intracellular concentration ~36.4 nM. | Intracellular product detection is not evidence of safe or effective therapy. |
| MTS cytotoxicity | APC-17 IC50: 13.99 μM in HepG2; 37.54 μM in TIG3, approximately 2.7-fold separation. | Modest cell-line selectivity, not an in vivo therapeutic index. |
| Mechanistic perturbation | ZnPPIX (10 μM), used to inhibit HO-1 activity, increased HepG2 IC50 to 34.18 μM; CO preactivation made APC-17 more toxic in TIG3 (IC50 14.79 μM). | Perturbations support CO dependence, not perfect mechanistic identification or absence of off-target effects. |
| Colony assay | MCF7 colony formation was reduced by APC-17 at 5 and 10 μM over 12 days. | In vitro colony formation, not tumor regression. |
| Ex vivo mouse-blood check | APC-9 produced no detectable reporter product in whole mouse blood over 4 hours under the study conditions. | Ex vivo stability for a reporter is not systemic pharmacokinetics or an animal efficacy/safety test for APC-17. |

The authors themselves describe the observed cytotoxicity as **modest**. **Clinical boundary: this is not a cancer therapy.** Nothing in this record supports use in people, homemade administration, or exposure to CO, palladium complexes, or chemical precursors.

## The NBG bridge: a proposed causal Keyhole, not a new biochemical discovery

CO-01 asks whether a compact observational Keyhole can distinguish *why* a locally synthesized product appeared. Map the existing biochemical system to the NBG vocabulary without treating the vocabulary as an independently demonstrated mechanism:

- **Bubbles (compartments):** extracellular medium / blood, albumin carrier, cell interior, catalytic microenvironment, measured drug product, viability assay.
- **Interfaces/transports:** albumin-associated cellular uptake; substrate/catalyst availability; CO flux generated through cellular heme metabolism; intracellular reaction and product clearance.
- **Gears (coupled processes):** HO-1-dependent CO flux, catalyst accessibility/protection, carbonylation rate, product accumulation and downstream cell response. These are ordinary chemical/biological feedback and reaction pathways.
- **Keyholes:** K0 = final reporter product or viability; K1 = CO and HO-1 readouts plus uptake/catalyst localization; K2 = mechanistic inhibitor/CO-rescue controls; K3 = different normal/cancer tissues, exposure over time and in vivo distribution, **future work only**.
- **Altermath / distinguishability:** two possible hidden causal trajectories may give the same endpoint viability or reporter concentration. Their difference is a conditional mathematical possibility until a specified, experimentally admissible intervention separates their future readouts.

An illustrative *proposed model family* (NOT a fit to the paper) is:

```text
CO(t+dt) = CO(t) + dt * [J_HO1(t) - k_loss*CO(t) - v_rxn(t)]
v_rxn(t) = k_eff * CO(t) * A(t) * S(t)
D(t+dt)  = D(t) + dt * [v_rxn(t) - k_clear*D(t)]
y(t)     = P[CO(t), A(t), D(t), cell_state(t)] + measurement_noise
```

Here A denotes accessible active catalyst, S compatible precursor availability, and D drug product; all are illustrative latent variables. No fitted parameter, biological rate estimate, novel physical field, or patient-level prediction follows.

## Competing ordinary explanations that must be checked

1. Differential uptake of albumin/catalyst, rather than CO alone, drives the contrast.
2. Different redox/thiol environments change catalytic availability.
3. Different drug efflux, growth rates, or baseline susceptibility change viability without proportional changes in chemical synthesis.
4. HO-1 inhibitor effects or exogenous CO manipulations include secondary changes in cell state.
5. Healthy tissues other than TIG3 might activate the chemistry or suffer toxicity.

## CO-01 E0 → E1 qualification plan

**E0 (this note):** extract numerical findings and caveats from the actual article; preserve the publication date, DOI and source attribution. Classify NBG mappings as PROPOSED, not SOURCE-VERIFIED NBG predictions.

**E1A (proposed, synthetic only):** generate two ordinary reaction/uptake histories producing the same K0 endpoint, then pre-register a K1/K2 distinguishing perturbation. Include a negative collision where richer observations still cannot identify the cause. Compare the NBG Keyhole framing against the identical conventional compartmental/ODE model; no improvement claim unless a held-out metric actually improves.

**E1B (requires independent biological work):** require measured CO/HO-1, APC uptake, catalyst localization, product concentration, inhibitor controls, multiple normal tissues, dose/time data, pharmacokinetics and toxicity. **Do not initiate, authorize, or claim wet-lab treatment experiments through software simulation.**

**Promotion gate:** SOURCE-ATTRIBUTED in vitro observation != VERIFIED NBG theory != animal proof != clinical effectiveness. CI can validate document/link/test consistency only.

## Related NBG material

- [BodyShip resonance](BODY_SHIP_RESONANCE.md) and [BSR-2 biological oscillator bridge](BSR2_BIOLOGICAL_BRIDGE.md) are *synthetic analogy tracks*, not mechanistic oncology findings.
- [NI1 neuroimmune causal Keyholes](NEUROIMMUNE_CAUSAL_KEYHOLES.md) addresses a different set of biological causal pathways; both need named physical carriers and observation controls.
- [Research Atlas](RESEARCH_ATLAS.md) indexes E0 source notes separately from qualified experiments.
- [Epistemic provenance](EPISTEMIC_PROVENANCE.md) distinguishes cited external observations, inferences and simulated experiments.

**Ledger Above Ego.**
