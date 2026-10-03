# NBG-AH15 v0.1.0 — Revocation Chains, Path Independence, and Reauthorization Barriers

AH14 tested one-step downgrade from full-capability memory to restricted-role memory.

AH15 tests multi-step authority changes.

It separates three cases:

1. **monotone revocation**, where each later query set is a subset of the previous one;
2. **lateral role switching**, where a later role asks for distinctions already discarded;
3. **receipt-chain leakage**, where an intermediate audit commitment can preserve distinctions that the final policy meant to drop.

The core monotone chain is:

[
{G,H_2,H_3,P_2}
supset
{H_3,P_2}
supset
{H_3}.
]

Frozen result target:

[
D_{m direct}
=
D_{m sequential}
]

for the final H3-only memory.

This is a finite partition/retention toy model, not a secure deletion system.
