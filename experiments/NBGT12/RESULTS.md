# NBG-T12 v0.1.0 Candidate Results

Candidate acceptance target:

\`\`\`text
python experiments/NBGT12/src/nbgt12.py
python -m unittest discover -s experiments/NBGT12/tests -v
npm run test:counterfactual-governance
npm run build
\`\`\`

Expected witness:

\`\`\`text
observed k10/t10       NORMAL@2.0 -> ABSTAIN_CONFLICT
remove branch k10/t10  EMERGENCY@1.0 -> REJECTED
delay branch k10/t10   EMERGENCY@1.0 -> REJECTED
alter branch k9/t9     EMERGENCY@1.0 -> REJECTED

altered event           EV_DEACTIVATE_EMERGENCY
first divergence        k9/t9
observed event count    6
remove branch count     5
\`\`\`

The first remote qualification pass captures exact candidate file and generated-artifact hashes before merge.

## Claim boundary

Every derived branch is marked counterfactual and remains separate from the observed governance ledger.
