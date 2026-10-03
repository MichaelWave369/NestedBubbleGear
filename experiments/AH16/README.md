# NBG-AH16 v0.1.0 — Reauthorization with an External Authority Store

AH15 showed that real local forgetting can make later role changes impossible from local memory alone.

AH16 adds a separately governed higher-authority store.

The actor holds minimized local memory:

[
D_{\rm local}.
]

The authority store retains full-capability action memory:

[
D_{\rm escrow}=(H_2,H_3).
]

For a newly authorized query (Q_{\rm new}), AH16 tests cases where:

[
H(Q_{\rm new}mid D_{\rm local})>0
]

but

[
H(Q_{\rm new}mid D_{\rm local},D_{\rm escrow})=0.
]

The handoff releases only the newly authorized descriptor rather than the full escrow state.

This is a finite information/partition toy model. "Escrow" means a separately governed retained representation, not a cryptographically isolated secure store.
