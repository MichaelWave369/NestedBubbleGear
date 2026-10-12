# NBG-BC2 · Blind Lineage Recovery

**v0.1.0 · SIMULATED · authority NONE · exact toy inference**

BC1 established that an initial coarse Keyhole can hide whether an information transfer happens, and that identical destinations can have different origin histories. However, its richest Keyhole was given source lineage explicitly. **BC2 does not allow its inference function to see the source label.**

It asks what an observer can deduce from an abstract 2-bit destination payload and optional independently *declared* witness channels. The observer must abstain when its input is insufficient or contradictory.

## Execute

```bash
npm run test:bc2
npm run receipt:bc2 -- --out bc2-receipt.json
npm run dev
```

On GitHub Pages open `#boundary-lineage` to vary source (0..3), edit mask (0..3) and evidence mode. Results are exhaustively enumerable and need no training, random sampling, viral material or outside data.

The motivating published biology is Gao et al. (2026), *Escape of the BC200 gene to a human poxvirus reveals its persistent transposition in primates*, *Science*, DOI [10.1126/science.aeh3441](https://doi.org/10.1126/science.aeh3441). This source motivates questions about provenance across boundaries. **The toy mechanism and results do not reproduce or establish biological behavior.**

Read [SPEC.md](SPEC.md) for the frozen hypotheses, exact controls, limitations and explicit failure conditions. No existing AH or BC1 frozen material is modified.
