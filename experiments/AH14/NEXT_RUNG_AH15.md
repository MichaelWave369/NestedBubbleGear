# AH15 Candidate — Revocation Chains and Non-Commuting Downgrades

AH14 tests one-step downgrades from full-capability memory to restricted role memories.

AH15 should test multi-step authority changes.

Compare a direct downgrade

[
D_{0\to2}
]

with a sequential downgrade

[
D_{1\to2}\circ D_{0\to1}.
]

Questions:

1. Do sequential downgrades equal direct downgrade?
2. Which downgrade paths commute?
3. Can an intermediate receipt retain distinctions later meant to be discarded?
4. Can later re-authorization recover information an earlier downgrade genuinely removed?
5. When is re-authorization impossible without a higher-authority external store?

This turns the authorization-memory hierarchy into an explicit state machine rather than a one-step policy table.
