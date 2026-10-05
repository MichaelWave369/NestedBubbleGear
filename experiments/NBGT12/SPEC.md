# NBG-T12 Frozen Specification — Governance Branches + Counterfactual Policy Replay

## 1. Goal

NBG-T12 introduces explicit counterfactual governance branches while preserving the NBG-T11 observed policy ledger as the immutable reference product.

The governing rule is:

\`\`\`text
observed != counterfactual
fork != edit
model divergence != historical fact
\`\`\`

## 2. Observed-ledger firewall

The observed NBG-T11 policy ledger is never edited in place.

Counterfactual construction:

1. validates the observed ledger;
2. hashes the exact target event;
3. emits a fork receipt;
4. derives a separate branch ledger;
5. verifies the observed ledger remains byte-identical.

## 3. Frozen fork operations

NBG-T12 freezes three explicit single-event interventions:

\`\`\`text
REMOVE_EVENT
DELAY_EVENT
ALTER_EVENT
\`\`\`

Event identity fields and event type cannot be silently rewritten.

\`DELAY_EVENT\` may only move known time and/or valid time later.

\`ALTER_EVENT\` may change declared temporal or payload fields but remains explicitly counterfactual.

## 4. Fork receipt

Every branch begins with a hashed receipt containing:

\`\`\`text
branch_id
branch_kind = COUNTERFACTUAL
observed_ledger_head
target_event_id
target_event_hash
operation
patch
reason
truth boundary
fork_hash
\`\`\`

The receipt pins the exact observed event from which the branch departs.

## 5. Frozen witness intervention

The focal observed event is:

\`\`\`text
EV_DEACTIVATE_EMERGENCY
known k9
valid t9
target EMERGENCY@1.0
\`\`\`

The three frozen branches are:

\`\`\`text
CF_REMOVE_DEACTIVATE
  remove EV_DEACTIVATE_EMERGENCY

CF_DELAY_DEACTIVATE
  move known/valid time to k11/t11

CF_ALTER_DEACTIVATE
  keep known k9 but make deactivation valid at t10
\`\`\`

## 6. Same evidence and reviewer decisions

The T9/T10 evidence and reviewer inputs are held fixed.

The counterfactual intervention changes governance history only.

This prevents a branch from smuggling in different evidence while claiming to measure policy sensitivity.

## 7. Observed vs counterfactual replay

At the focal \`k10/t10\` Keyhole:

\`\`\`text
OBSERVED
  selected policy = NORMAL@2.0
  outcome         = ABSTAIN_CONFLICT

REMOVE DEACTIVATION BRANCH
  selected policy = EMERGENCY@1.0
  outcome         = REJECTED

DELAY DEACTIVATION BRANCH
  selected policy = EMERGENCY@1.0
  outcome         = REJECTED
\`\`\`

For the altered-validity branch, \`k9/t9\` remains under the emergency policy and resolves to \`REJECTED\`.

## 8. Branch-specific resolution receipt

Every counterfactual resolution pins:

\`\`\`text
branch_id
branch_hash
fork_hash
observed_ledger_head
branch_ledger_head
capture_id
known_cutoff
valid_time
evidence_known_cutoff
embedded counterfactual T11 receipt
truth boundary
receipt_hash
\`\`\`

A branch result therefore cannot masquerade as an observed T11 result.

## 9. Divergence summary

NBG-T12 scans replayable Governance Keyholes in canonical known-time / valid-time order.

The frozen witness identifies:

\`\`\`text
altered event            EV_DEACTIVATE_EMERGENCY
first outcome divergence known k9 / valid t9
\`\`\`

The summary pins both the altered observed event and the first Keyhole whose governance outcome differs.

## 10. Counterfactual bundle

A portable branch bundle contains:

- input T9 manifest;
- reviewer registry;
- policy records;
- immutable observed policy ledger;
- fork receipt;
- counterfactual branch ledger;
- branch-specific resolution receipts;
- divergence summary;
- explicit counterfactual truth boundary.

The manifest hashes the full payload and pins both observed and branch ledger heads.

## 11. Portable replay

Export/import must preserve the counterfactual bundle exactly.

Deterministic replay must reconstruct the same:

- branch ledger;
- branch hash;
- counterfactual resolution receipt;
- divergence summary;
- bundle manifest.

## 12. Browser explorer

The live research site exposes:

- three frozen fork operations;
- independent known-time / valid-time controls;
- observed and counterfactual policy selection;
- observed and counterfactual governance outcomes;
- policy/outcome change flags;
- altered-event identity;
- first divergence Keyhole;
- governed counterfactual JSON export.

The browser clearly marks every branch as:

\`\`\`text
COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY
\`\`\`

## 13. Qualification

Requires:

- 32/32 Python invariant checks PASS;
- 34/34 Python unit tests PASS;
- browser counterfactual-governance acceptance PASS;
- Vite production build PASS;
- observed-ledger byte immutability;
- fork receipt tamper detection;
- remove/delay/alter controls;
- branch hash validation;
- branch-specific receipts;
- observed/counterfactual outcome divergence;
- first-divergence identification;
- portable bundle validation;
- exact portable round trip;
- deterministic branch replay;
- deterministic divergence replay.

## 14. Claim firewall

A counterfactual branch is a model intervention.

It does not claim that the counterfactual branch is what history would actually have done, nor that its governance outcome is objective truth.
