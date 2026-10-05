# NBG-T10 Frozen Specification — Trust Policies + Conflict Resolution Receipts

## 1. Goal

NBG-T10 qualifies explicit governance policies over preserved NBG-T9 reviewer disagreement.

The governing rule is:

\`\`\`text
policy != truth
resolution != history rewrite
disagreement remains evidence
\`\`\`

## 2. Reviewer-role registry

Every reviewer has explicit:

\`\`\`text
reviewer_id
role
authority
active
\`\`\`

The registry is canonicalized and SHA-256 hashed.

Unknown reviewers are refused rather than silently treated as trusted participants.

## 3. Policy as data

Every policy is an explicit data object containing:

\`\`\`text
policy_id
policy_version
mode
eligible_roles
min_participants
accept_threshold
reject_threshold
weight_mode
effective_from
effective_until
description
policy_sha256
\`\`\`

The evaluator is generic. Policy-specific reviewer roles, thresholds, weights, quorum, and validity window are data.

## 4. Frozen policy modes

NBG-T10 freezes two generic modes:

\`\`\`text
WEIGHTED_THRESHOLD
UNANIMOUS
\`\`\`

Weights may be unit weights or explicit reviewer-authority values.

## 5. Historical decision firewall

NBG-T9 review decisions remain byte-identical before and after resolution.

A policy emits a separate resolution receipt. It never edits, deletes, or supersedes the historical reviewer statements.

## 6. Resolution receipt

Every applied policy emits:

\`\`\`text
capture_id
known_time
bundle_manifest_hash
reviewer_registry_sha256
policy_id
policy_version
policy_sha256
input_decision_hashes
eligible_reviewer_ids
accept_score
reject_score
governance_outcome
reason
truth_claim
receipt_hash
\`\`\`

## 7. Frozen governance outcomes

\`\`\`text
ACCEPTED
REJECTED
ABSTAIN
ABSTAIN_CONFLICT
INSUFFICIENT_AUTHORITY
\`\`\`

These are governance outcomes under a named policy. They are not objective truth labels.

## 8. Side-by-side policy witness

The same preserved T9 conflict:

\`\`\`text
BOB  ACCEPT
CAROL REJECT
\`\`\`

produces different legitimate governance outcomes under different explicit policies:

\`\`\`text
POLICY_WEIGHTED_AUTHORITY -> REJECTED
POLICY_UNANIMOUS          -> ABSTAIN_CONFLICT
POLICY_RESEARCHER_QUORUM  -> INSUFFICIENT_AUTHORITY
\`\`\`

All three consume the same input decision hashes.

## 9. Stale / malicious-input controls

Resolution refuses:

- stale or not-yet-effective policies;
- policy hash tampering;
- bundle-manifest expectation mismatch;
- reviewer-registry expectation mismatch;
- unknown reviewers;
- unavailable policy during receipt replay.

## 10. Deterministic replay

A resolution receipt can be replayed only when the same:

- portable T9 bundle;
- reviewer registry;
- policy ID/version;
- policy bytes;
- knowledge cutoff

are available.

Rebuilt receipt bytes must match exactly.

## 11. Frozen witness

The witness contains four reviewers:

\`\`\`text
ALICE  RESEARCHER authority 1
BOB    RESEARCHER authority 1
CAROL  AUDITOR    authority 2
DAVE   OBSERVER   authority 0
\`\`\`

The opposing capture remains a T9 \`REVIEW_CONFLICT\`.

Under authority weighting, BOB contributes ACCEPT score 1 and CAROL contributes REJECT score 2, producing \`REJECTED\`.

Under unanimity, the same inputs produce \`ABSTAIN_CONFLICT\`.

Under two-researcher quorum, only BOB is eligible, producing \`INSUFFICIENT_AUTHORITY\`.

## 12. Qualification

Requires:

- 24/24 invariant checks PASS;
- 27/27 unit tests PASS;
- reviewer registry validation;
- explicit policy hashing;
- policy truth-boundary marker;
- multiple-policy side-by-side outcomes;
- same input decision hashes across policy comparison;
- stale-policy refusal;
- manifest expectation refusal;
- registry expectation refusal;
- historical decision immutability;
- exact receipt replay;
- receipt tamper detection;
- deterministic resolution.

## 13. Claim firewall

NBG-T10 demonstrates explicit governance semantics over synthetic disagreement.

No policy outcome is represented as objective historical truth.
