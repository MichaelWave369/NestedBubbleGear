# NBG-AH18 v0.1.0 — Quorum Topology and Coalition-Dependent Authority

AH17 established a 2-of-2 split-authority reconstruction.

AH18 adds a third Keyhole and asks a more careful question:

> Is quorum determined only by how many authorities participate, or by which authorities participate?

The frozen result is coalition-dependent.

Three authority Keyholes are defined from the hidden \(H_2\) class:

\[
E_1=(H_2)_{00},
\qquad
E_2=(H_2)_{10},
\qquad
E_3=(H_2)_{11}.
\]

Every singleton is insufficient.

Two pairs are sufficient:

\[
\{E_1,E_2\},
\qquad
\{E_2,E_3\}.
\]

But the equally large pair

\[
\{E_1,E_3\}
\]

is still insufficient because \(E_1\) and \(E_3\) induce the same two-class partition of the frozen \(H_2\) state.

So quorum is a property of the **coalition topology**, not merely cardinality.

This is an information-partition toy model, not a cryptographic threshold scheme.
