# NBG-T15 Candidate — Adaptive Keyhole Synthesis

NBG-T14 qualifies pairwise intervention equivalence and Governance Residue.

NBG-T15 should ask:

\`\`\`text
Given a set of histories that are still indistinguishable,
what is the smallest admissible observer family that separates them?
\`\`\`

Candidate scope:

1. synthesize minimal Governance Keyhole sets that distinguish a declared intervention family;
2. optimize for separator cardinality before any secondary cost;
3. support policy-only, outcome-only, and joint policy/outcome observer channels;
4. identify intervention families that remain indistinguishable under a restricted observer language;
5. emit explicit REFUSE_UNSEPARABLE when no admissible Keyhole family can distinguish the targets;
6. compare static fixed Keyhole sets with adaptive next-query selection;
7. preserve query provenance and selection receipts;
8. measure observer cost without pretending cost equals epistemic value;
9. expose deterministic separating decision trees;
10. add a browser "observer synthesizer" that shows which next Keyhole maximally splits the remaining candidate histories.

This would move NBG-T from analyzing a fixed Keyhole family toward synthesizing the observer itself.
