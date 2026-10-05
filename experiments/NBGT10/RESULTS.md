# NBG-T10 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
python experiments/NBGT10/src/nbgt10.py
python -m unittest discover -s experiments/NBGT10/tests -v
\`\`\`

Expected witness:

\`\`\`text
input review state      REVIEW_CONFLICT
weighted outcome        REJECTED
unanimous outcome       ABSTAIN_CONFLICT
researcher quorum       INSUFFICIENT_AUTHORITY
support outcome         ACCEPTED
stale policy blocked    true
manifest mismatch       blocked
registry mismatch       blocked
\`\`\`

The first remote qualification pass captures exact candidate file and generated-artifact hashes before merge.

## Claim boundary

Policy outcomes are explicit governance decisions over synthetic reviewer statements, not objective truth labels.
