# NBG-AH19 v0.1.0 — Authority Access Structures and Minimal Coalition Lattices

AH18 showed that equal-sized authority coalitions can have different reconstruction power.

AH19 enumerates the entire coalition space

\[
2^{\{E_1,E_2,E_3\}}
\]

and defines a task-relative mathematical access structure:

\[
\mathcal A_Q
=
\left\{
C\subseteq \{E_1,E_2,E_3\}:
H(Q\mid D_{\rm local},C)=0
\right\}.
\]

The experiment freezes four tasks:

- full \(H_2\) reconstruction;
- ROUTE \(\to\) GLOBAL reauthorization;
- DOWNSTREAM \(\to\) ROUTE reauthorization;
- a coarser interface alarm that asks only whether \(H_2\) is the third frozen class.

The first three tasks have the same minimal capable coalitions:

\[
\{E_1,E_2\},
\qquad
\{E_2,E_3\},
\]

so \(E_2\) is mandatory.

The coarse alarm has different minimal coalitions:

\[
\{E_1\},
\qquad
\{E_3\},
\]

so no Keyhole is mandatory.

AH19 also overlays upward-closed policy authorization as a strict subfamily of mathematical capability.

This is a finite information-partition/access-structure result, not cryptographic threshold security.
