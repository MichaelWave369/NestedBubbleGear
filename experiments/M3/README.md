# NBG M3 v0.1.0 — Mutation Testing the Qualification Machinery

M2 searched 1500 generated universes for counterexamples.

M3 attacks the **test machinery itself**.

Twelve deliberately wrong, non-equivalent mutants are frozen across the core governance/property families:

- cut-set logic;
- control-domain fusion;
- independence certification;
- event provenance and topology claims;
- observer coarsening;
- conditional entropy refinement;
- quorum thresholds;
- refusal/output leakage.

A mutant is **killed** only when a frozen oracle finds a concrete witness where the mutant violates the intended invariant.

Every killed mutant records:

- mutant id;
- family;
- description;
- witness input;
- baseline result;
- mutant result;
- violated invariant.

Qualification target:

```text
12 / 12 mutants killed
mutation score = 1.0
```

A surviving mutant would be treated as a weakness in the qualification harness, not quietly discarded because percentages have feelings now.
