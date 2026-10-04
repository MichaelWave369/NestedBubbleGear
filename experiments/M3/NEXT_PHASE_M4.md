# M4 Candidate — Metamorphic Invariants

M3 kills frozen deliberately wrong implementations.

M4 should test whether valid results survive **representation changes** that should not affect meaning.

Candidate metamorphic relations:

1. rename principals bijectively;
2. rename root domains bijectively;
3. permute logical seat labels;
4. reorder minimal-success coalition listings;
5. reorder hidden-state enumeration;
6. duplicate observationally equivalent states with proportional weights;
7. add panel-independent metadata to observer descriptors;
8. reorder event receipt fields / canonical serialization inputs before normalization.

Expected invariant classes:

- cut cardinalities and isomorphism classes unchanged;
- root thresholds unchanged;
- certification status unchanged;
- false-advertisement counts unchanged;
- exact reconstruction unchanged;
- conditional entropy unchanged under pure relabeling;
- mediated privacy unchanged under panel-independent metadata.

The goal is to catch code that accidentally depends on names, ordering, or representation rather than structure.
