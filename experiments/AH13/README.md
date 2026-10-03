# NBG-AH13 v0.1.0 — Authorized Query Memory

AH12 established that memory sufficiency depends on the future query family.

AH13 adds an authority boundary:

[
\mathcal Q_{\rm authorized}
\subseteq
\mathcal Q_{\rm capable}.
]

The same substrate can retain enough information to answer the full frozen query tuple `(G,H2,H3,P2)`, while a restricted role retains only the coarsest preregistered descriptor sufficient for its authorized query family.

Frozen outcome:

- **PASS_AH13**
- **41/41** acceptance checks
- **15/15** unit tests
- replay exact
- frozen hashes unchanged
- 48 histories

This is a finite retention-policy toy model. It is not a complete access-control, privacy, secure-deletion, or cryptographic system.
