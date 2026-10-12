# NBG-BC2 v0.1.0 · Blind Lineage Recovery

**Frozen protocol candidate:** SIMULATED finite model. **Authority:** NONE. **External biological validity:** NONE.

## Research question

For a copied symbol with a potentially edited destination payload, how much information about the editing operation is needed to infer source lineage, and what kinds of missing, contradictory, duplicated, or coordinated-false evidence defeat sound attribution?

The source of the idea is BC200-derived insertions discovered in a human poxvirus (Gao et al., *Science* 2026, DOI [10.1126/science.aeh3441](https://doi.org/10.1126/science.aeh3441)). No genomic source sequence, insertion site, recombination mechanism, virus, infection, cellular assay or clinical assertion is included in the model.

## World and observational firewall

There are **16 equal-weight, abstract worlds**, comprising all `source∈{0,1,2,3}` and `edit∈{0,1,2,3}`. Each is a two-bit integer. The destination payload is defined as `payload = source XOR edit`, with ordinary bitwise XOR, and the donor retains its identity as a ground-truth ledger variable.

The inference function `inferBC2(view)` **only** receives `{payload,witness,duplicate,shadow}`; passing source, edit, truth, or extra keys is a schema error. It exhaustively enumerates possible worlds compatible with the supplied observable evidence. If source is unique, it reports `RECOVERED_UNIQUE`; if multiple possibilities survive, `REFUSE_AMBIGUOUS`; if evidence conflicts, `REFUSE_CONFLICT`. Evaluation scores attribution against the truth **only after inference**.

Witness types are declared data channels, not authenticated evidence:
- `TRACE_A` parity witness reveals XOR of the two edit bits (one bit of evidence).
- `TRACE_A` full witness reveals the two-bit edit mask.
- `TRACE_B` shadow parity is a nominally separate parity record. Its lineage label does not prove independent custody.
- A duplicate parity record with the same lineage as TRACE_A must be collapsed; repetition is not independent evidence.

## Frozen factorial scenarios (16 worlds × 8 modes = 128 evaluations)

| Scenario | Expected unique | Ambiguous | Conflict | Correct unique | Incorrect unique | Residual source bits |
|---|---:|---:|---:|---:|---:|---:|
| RECIPIENT_ONLY | 0 | 16 | 0 | 0 | 0 | 2 |
| PARITY_WITNESS | 0 | 16 | 0 | 0 | 0 | 1 |
| DUPLICATE_PARITY | 0 | 16 | 0 | 0 | 0 | 1 |
| FULL_WITNESS | 16 | 0 | 0 | 16 | 0 | 0 |
| FULL_CROSSCHECK | 16 | 0 | 0 | 16 | 0 | 0 |
| FORGED_UNCHECKED | 16 | 0 | 0 | 0 | 16 | 0 |
| FORGED_CONFLICT | 0 | 0 | 16 | 0 | 0 | undefined |
| COORDINATED_FORGERY | 16 | 0 | 0 | 0 | 16 | 0 |

The forged edit mask is `edit XOR 1`, which always toggles one of the two abstract bits. The conflicting shadow observes the **true** edit parity, detecting the mismatch and forcing refusal. The coordinated shadow instead agrees with the forged edit, producing a mutually consistent but false lineage. Thus a **unique posterior under declared inputs can still be wrong**. This is a hard limit of consistency checking, not a statement that coordinated attacks on actual molecular provenance work this way.

Residual bits = `log₂(number of distinct candidate sources)` under the finite uniform world prior. For contradictory observations residual entropy is **undefined**, not a claim of perfect knowledge.

## Negative controls / failure gates

The package fails if any of the following occur:
- The 16 world source/edit pairs are not exhaustive or unique.
- `inferBC2` accepts hidden source truth, source labels or extra fields.
- A recipient-only or one-bit witness observer claims unique source recovery.
- A duplicate of the same parity witness is treated as new information.
- Honest full edit witnesses fail to recover a unique correct source.
- An unchecked forged full witness is auto-detected despite no contradictory evidence.
- Conflicting full/parity witnesses do not trigger refusal.
- Two mutually consistent forged witnesses are incorrectly treated as authenticated truth.
- Receipts are nondeterministic or lack `origin=SIMULATED` and `authority=NONE`.

This controlled construction is **not** an NBG empirical validation: even an exact pass demonstrates properties of the chosen information channel, not a newly inferred law of biology. There is no fitted model, real-data holdout, stochastic performance claim, unassisted physical measurement, secure authentication or validation of independent source provenance.

## Repeatability and custody

Run `npm run test:bc2`. Run `npm run receipt:bc2 -- --out bc2-receipt.json` to write a JSON ledger with the exact eight-mode census and a SHA-256 digest of serialized receipt content. This digest identifies bytes, not biological evidence, authenticated truth or cryptographic anti-forgery.

The test harness may reveal `scoringTruth` in export **separately** from the restricted inference input. The UI labels it explicitly as experimenter-only ground truth. A later empirical extension would require independently curated real-world data, external baselines, access-controlled blinded scoring, and evidence-custody reviews before any biological claim promotion.

The motivating reference is Gao P, Pritham EJ, Feschotte C and Sun C. *Escape of the BC200 gene to a human poxvirus reveals its persistent transposition in primates*. *Science*, 2026. DOI: 10.1126/science.aeh3441.
