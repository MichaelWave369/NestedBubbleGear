# NBG-BC1 v0.1.0 · preregistered finite protocol

**Origin:** SIMULATED. **Authority:** NONE. **Empirical inference:** NONE.

## Question

Can two coarse-equivalent system states yield different results after a controlled boundary event, and can an identical destination payload conceal distinct source lineages?

## Finite model, fixed before evaluation

Every input is a binary integer, exactly 0 or 1:

- `sourceBit`: abstract information label in a bounded donor.
- `machinery`: external copying capability is absent (0) or present (1).
- `gate`: destination interface forbids (0) or allows (1) transfer.
- `edit`: toggle (1) or retain (0) the single copied bit after insertion.

These 2⁴ settings produce 16 states with identical **initial** coarse observation `K0={donorFunction:1, recipientInitiallyEmpty:true}`. The modeled donor's existing function remains 1 throughout by definition; this is *not* an experimental assay.

The transition rule is **INSERTION iff machinery = 1 and gate = 1**. Otherwise the destination remains empty. For an insertion, the destination receives `sourceBit XOR edit` and a synthetic model-side lineage trace. No donor data is consumed by copying.

Observers:

- **K0:** donor function and initially empty recipient only; no knowledge of copying prerequisites.
- **K1:** after-event donor function and recipient payload; no donor origin or edit history.
- **K2:** K1 plus all input conditions and synthetic lineage metadata.

## Predictions and controls

| Frozen criterion | Expected |
|---|---|
| Total enumerated states | 16 |
| INSERTION / BLOCKED | 4 / 12 |
| Donor function retained | 16 / 16 |
| Insertion when machinery absent | 0 |
| Insertion when gate closed | 0 |
| Number of distinct K0 / K1 / K2 views | 1 / 3 / 16 |
| K0 aliases insertion with no-insertion futures | true |
| K1 cannot uniquely determine source bit for either inserted payload | true |
| Baseline majority prediction using K0 alone | 12 / 16 |
| Mechanism-aware classification using defined inputs | 16 / 16 |

**Positive control:** machinery=1, gate=1, edit=0 inserts the original bit.

**Negative control A:** machinery=0, gate=1 blocks insertion.

**Negative control B:** machinery=1, gate=0 blocks insertion.

**Lineage collision witness:** `(sourceBit,edit)=(0,1)` and `(1,0)`, with machinery=gate=1, both yield recipient bit 1; K2 distinguishes histories.

**Tampering negative control:** changing trace or output without changing declared inputs must fail internal consistency validation.

## Disconfirmation criteria

Any incorrect census/count, uncontrolled insertion, inconsistent trace, missing K0 collision, missing K1 lineage aliasing, unsupported inputs, nondeterministic receipt, or failure to preserve donor function **fails BC1**.

The higher-dimensional K2 observer has the original inputs; successful source recovery is built into this synthetic observer, not discovered from experimental measurements. The comparison 12/16 vs 16/16 is an *in-model definitional baseline*, not fitted accuracy, biological prediction, or evidence of superior NBG modeling.

## Provenance, isolation and evidence wall

The JSON receipt declares `origin=SIMULATED`, `authority=NONE` and cites its scientific inspiration. The optional CLI SHA-256 digest identifies exactly the serialized toy receipt and does not authenticate molecular observations. `verifyBC1Run` checks internal consistency only, not authenticity or adversarially forged self-consistent input.

- No real DNA, RNA, viral genome, LINE-1 activity, patient samples, infection model or molecular kinetics are included.
- No pathogen growth, optimization or manipulation is described or performed.
- No inference of neurological ability in the virus, gene-therapy safety or biological causality is licensed.
- Correlation/analogy does not constitute validation of NBG. A future biological research track would require independently curated source data, baseline comparisons and preregistered non-toy criteria.

**Primary motivating paper:** Gao et al., *Science* (2026), DOI [10.1126/science.aeh3441](https://doi.org/10.1126/science.aeh3441); [PubMed PMID 42784687](https://pubmed.ncbi.nlm.nih.gov/42784687/).

This v0.1.0 specification is introduced alongside its initial implementation and tests. Do not rewrite an executed protocol without a version bump and a documented migration.
