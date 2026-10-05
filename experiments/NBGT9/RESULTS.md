# NBG-T9 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT9**

- frozen invariant checks: **22/22 PASS**
- unit tests: **25/25 PASS**
- portable export/import exact: **PASS**
- merge order invariant: **PASS**
- offline replay deterministic: **PASS**
- replay exact: **PASS**

## Frozen witness

```text
sources                  3
duplicate clusters       1
drift events             1
merged decisions         4
opposing review state    REVIEW_CONFLICT
source status            ALLEGED
review status            CORROBORATED
first import objects     3 added
second import objects    3 reused
import trust state       REVIEW_REQUIRED
```

The synthetic mirror carries identical bytes and the same independence group as the original, so it remains visible provenance without manufacturing an additional independent source.

The opposing capture receives both ACCEPT and REJECT decisions from different reviewers. The merge preserves both statements as `REVIEW_CONFLICT`; it does not choose whichever record happened to arrive last.

## Frozen file hashes

```text
SPEC.md             c22d9026b3dfddfe3c47aa922ed8e927f8154b60a44d6c422618cd4ea4da2781
src/nbgt9.py        5248d6cdae4b8e8bd84c018711c61efd4ee328cb55a57cc057fc2393c18775bb
tests/test_nbgt9.py 994eaf7a77551cce7e79c3edc7adf5a371f09a4ed9ce76b0e7e04abb58f6bbf0
```

## Generated artifact hashes

```text
result.json             eb876ffd3ff7f602d410b0eec990ad33e23fc735b6023f6c42bd946bccd23801
source_registry.json    0a55c91c02d6673014f1e50ba539de35fec60e5ceffe207b0890251b5af93cd6
duplicate_clusters.json b7c62912dcedccc232f5b9909df6a89798bd1fdc48e3ac8210ff0f7526d6f327
drift_history.json      87728cf6102fa882d91fed3d0b3fab44de2244a5a4ba1bf40594b60fb42d96f7
merged_bundle.json      d8f594c6af14a044a01035a78bc44046bbd3f1fd831c3200e72f7296663db5b1
merged_claim_state.json 29c43d26a761e78739efa7fce4f655054af9dd0b823b5fbd4e0872073041a1a4
```

## Claim boundary

All evidence and reviewer identities are synthetic. This rung demonstrates portability, provenance, deduplication, drift history, and disagreement-preserving merge behavior only.
