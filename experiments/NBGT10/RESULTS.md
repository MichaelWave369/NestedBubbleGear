# NBG-T10 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT10**

- invariant checks: **24/24 PASS**
- unit tests: **27/27 PASS**
- reviewer registry validation: **PASS**
- policy hashing: **PASS**
- stale-policy refusal: **PASS**
- bundle/registry expectation controls: **PASS**
- historical decision immutability: **PASS**
- receipt replay exact: **PASS**
- receipt tamper detection: **PASS**
- deterministic resolution: **PASS**

## Frozen side-by-side witness

```text
input review state          REVIEW_CONFLICT

POLICY_WEIGHTED_AUTHORITY   REJECTED
POLICY_UNANIMOUS            ABSTAIN_CONFLICT
POLICY_RESEARCHER_QUORUM    INSUFFICIENT_AUTHORITY

single-researcher support   ACCEPTED
```

All three conflict policies consume the same preserved T9 input decision hashes. The different outcomes therefore belong to the named governance policies, not to a rewritten evidence ledger.

## Frozen file hashes

```text
SPEC.md              794e414be6e7a7ddd9f133069fd80e734d2dcb12044686e3067c063f5d399091
src/nbgt10.py        4e903147072b77903f0ab0b414f0d5a017802dd6a3f8882f98cede4dc2262332
tests/test_nbgt10.py 0ef075d686b48ff10aff3c21306858563621ef2a194a6aefae3ae363ad2329c2
```

## Generated artifact hashes

```text
result.json                       0f3aad18c0751afdafdde28a402d5dfc9727d832e34f7d250ff6a8acad5d4a0b
reviewer_registry.json            ea95e0ffb759e8297c34a8297ee05156b89d1a4192c67bbad3b487a0891aaaee
policies.json                     d7783c5169b221598273c785250722173a224f93f856195103979b34ab8f30aa
policy_comparison.json            b051a0655d6d04d7cba18c7985c7a65698b848f3a538e4661357dd154626b03e
weighted_resolution_receipt.json b51a2fd662a362775ac504e7abffa317cb4ab00ffd1ede6e12241bd4252fd2a7
input_bundle_manifest.json        5eba206fa1bdd13e414553b30ab8d35c664ec5c281c230a24535272e8736fbe0
```

## Claim boundary

Every outcome is explicitly a governance result under a named synthetic policy. NBG-T10 does not represent policy output as objective historical truth.
