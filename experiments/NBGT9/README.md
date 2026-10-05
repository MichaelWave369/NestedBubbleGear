# NBG-T9 v0.1.0 — Portable Evidence Bundles + Source Registry

NBG-T9 makes the evidence layer portable without weakening the epistemic firewall.

The central rule is deliberately boring and therefore useful:

\`\`\`text
portable != trusted
valid != accepted
merge != overwrite disagreement
\`\`\`

The rung adds:

- stable source IDs;
- explicit source-independence groups;
- hashed source registry;
- content-addressed evidence storage;
- hash-linked bundle manifests;
- import validation;
- duplicate/mirror detection;
- stable-source drift history;
- reviewer attribution;
- reviewer-decision chain export;
- conflict-preserving bundle merge;
- deterministic offline round trip.

## Frozen witness

\`\`\`text
3 sources
4 captures
3 unique content objects
1 mirror cluster
1 drift event
3 reviewers
4 review decisions
1 REVIEW_CONFLICT
\`\`\`

The conflicting opposing capture is preserved rather than applied by last-write-wins, so the synthetic claim remains:

\`\`\`text
source status = ALLEGED
review status = CORROBORATED
\`\`\`

## Local qualification target

- **22/22 invariant checks PASS**
- **25/25 unit tests PASS**
- portable export/import exact
- merge order invariant
- replay exact
