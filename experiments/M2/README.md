# NBG M2 v0.1.0 — Property-Based Generated Universes

M1 reproduced selected frozen flagship results with a second implementation.

M2 leaves the hand-picked examples and generates deterministic finite universes to attack six structural claims.

Frozen seed:

```text
369042
```

Frozen cases per property:

```text
250
```

Total generated property cases:

```text
1500
```

Properties:

1. minimal failure cuts equal minimal hitting sets of minimal success coalitions;
2. fusing control domains never increases the number of independent root domains;
3. incomplete independence evidence never certifies independence;
4. trusted revocation events revoke prospectively but do not directly certify a new topology;
5. observer coarsening never increases exact distinguishability;
6. adding observer distinctions never increases residual conditional entropy.

Every generated case receives a deterministic case id. Any failure is written to `results/counterexamples.json` with the seed, property, case input, observed result, and expected invariant.

M2 is finite randomized property testing with a frozen PRNG seed. It is not a proof over all possible systems.
