# NBG-BC1 · Boundary-Crossing Persistence

**v0.1.0 · SIMULATED · authority NONE · finite-state positive/negative controls**

A peer-reviewed observation motivates the question: BC200, a human noncoding RNA gene involved in neuronal translation regulation, has generated many retrotransposed insertions across primate evolution. Two BC200-derived insertions have been reported in molluscum contagiosum virus, likely via LINE-1 machinery. This observation **does not validate an NBG theory of viral infection or genetic evolution**.

BC1 asks whether a toy system can preserve a functional role, depend on external copying machinery for mobility, cross a boundary only when permitted, and carry source history that a recipient-only observer cannot recover.

## Run

```bash
npm run test:bc1
npm run receipt:bc1 -- --out bc1-receipt.json
npm run dev
```

Open `#boundary-crossing` in the NBG Pages site to inspect all four binary controls and export a `SIMULATED` JSON receipt.

This is a controlled model with **16 synthetic states and no biological sequence data**. A pass means the implementation satisfies the frozen toy specification, not that NBG explains BC200.

Read [SPEC.md](SPEC.md) before interpreting metrics.

## Sources

Gao P, Pritham EJ, Feschotte C, Sun C (2026). *Escape of the BC200 gene to a human poxvirus reveals its persistent transposition in primates*. Science 393(6818):1342–1346. DOI: [10.1126/science.aeh3441](https://doi.org/10.1126/science.aeh3441). [PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/42784687/).

We cite the biological paper as **motivation only**. Model bits are invented abstract symbols, not BC200 nucleotides, genetic mechanisms, infected tissues, measurements or estimates.
