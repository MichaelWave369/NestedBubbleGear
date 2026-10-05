# NBG-T14 v0.1.0 — Intervention Equivalence + Governance Residue

NBG-T14 turns the original NBG idea back onto governance history.

The question:

\`\`\`text
same through this Governance Keyhole
?
same across the richer admissible query family
\`\`\`

Nine NBG-T13 interventions produce 36 unordered pair receipts.

Each pair is checked at the focal \`k10/t10\` Keyhole and across all \`k1...k12 × t1...t12\` Governance Keyholes.

The key distinction:

\`\`\`text
single-Keyhole equality != full temporal equivalence
\`\`\`

## Hidden-residue witness

\`\`\`text
I_REMOVE_DEACTIVATE
vs
I_DELAY_DEACTIVATE_11
\`\`\`

Both produce:

\`\`\`text
EMERGENCY@1.0 -> REJECTED
\`\`\`

at k10/t10.

But their future Governance Keyholes diverge, so the pair has nonzero Governance Residue.

## Full-equivalence control

\`\`\`text
I_ALTER_DEACTIVATE_PAYLOAD_ONLY
vs
I_REMOVE_SUPERSEDE_NORMAL1
\`\`\`

The two branch ledgers are different, yet every admitted Governance Keyhole returns the same behavior.

That is an important negative control:

\`\`\`text
ledger difference != behavioral difference
\`\`\`

## Qualification target

- **34/34 invariant checks PASS**
- **38/38 unit tests PASS**
- browser equivalence explorer PASS
- production build PASS
- 36 deterministic pair receipts
- deterministic equivalence-class replay
