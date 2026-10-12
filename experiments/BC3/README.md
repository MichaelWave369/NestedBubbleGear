# NBG-BC3 · Evidence Custody vs. Truth

**Version:** 0.1.0. **Provenance:** SIMULATED. **Authority:** NONE.

BC2 showed that source attribution can be wrong even when multiple witness claims are consistent. BC3 adds a controlled *custody* layer: tiny toy signature equations, distinct signer-identity quorum, duplicate-root collapse, signature-tampering refusal, and coordinated-false witness controls.

**Important:** The keys are tiny, public, hardcoded teaching values. They provide **no cryptographic security**. Validity means an algebraic equation held inside this synthetic world, not that a trusted organization authenticated a record. Even real secure signatures authenticate signed content and signing key custody, not the underlying truth of the measured claim.

## Run

```bash
npm run test:bc3
npm run receipt:bc3 -- --out bc3-receipt.json
npm run dev
```

Navigate to `#boundary-custody` to compare all nine witness conditions across the same 16 two-bit source/edit states (144 exact toy evaluations). The signed-but-false controls deliberately produce failures: they are *successful tests of a limitation*, not successful source recovery.

[Protocol and falsifiers](SPEC.md). [BC2 predecessor](../BC2/README.md).

The scientific motivation is Gao et al. (2026), *Escape of the BC200 gene to a human poxvirus reveals its persistent transposition in primates*, *Science*, DOI [10.1126/science.aeh3441](https://doi.org/10.1126/science.aeh3441). This paper supplies an interesting question about lineage evidence, **not proof that BC3 describes biological transfer**.

No biological sequences, pathogen activity, patient data, genomic manipulation, or medical recommendations appear in this experiment.
