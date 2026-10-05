# NBG-T14 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
python experiments/NBGT14/src/nbgt14.py
python -m unittest discover -s experiments/NBGT14/tests -v
npm run test:intervention-equivalence
npm run build
\`\`\`

Expected structural witness:

\`\`\`text
interventions                     9
unordered pair receipts          36

REMOVE_DEACTIVATE
vs DELAY_DEACTIVATE_11
  focal k10/t10 equal
  temporal behavior distinct
  minimal separator cardinality 1

REMOVE_REGISTER_NORMAL2
vs DELAY_REGISTER_NORMAL2_11
  focal k10/t10 equal
  temporal behavior distinct
  minimal separator cardinality 1

PAYLOAD_ONLY
vs REMOVE_SUPERSEDE_NORMAL1
  focal k10/t10 equal
  temporal behavior equal
  different branch-ledger heads
  residue count 0
\`\`\`

The first remote qualification pass captures exact first-separator locations, atlas counts, semantic hashes, and generated-artifact hashes before merge.
