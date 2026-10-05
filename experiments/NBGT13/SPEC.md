# NBG-T13 Frozen Specification — Governance Sensitivity Atlas + Minimal Intervention Sets

## 1. Goal

NBG-T13 maps which admissible governance-history interventions matter for a declared query, which only change policy selection, which matter elsewhere in time, and which change ledger bytes without changing governance behavior.

The governing rule is:

\`\`\`text
ledger difference != governance leverage
sensitivity != causal attribution
minimal intervention != true cause
\`\`\`

## 2. Declared query

The frozen focal query is:

\`\`\`text
known cutoff = k10
valid time   = t10
evidence cutoff = k10
capture = CAP_OPPOSE
\`\`\`

The observed outcome is:

\`\`\`text
NORMAL@2.0 -> ABSTAIN_CONFLICT
\`\`\`

All intervention classifications are relative to this declared query unless explicitly labeled temporal.

## 3. Admissible mutation grammar

The atlas contains nine frozen one-event interventions:

\`\`\`text
I_REMOVE_DEACTIVATE
I_DELAY_DEACTIVATE_11
I_ALTER_DEACTIVATE_VALID10
I_REMOVE_SUPERSEDE_NORMAL1
I_DELAY_ACTIVATE_EMERGENCY_7
I_REMOVE_REGISTER_NORMAL2
I_DELAY_REGISTER_NORMAL2_11
I_REMOVE_REGISTER_EMERGENCY
I_ALTER_DEACTIVATE_PAYLOAD_ONLY
\`\`\`

Every intervention is expressed through the qualified NBG-T12 fork grammar:

\`\`\`text
REMOVE_EVENT
DELAY_EVENT
ALTER_EVENT
\`\`\`

Interventions outside this explicit grammar are refused.

## 4. Two sensitivity classifications

Every atlas row receives two distinct classifications.

### Target-query class

\`\`\`text
OUTCOME_CHANGING
POLICY_CHANGING
TARGET_INERT
\`\`\`

This classification concerns only the declared k10/t10 query.

### Temporal class

\`\`\`text
TEMPORAL_OUTCOME_LEVERAGE
TEMPORAL_POLICY_LEVERAGE
LEDGER_ONLY_INERT
\`\`\`

This classification scans the frozen replay window and asks whether the intervention changes an outcome somewhere, changes only policy selection somewhere, or never changes either.

## 5. Frozen outcome-changing interventions

At k10/t10, four singleton interventions change the observed result from:

\`\`\`text
NORMAL@2.0 -> ABSTAIN_CONFLICT
\`\`\`

to:

\`\`\`text
REJECTED
\`\`\`

The four are:

\`\`\`text
I_REMOVE_DEACTIVATE
I_DELAY_DEACTIVATE_11
I_REMOVE_REGISTER_NORMAL2
I_DELAY_REGISTER_NORMAL2_11
\`\`\`

## 6. Target-inert but temporally leveraged control

\`I_ALTER_DEACTIVATE_VALID10\` leaves the k10/t10 result unchanged, but it changes an earlier governance outcome.

Frozen first outcome divergence:

\`\`\`text
known k9 / valid t9
\`\`\`

This demonstrates that target-query inertness does not imply temporal inertness.

## 7. Policy-only leverage control

\`I_DELAY_ACTIVATE_EMERGENCY_7\` delays emergency activation to k7/t7, changing selected policy at earlier Governance Keyholes while preserving the same governance outcome across the frozen replay window.

It is therefore classified:

\`\`\`text
target class   TARGET_INERT
temporal class TEMPORAL_POLICY_LEVERAGE
\`\`\`

A policy selection difference is not automatically an outcome difference.

## 8. Ledger-only negative controls

At least two frozen interventions alter the branch ledger while changing no selected policy and no governance outcome anywhere in the replay window.

The strongest negative control is:

\`\`\`text
I_ALTER_DEACTIVATE_PAYLOAD_ONLY
\`\`\`

It changes an ignored payload field, producing a different branch ledger hash while preserving governance behavior exactly.

\`I_REMOVE_SUPERSEDE_NORMAL1\` is also ledger-only inert in the frozen witness because NORMAL@2.0 wins the selection rule even without the explicit supersession event.

## 9. Minimal intervention sets

NBG-T13 searches admissible intervention subsets in increasing cardinality.

For the declared target:

\`\`\`text
desired outcome = REJECTED
known k10 / valid t10
\`\`\`

the minimum cardinality is:

\`\`\`text
1
\`\`\`

and the complete frozen set of minimal singleton solutions is:

\`\`\`text
I_DELAY_DEACTIVATE_11
I_DELAY_REGISTER_NORMAL2_11
I_REMOVE_DEACTIVATE
I_REMOVE_REGISTER_NORMAL2
\`\`\`

No minimal set is represented as "the true cause."

## 10. Multi-intervention safety

Intervention-set construction:

- rejects empty sets;
- rejects duplicate interventions;
- rejects multiple simultaneous mutations of the same event;
- preserves the observed ledger byte-for-byte;
- produces a separately hashed counterfactual sensitivity branch.

## 11. Governance Sensitivity Atlas

The atlas is a canonical, deterministic object containing:

- observed ledger head;
- target query;
- all nine intervention rows;
- target class;
- temporal class;
- first policy divergence;
- first outcome divergence;
- observed and counterfactual policy/outcome;
- branch/fork hashes;
- explicit no-causal-attribution marker.

Rows are sorted by intervention ID and individually hashed.

## 12. Browser Atlas

The live research site exposes:

- target known-time and valid-time controls;
- outcome-changing count;
- policy-changing count;
- target-inert count;
- ledger-only inert count;
- complete intervention table;
- observed/counterfactual policy and outcome;
- first outcome-divergence Keyhole;
- minimal singleton sets for REJECTED;
- negative-control explanation;
- governed JSON export.

## 13. Qualification

Requires:

- 36/36 Python invariant checks PASS;
- 38/38 Python unit tests PASS;
- browser Governance Sensitivity Atlas acceptance PASS;
- Vite production build PASS;
- nine admissible interventions;
- observed-ledger immutability;
- fork and branch tamper detection;
- target vs temporal classification separation;
- policy-only leverage witness;
- temporal outcome-leverage witness;
- at least two ledger-only negative controls;
- complete minimal singleton set recovery;
- deterministic atlas replay;
- deterministic minimal-set replay.

## 14. Claim firewall

NBG-T13 is a sensitivity analysis over a frozen synthetic governance model.

An intervention that changes an outcome is not automatically "the cause" of that outcome in any historical or external system.
