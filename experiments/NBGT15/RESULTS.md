# NBG-T15 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
python experiments/NBGT15/src/nbgt15.py
python -m unittest discover -s experiments/NBGT15/tests -v
npm run test:adaptive-keyhole-synthesis
npm run build
\`\`\`

Expected structural witness:

\`\`\`text
admissible Governance Keyholes     144

EIGHT + JOINT
  static   PASS
  adaptive PASS

RESTRICTED_PAIR + POLICY
  PASS
  minimum cardinality 1

RESTRICTED_PAIR + OUTCOME
  REFUSE_UNSEPARABLE

FULL9 + JOINT
  static   REFUSE_UNSEPARABLE
  adaptive REFUSE_UNSEPARABLE

known unresolved FULL9 pair
  I_ALTER_DEACTIVATE_PAYLOAD_ONLY
  I_REMOVE_SUPERSEDE_NORMAL1
\`\`\`

The first remote qualification pass captures the exact static minimal Keyholes, observer cost, adaptive root query, adaptive depth, semantic hashes, and generated-artifact hashes.
