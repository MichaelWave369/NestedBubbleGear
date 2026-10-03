# NBG-AH9 v0.1.0 — Basepoint Transport and Local-to-Global Composition

AH8 showed a deliberately balanced case in which two neighboring nontrivial plaquettes cancel to an exactly trivial outer boundary.

AH9 asks the harder question:

> If neighboring plaquette loops are defined at different basepoints, can their local operators be composed directly, or must one first be transported to a common basepoint?

The frozen answer in this finite matrix model is:

\[
G_{\partial}=(TBT^{-1})A
\]

rather than the naive

\[
G_{\rm naive}=BA.
\]

The naive composition agrees with the directly computed outer boundary **iff**

\[
TB=BT.
\]

This package is a finite algebraic toy model. "Plaquette", "transport", and "holonomy" are operational names here; no physical spacetime curvature is claimed.
