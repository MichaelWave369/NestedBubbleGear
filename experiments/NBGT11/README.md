# NBG-T11 v0.1.0 — Policy Ledger + Governance Keyholes

NBG-T11 extends the Temporal NBG anti-hindsight discipline from evidence into governance itself.

Policies now have two clocks:

\`\`\`text
valid time = when the policy belongs in the modeled governance world
known time = when that policy version entered the ledger
\`\`\`

A later policy amendment can therefore be valid for an earlier period without becoming visible to an observer whose historical knowledge cutoff predates the amendment.

The rung adds:

- hashed temporal policy records;
- append-only policy-ledger events;
- policy registration;
- supersession;
- emergency activation/deactivation;
- Governance Keyholes;
- policy-relative resolution receipts;
- historical receipt immutability;
- portable governance bundles;
- a side-by-side Governance Keyhole browser explorer.

## Frozen witness

\`\`\`text
known k5 / valid t5   NORMAL@1.0
known k7 / valid t7   EMERGENCY@1.0
known k8 / valid t7   EMERGENCY@1.0
known k10 / valid t10 NORMAL@2.0
known k10 / valid t7  EMERGENCY@1.0
\`\`\`

The last row is deliberate: deactivation at valid t9 does not rewrite the policy that was active at valid t7.

## Qualification target

- **28/28 Python invariants PASS**
- **30/30 Python unit tests PASS**
- browser Governance Keyhole acceptance PASS
- production site build PASS
- temporal governance replay exact
