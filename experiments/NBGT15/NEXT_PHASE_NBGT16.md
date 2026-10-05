# NBG-T16 Candidate — Keyhole Robustness + Observer Failure

NBG-T15 qualifies static and adaptive observer synthesis.

NBG-T16 should ask:

\`\`\`text
If the synthesized observer loses or corrupts a Keyhole,
which distinctions survive and which collapse?
\`\`\`

Candidate scope:

1. treat synthesized Keyholes as an observer dependency structure;
2. enumerate single-Keyhole and multi-Keyhole failures;
3. compute minimal observer failure cuts that make a previously separable family ambiguous;
4. distinguish static-observer redundancy from adaptive-tree resilience;
5. model missing, stale, and corrupted query responses separately;
6. refuse silent fallback from JOINT to POLICY or OUTCOME channels;
7. preserve the exact history pairs that become re-merged after observer failure;
8. synthesize smallest redundant observer augmentations that survive one declared failure;
9. emit observer-resilience receipts and failure-cut hashes;
10. expose a browser failure simulator over the T15 synthesized observer.

This would connect the temporal Keyhole line to the existing AH criticality/resilience work without collapsing their different semantics.
