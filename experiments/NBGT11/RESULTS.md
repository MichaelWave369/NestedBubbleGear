# NBG-T11 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
python experiments/NBGT11/src/nbgt11.py
python -m unittest discover -s experiments/NBGT11/tests -v
npm run test:governance-keyholes
npm run build
\`\`\`

Expected witness:

\`\`\`text
k5/t5 selected          NORMAL@1.0
k7/t7 selected          EMERGENCY@1.0
k8/t7 selected          EMERGENCY@1.0
k10/t10 selected        NORMAL@2.0
late replay of t7       EMERGENCY@1.0

k5 outcome              REJECTED
k7 outcome              REJECTED
k10 outcome             ABSTAIN_CONFLICT
NORMAL@1.0 @ k10/t10    SUPERSEDED
EMERGENCY @ k10/t10     INACTIVE
\`\`\`

The first remote qualification pass captures exact candidate and generated-artifact hashes before merge.

## Claim boundary

The fixture contains synthetic governance rules and synthetic reviewer decisions. It qualifies policy-history semantics only.
