# NBG-T9 Frozen Specification — Portable Evidence Bundles + Source Registry

## 1. Goal

NBG-T9 makes governed evidence portable across machines and reviewers without converting a well-formed bundle into trusted evidence.

The governing rule is:

\`\`\`text
portable != trusted
valid != accepted
merge != overwrite disagreement
\`\`\`

## 2. Stable source registry

Every source has a stable \`source_id\` and explicit:

\`\`\`text
label
locator
source_kind
independence_group
\`\`\`

Mirrors may point at another stable source ID, but different URLs never create independence by themselves.

The complete registry is canonicalized and SHA-256 hashed.

## 3. Content-addressed evidence

Captured bytes are stored by:

\`\`\`text
content_sha256
\`\`\`

Bundle manifests reference those objects by digest and byte length.

Importing the same bytes twice reuses the existing object instead of duplicating it.

## 4. Bundle manifest

Every portable evidence bundle contains:

\`\`\`text
bundle_id
created_at
parent_manifest_hash
payload_sha256
registry_sha256
decision_head
object_count
manifest_hash
\`\`\`

The parent hash can record an export lineage, while the manifest hash protects the current package.

## 5. Import gate

Before a bundle may enter a review workflow, import validation checks:

- manifest hash;
- payload hash;
- source-registry hash;
- content object hashes and lengths;
- capture hashes;
- review-decision chain.

A valid import returns:

\`\`\`text
trust_state = REVIEW_REQUIRED
\`\`\`

Well-formed bytes do not grant epistemic trust.

## 6. Duplicate / mirror detection

Captures with identical content SHA-256 are grouped.

The frozen witness includes one original and one mirror with the same content and the same independence group.

They therefore count as one independent group, not two corroborating sources.

## 7. Stable-source drift

Captures associated with the same stable source ID are ordered by retrieval time.

Different content hashes produce:

\`\`\`text
DRIFT_DETECTED
\`\`\`

The drift record preserves both capture IDs and both content digests.

## 8. Reviewer decision chains

Reviewer decisions are attributed and hash-chained.

When bundles are merged, all unique reviewer statements are preserved and re-chained canonically for the merged export.

## 9. Reviewer disagreement

If independent review bundles contain both \`ACCEPT\` and \`REJECT\` for the same capture, the merged state is:

\`\`\`text
REVIEW_CONFLICT
\`\`\`

No last-write-wins rule is permitted.

A conflicted capture does not contribute to the derived support/opposition state until a later governance rule explicitly resolves that conflict.

## 10. Frozen witness

The fixture contains:

- 3 stable source IDs;
- 3 independence declarations across 2 actual independence groups;
- 4 captures;
- 3 unique content objects;
- 1 duplicate/mirror cluster;
- 1 stable-source drift event;
- 3 reviewer identities;
- 4 unique review decisions;
- one ACCEPT/REJECT reviewer conflict on the opposing capture.

The derived source status remains:

\`\`\`text
ALLEGED
\`\`\`

The derived review status remains:

\`\`\`text
CORROBORATED
\`\`\`

because the opposing capture is in \`REVIEW_CONFLICT\` and is not silently applied.

## 11. Portable round trip

A portable export serializes content-addressed bytes as deterministic hex strings.

Export → import must preserve:

- manifest exactly;
- payload exactly;
- content bytes exactly;
- deterministic offline derived state.

## 12. Qualification

Requires:

- 22/22 invariant checks PASS;
- 25/25 unit tests PASS;
- registry hash validation;
- manifest/payload/object tamper detection;
- content-addressed storage reuse;
- mirror detection without false independence;
- stable-source drift detection;
- reviewer attribution;
- disagreement preservation;
- no last-write-wins collapse;
- immutable source status;
- canonical merged decision chain;
- portable round-trip exactness;
- deterministic offline replay;
- merge-order invariance;
- replay exact.

## 13. Claim firewall

All sources and reviewers in the frozen fixture are synthetic.

NBG-T9 qualifies portability, provenance, deduplication, and merge semantics. It does not certify any real historical source or claim.
