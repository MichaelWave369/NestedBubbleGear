# NBG-T12 v0.1.0 — Governance Branches + Counterfactual Policy Replay

NBG-T12 forks governance history without editing the observed NBG-T11 ledger.

The central rule:

\`\`\`text
observed != counterfactual
fork != edit
model divergence != historical fact
\`\`\`

The rung freezes three single-event interventions:

\`\`\`text
REMOVE_EVENT
DELAY_EVENT
ALTER_EVENT
\`\`\`

Each branch begins with a hashed fork receipt that pins the observed ledger head, target event ID/hash, operation, patch, and explicit counterfactual truth boundary.

## Frozen witness

Observed event:

\`\`\`text
EV_DEACTIVATE_EMERGENCY
known k9 / valid t9
\`\`\`

At \`k10/t10\`:

\`\`\`text
OBSERVED
NORMAL@2.0 -> ABSTAIN_CONFLICT

REMOVE DEACTIVATION
EMERGENCY@1.0 -> REJECTED

DELAY DEACTIVATION TO k11/t11
EMERGENCY@1.0 -> REJECTED
\`\`\`

The first outcome divergence appears at:

\`\`\`text
known k9 / valid t9
\`\`\`

The observed ledger stays byte-identical throughout branch construction.

## Qualification target

- **32/32 invariant checks PASS**
- **34/34 unit tests PASS**
- browser branch explorer acceptance PASS
- production build PASS
- portable counterfactual bundle round trip exact
- deterministic branch and divergence replay
