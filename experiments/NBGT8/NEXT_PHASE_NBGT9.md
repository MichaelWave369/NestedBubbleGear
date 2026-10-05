# NBG-T9 Candidate — Evidence Bundle Import / Export + Source Registry

NBG-T8 qualifies the operator capture path and governed review queue.

NBG-T9 should make evidence bundles portable between machines and reviewers without weakening provenance.

Candidate scope:

1. signed or hash-chained evidence-bundle manifest;
2. source registry with stable source IDs and declared independence groups;
3. import validation before any bundle enters a review queue;
4. duplicate / mirror detection across imported bundles;
5. content-addressed storage reuse;
6. source drift history per stable source;
7. reviewer attribution and decision-chain export;
8. merge semantics for independently reviewed bundles;
9. conflict-preserving import when reviewers disagree;
10. deterministic offline replay after export/import round-trip.

The import path must never grant trust merely because a bundle is well-formed.
