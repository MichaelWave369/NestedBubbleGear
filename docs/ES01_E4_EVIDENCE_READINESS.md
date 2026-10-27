# ES-01 E4 | Evidence readiness and missingness ledger

**Status:** SCREENING REQUIRED / LITERATURE REVIEW NOT COMPLETED · 2026-10-27. **Experimental authority:** NONE.

E4 moves the source-linked ES-01 work from exploratory hypotheses to a **transparent review queue**. It asks what documentary material would be required to evaluate each E3 research question: the primary methods, distinct desired/unwanted endpoints, their numeric estimates and uncertainty, study comparability, risk of bias, and search for independent replication.

The [E4 ledger](../src/es01Readiness.json) contains **ten** checklists, one for each E0 source and corresponding E3 question. It binds to the existing [E0](../src/es01Evidence.json), [E2](../src/es01ClaimAudit.json), and [E3](../src/es01Hypotheses.json) identifiers. It does NOT modify earlier records or their published evidence tiers.

## Critical interpretation rules

- **NOT_EXTRACTED does not mean NOT_REPORTED.** It means this project has not documented a methodologically verified data extraction from the source. A paper may contain data we have not yet reviewed.
- **NOT_SEARCHED does not mean NO_REPLICATION_EXISTS.** We have not completed a systematic independent replication search.
- A public abstract or product label does not replace a full-method audit, patient outcome dataset, systematic review or appropriate design-comparability assessment.
- FDA approval of **purified cannabidiol (Epidiolex)** or **esketamine (Spravato)** applies to their specific indications. It does not establish that unwanted psychoactive effects have been separated from another drug's therapeutic benefits.
- **Human Phase 1 tolerability**, a **human healthy-volunteer acute-effects crossover**, and **rodent behavior** answer distinct scientific questions. No numerical effect-separation metric is manufactured across them.
- The software **always returns HOLD_REVIEW_INCOMPLETE** until an independently defined and reviewed evidentiary upgrade is proposed in a future version. Changing JSON labels is not enough to establish an effect.
- The ledger does not provide medication advice, recipes, procedures, dose suggestions or tools for self-experimentation.

## Reader behavior

The interactive E4 evidence-readiness panel lets visitors select any of the ten records, view six unreviewed/extraction-pending domains, identify the most relevant source-data need and confound, and open the underlying primary reference. There is no fake progress percentage, study quality rank, patient outcome prediction or clinical green light.

## Future lawful research review, not performed

A qualified independent scientific reviewer would have to confirm source identity and accessible full methods, record actual endpoint definitions and quantitative estimates with source locations, check bias and representativeness, and search for replication. Appropriate ethics and regulatory review is necessary for any separately proposed experimental program. E4 authorizes **no biological testing**.

## Automated qualification

```sh
npm run test:es01-e4
npm run test:es01-e3
npm run test:es01-e2
npm run test:es01-e1
npm run test:es01
npm run test:research-atlas
npm run build
```

Tests verify one-to-one custody of source/question IDs, the deliberately blocked gate, exact pending status values and site wiring. They validate **software metadata consistency**, not the correctness of papers or real-world drug effects.

**Ledger Above Ego.**
