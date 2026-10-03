# AH25 Candidate — Failure-Domain Discovery and Redundancy Auditing

AH24 shows that identical component failure marginals can hide very different redundancy value when failures are correlated.

AH25 should invert that problem:

> Given observed failure traces, can we detect when nominally separate Keyholes share a hidden failure domain?

Candidate directions:

1. generate finite event logs from independent and common-cause regimes;
2. estimate pairwise and higher-order failure dependence;
3. test whether a declared redundancy graph is contradicted by observed joint failures;
4. distinguish insufficient sample evidence from positive evidence of common-mode coupling;
5. produce a refusal state when the data are too weak to certify independence.

This would connect NBG's hidden-structure theme directly to reliability auditing: two interfaces can look separate in the architecture while remaining coupled in the failure substrate.
