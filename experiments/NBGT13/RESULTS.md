# NBG-T13 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
python experiments/NBGT13/src/nbgt13.py
python -m unittest discover -s experiments/NBGT13/tests -v
npm run test:governance-sensitivity
npm run build
\`\`\`

Expected frozen witness:

\`\`\`text
atlas rows                9
target query              k10/t10
observed outcome          ABSTAIN_CONFLICT
target outcome-changing   4
minimal cardinality       1
minimal singleton sets    4

payload-only control      LEDGER_ONLY_INERT
alter-valid-t10 control   first outcome divergence k9/t9
\`\`\`

The first remote qualification pass captures exact candidate file and generated-artifact hashes before merge.

## Claim boundary

Sensitivity and minimality are properties of the frozen model and mutation grammar. They are not claims of historical causation.
