# NBG-AH10 v0.1.0 — Three-Plaquette Transport and Composition Order

AH9 established that two neighboring local loop operators defined at different basepoints must be transported to a common basepoint before composition.

AH10 extends that result to a three-plaquette chain.

The core test is whether the direct outer loop equals both transported parenthesizations:

[
G_{\partial}
=
H_3^{(0)}\bigl(H_2^{(0)}H_1\bigr)
=
\bigl(H_3^{(0)}H_2^{(0)}\bigr)H_1.
]

The package also freezes intentionally wrong reconstructions that omit connector history.

Frozen result: **PASS_AH10 · 158/158 checks · 11/11 tests · replay exact**.

This is a finite algebraic toy model. It does not claim physical spacetime curvature, gauge transport, or cosmological structure.
