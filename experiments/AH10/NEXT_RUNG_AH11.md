# AH11 Candidate — Path Compression and Minimal Connector Memory

AH10 establishes that full connector history is sufficient for exact reconstruction across three plaquettes.

The next question is whether the entire raw path must be retained.

Given

[
G_{\partial}
=
(T_1T_2)H_3(T_1T_2)^{-1}
(T_1H_2T_1^{-1})
H_1,
]

what is the **minimal sufficient connector residue** required to reconstruct the same global operator?

Candidate comparisons:

1. raw connector history ((T_1,T_2));
2. cumulative products ((T_1,T_1T_2));
3. conjugacy classes only;
4. compressed symbolic labels;
5. deliberately lossy unordered connector inventory.

This is the natural bridge from transport geometry to the memory hypothesis:

> Memory = minimal retained residue required to preserve future distinctions.

AH11 should test exact reconstruction after path compression rather than merely adding a fourth plaquette.
