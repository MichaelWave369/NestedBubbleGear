# NBG-T6 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
node scripts/test_temporal_keyhole.mjs -> PASS_NBGT6_MODEL
npm run build                          -> PASS
\`\`\`

Frozen UI witness:

\`\`\`text
left cutoff 1:
  A1 = UNKNOWN
  C1 = source ALLEGED / review ALLEGED

right cutoff 4:
  A1 = NODE_X
  C1 = source ALLEGED / review CORROBORATED
\`\`\`

The first remote qualification run captures exact candidate file hashes before they are frozen into CI.

## Claim boundary

This is a UI/model qualification over synthetic temporal data, not a fact-check result.
