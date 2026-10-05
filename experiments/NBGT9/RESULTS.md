# NBG-T9 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
python experiments/NBGT9/src/nbgt9.py
python -m unittest discover -s experiments/NBGT9/tests -v
\`\`\`

Expected witness:

\`\`\`text
sources                  3
duplicate clusters       1
drift events             1
merged decisions         4
opposing review state    REVIEW_CONFLICT
source status            ALLEGED
review status            CORROBORATED
first import objects     3 added
second import objects    3 reused
import trust state       REVIEW_REQUIRED
\`\`\`

The first remote qualification pass captures exact candidate file and generated-artifact hashes before merge.

## Claim boundary

All evidence and reviewer identities are synthetic. The rung qualifies portability and merge behavior only.
