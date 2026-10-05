# NBG-T13 v0.1.0 — Governance Sensitivity Atlas + Minimal Intervention Sets

NBG-T13 asks a more disciplined counterfactual question:

\`\`\`text
Which admissible governance-history changes actually affect the declared result?
\`\`\`

It distinguishes:

\`\`\`text
target outcome change
target policy-only change
target inertness
temporal outcome leverage
temporal policy leverage
ledger-only inertness
\`\`\`

The point is to stop treating every different branch as equally causally meaningful. Humans are already very good at drawing arrows between things and then becoming emotionally attached to the arrows.

## Frozen target

\`\`\`text
known k10 / valid t10
observed: NORMAL@2.0 -> ABSTAIN_CONFLICT
\`\`\`

Nine admissible single-event interventions are enumerated.

Four change the target outcome to \`REJECTED\`:

\`\`\`text
I_DELAY_DEACTIVATE_11
I_DELAY_REGISTER_NORMAL2_11
I_REMOVE_DEACTIVATE
I_REMOVE_REGISTER_NORMAL2
\`\`\`

Thus the complete minimum-cardinality solution family for the frozen target is four singleton sets.

## Negative controls

Two frozen interventions change ledger history without changing governance behavior anywhere in the replay window.

The payload-only control is particularly useful:

\`\`\`text
different ledger hash
same selected policy
same governance outcome
\`\`\`

That is the exact distinction a sensitivity atlas should preserve.

## Qualification target

- **36/36 invariant checks PASS**
- **38/38 unit tests PASS**
- browser sensitivity atlas PASS
- production build PASS
- deterministic atlas and minimal-set replay
