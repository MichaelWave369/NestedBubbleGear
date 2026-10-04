# NBG-T5 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT5**

Local pre-commit qualification:

- invariant checks: **18/18 PASS**
- unit tests: **19/19 PASS**
- replay exact
- review-ledger chain valid
- canonical event ordering
- source/review evidence separation
- analyst overlay separation
- provenance-preserving export

## Frozen witness

\`\`\`text
knowledge cutoff 1:
  A1 subject = UNKNOWN
  C1 source/review status = ALLEGED

knowledge cutoff 3:
  A1 derived subject = NODE_X
  base A1 subject still = UNKNOWN

knowledge cutoff 4:
  C1 source status  = ALLEGED
  C1 review status  = CORROBORATED
\`\`\`

The later reviewer and evidence events do not rewrite the earlier cutoff-1 Keyhole.

## Filters

\`\`\`text
status = CORROBORATED -> [C1]
relation = ALLEGED_LINK -> [A1, C1]
analyst overlay OFF -> H1 absent
analyst overlay ON  -> H1 present
\`\`\`

## Claim boundary

The fixture is synthetic. \`CORROBORATED\` is a frozen test-state transition, not a statement about any real historical claim.
