# NBG-RB3-R5-E6 | Primary abstract comparator atomicity

**Status: source-level abstract evidence, not independent full-text verification, no new model rows.**

E6 attempted to advance the frozen RB2 missing-lineage studies directly, rather than expanding the reviewer bureaucracy. Public searches for the three primary papers confirmed their abstracts and bibliographic access routes, but **none of the checked accessible pages supplied a verified exact exposure-arm × comparator × time × assay result table**. This is a *scoped search finding*, not a claim that a lawful full text cannot exist.

## Source observations with actual comparison logic

- **S008 / L005**: cultured **rat** mesenchymal stem cells exposed at **50 Hz, 10 mT** for **3h or 6h**, with an author-reported early increase in proliferation relative to control, **no significant difference in growth between the 3h and 6h exposed groups**, greater G1-phase fraction with 6h versus 3h, and a nonsignificant proliferation/cell-cycle finding at a **16h post-exposure follow-up**. The aggregate source text does **not** pin significance and readout time to each exposed-versus-sham duration. Source: [PubMed PMID 22676915](https://pubmed.ncbi.nlm.nih.gov/22676915/), [journal abstract](https://www.tandfonline.com/doi/abs/10.3109/15368378.2012.662194).
- **S009 / L006**: rat bone-marrow MSCs with **15 Hz, 1 mT sinusoidal** exposure; authors report duration-dependent proliferation and several distinct osteogenic endpoints (RUNX2, BSP, OPN transcripts, ALP activity, calcium deposition). **Neither exact tested durations nor condition-specific statistics are in the accessible PubMed abstract**. U0126/MEK–ERK inhibitor comparisons are a **co-intervention**, not evidence for direct EMF sensing or an unstimulated sham comparison. Source: [PubMed PMID 24068522](https://pubmed.ncbi.nlm.nih.gov/24068522/), [author request page](https://www.researchgate.net/publication/257075067_The_Time-Dependent_Manner_of_Sinusoidal_Electromagnetic_Fields_on_Rat_Bone_Marrow_Mesenchymal_Stem_Cells_Proliferation_Differentiation_and_Mineralization).
- **S013 / L010**: mouse FDCP-mix(A4) hematopoietic cell line under ambient, nulled, Ca²⁺ cyclotron-related and vertical **50 Hz/6 µT RMS** regimes for **1, 4, 7 or 21 days**, with author-reported pooled lack of significant growth/cell-cycle/clonogenic changes. **A nulled field is not the same stimulus as an active 50 Hz field**, and the pooled conclusion does not establish a separate source-backed null observation for every regime/day/endpoint. Source: [PubMed PMID 8919028](https://pubmed.ncbi.nlm.nih.gov/8919028/).

## What was actually added

- `abstract_contrasts.json`: 10 individual **study-level claim atoms** with explicit comparator class, endpoint scope, measurement window, author-level significance relation, species, original DOI/PMID and missing per-arm figure/table fields.
- `audit_contrasts.py`: cross-checks exact frozen RB2/R4 source identities, the R5 unreviewed packet, missing L005/L006/L010 coverage and the source claims' no-promotion flags. Detects comparator conflation and newly invented biological detail.
- `tests/test_contrasts.py`: adversarial controls for fabricated reviewer approvals, invented S009 durations, false human-cell labels, falsely precise numeric p-values, early-versus-late confusion and exposed-arm-versus-sham confusion.
- `.github/workflows/rb3-r5-e6.yml`: no-fit qualification and brief reviewer-facing source-request artifact.

**Ten claim atoms are not ten independent biological comparisons or trials**, and are never appended to the frozen RB3 candidate CSVs. They represent the smallest distinct abstract assertions we can responsibly index from the accessible source pages.

## How to unblock the real science

[Issue #92](https://github.com/MichaelWave369/NestedBubbleGear/issues/92) now identifies the three missing lineages. A reviewer with legitimate primary full-text access must supply the specific figure/table/page, dose, endpoint, timepoint, control comparator and study-reported statistical statement through the existing [E1 intake](../E1/README.md). The human review remains an independent step, not CI output.

Until then, the experimental corpus stays **64 unapproved candidates, 8/11 lineages with candidate data, zero independently adjudicated eligible rows, no real RB3 fit**. The original 11-lineage experiment may still legitimately yield `VOID_INSUFFICIENT_CORPUS`.

No evidence here supports complete regeneration, direct DNA-antenna effects or a universal therapeutic frequency.
