# NBG-T5 v0.1.0 — Evidence-Linked Review and Temporal Keyholes

NBG-T5 turns the temporal ingest pipeline into a reviewable history.

The key idea is simple:

\`\`\`text
source history stays immutable
review actions append to a ledger
Temporal Keyholes derive what is visible at each knowledge cutoff
\`\`\`

The frozen witness starts with an ambiguous source record and an \`ALLEGED\` source-map claim.

At knowledge cutoff 3, an explicit reviewer event resolves the ambiguous label without overwriting the base record.

At knowledge cutoff 4, synthetic external evidence makes the derived review status of claim \`C1\` become \`CORROBORATED\`, while its original source-map status remains \`ALLEGED\`.

Filters, relation toggles, and the analyst-hypothesis overlay operate only on the derived view.

## Qualification

- **18/18 invariant checks PASS**
- **19/19 unit tests PASS**
- review ledger hash-chain valid
- no-hindsight replay PASS
- provenance bundle PASS
- source/review layer separation PASS
- status filter PASS
- relation filter PASS
- analyst overlay PASS
- export chain PASS
- replay exact

This rung freezes the **headless review semantics** that a site UI can safely consume. The next rung should expose them through the GitHub Pages Temporal Keyhole Explorer.
