# NBG-T11 Frozen Specification — Policy Ledger + Governance Keyholes

## 1. Goal

NBG-T11 makes governance itself temporal, replayable, and inspectable.

The governing rule is:

\`\`\`text
policy history has two clocks
later policy knowledge != earlier policy knowledge
later policy changes != rewritten earlier resolutions
\`\`\`

## 2. Temporal policy record

Each policy version contains:

\`\`\`text
policy_version_id
family_id
revision
policy_kind
valid_from
valid_until
known_at
priority
t10_policy
record_hash
\`\`\`

\`valid time\` says when the policy belongs in the modeled governance world.

\`known time\` says when that policy version entered the governance ledger.

## 3. Append-only policy ledger

Frozen event types:

\`\`\`text
REGISTER_POLICY
SUPERSEDE_POLICY
ACTIVATE_EMERGENCY
DEACTIVATE_EMERGENCY
\`\`\`

Events are ordered by known time and event ID and form a SHA-256 hash chain.

## 4. Anti-hindsight policy replay

A Governance Keyhole is parameterized by:

\`\`\`text
known_cutoff
valid_time
\`\`\`

A policy version whose valid interval includes the queried valid time remains invisible when its registration was not yet known at the selected knowledge cutoff.

This is the governance analogue of the Temporal NBG anti-hindsight rule.

## 5. Supersession

A later policy may supersede an earlier policy beginning at an earlier valid time, but that supersession affects only Governance Keyholes whose knowledge cutoff includes the supersession event.

Earlier keyholes remain replayable exactly.

## 6. Emergency policy lifecycle

Emergency governance requires explicit:

\`\`\`text
ACTIVATE_EMERGENCY
DEACTIVATE_EMERGENCY
\`\`\`

Activation and deactivation have their own valid time and known time.

Later deactivation does not retroactively erase an emergency policy from historical valid-time queries that fall inside the emergency interval.

## 7. Governance Keyhole selection

At a Keyhole:

1. only registered and known policy versions are considered;
2. policy valid-time interval must include the query;
3. visible supersession events may retire normal versions;
4. active emergency policy versions take precedence;
5. otherwise the highest-priority / newest active normal version is selected.

## 8. Frozen witness

The policy history contains:

\`\`\`text
NORMAL@1.0
  valid from t1
  known at k2
  weighted-authority policy

EMERGENCY@1.0
  valid from t6
  known + activated at k6
  deactivated valid t9 / known k9
  auditor-only emergency policy

NORMAL@2.0
  valid from t7
  known at k8
  supersedes NORMAL@1.0 from valid t7
  unanimity policy
\`\`\`

Frozen Governance Keyholes:

\`\`\`text
known k5 / valid t5  -> NORMAL@1.0    -> REJECTED
known k7 / valid t7  -> EMERGENCY@1.0 -> REJECTED
known k8 / valid t7  -> EMERGENCY@1.0 -> REJECTED
known k10 / valid t10 -> NORMAL@2.0    -> ABSTAIN_CONFLICT
known k10 / valid t7  -> EMERGENCY@1.0 -> REJECTED
\`\`\`

The final row demonstrates that later knowledge of emergency deactivation at t9 does not erase the emergency policy from historical valid time t7.

## 9. Resolution receipts

Every T11 temporal resolution receipt pins:

\`\`\`text
capture_id
known_cutoff
valid_time
policy_version_id
policy_record_hash
policy_ledger_head
keyhole_hash
embedded T10 resolution receipt
truth boundary
receipt_hash
\`\`\`

The embedded T10 receipt remains pinned to the exact underlying policy version and input evidence.

## 10. Historical resolution firewall

Later ledger events never mutate earlier T11 resolution receipts.

A receipt produced at k5 remains byte-identical after policy registration, supersession, emergency activation, and emergency deactivation events become known later.

## 11. Governance bundle

Portable T11 governance bundle freezes:

- input T9 manifest;
- reviewer registry;
- temporal policy records;
- policy ledger;
- temporal resolution receipts;
- policy-ledger head;
- manifest hash.

Bundle validation checks both manifest and payload integrity.

## 12. Browser Governance Keyholes

The research site exposes two side-by-side Governance Keyholes with independent:

\`\`\`text
known-time cutoff
valid-time query
\`\`\`

The browser shows selected policy, policy mode, governance outcome, policy statuses, ledger head, append-only policy events, comparison deltas, and governed JSON export.

The browser model is a projection of the frozen witness and does not mutate the research ledger.

## 13. Qualification

Requires:

- 28/28 Python invariant checks PASS;
- 30/30 Python unit tests PASS;
- browser Governance Keyhole acceptance PASS;
- Vite production build PASS;
- bitemporal policy visibility;
- no-hindsight replay;
- explicit supersession;
- emergency activation/deactivation;
- historical emergency replay;
- selected policy pinning;
- ledger-head pinning;
- earlier receipt immutability;
- portable governance bundle validation;
- receipt replay exact;
- deterministic Keyhole replay.

## 14. Claim firewall

NBG-T11 models the history of synthetic governance rules.

Governance outcomes remain policy-relative decisions, not objective truth labels.
