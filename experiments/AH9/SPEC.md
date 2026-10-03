# AH9 Frozen Specification

## 1. Purpose

Test local-to-global composition for two adjacent plaquettes whose local loop operators are based at different vertices.

AH9 is designed to distinguish:

1. correct basepoint-aware composition;
2. naive multiplication of local loop matrices;
3. the exact condition under which the naive rule happens to work.

## 2. Matrix convention

States are row vectors and edge transports multiply in traversal order.

All frozen matrices lie in \(SL(2,\mathbb Z)\).

Define

\[
A=
\begin{pmatrix}
1&1\\
0&1
\end{pmatrix},
\qquad
B=
\begin{pmatrix}
1&0\\
1&1
\end{pmatrix}.
\]

For each frozen connector \(T\), construct two adjacent plaquettes with edge matrices

\[
a=T,\quad b=B,\quad d=e=f=g=I,
\]

and

\[
c=A^{-1}T.
\]

The left plaquette, based at the outer basepoint, is

\[
H_L=a\,d\,f^{-1}\,c^{-1}=A.
\]

The right plaquette is based one vertex away:

\[
H_R=b\,e\,g^{-1}\,d^{-1}=B.
\]

## 3. Direct outer boundary

The complete outer loop is computed directly from its six outer edges:

\[
G_{\partial}
=
a\,b\,e\,g^{-1}\,f^{-1}\,c^{-1}.
\]

By construction,

\[
G_{\partial}
=
TBT^{-1}A.
\]

## 4. Transported local composition

The right plaquette must be transported back to the left/base vertex:

\[
B^{(0)}=TBT^{-1}.
\]

Then

\[
G_{\rm transported}=B^{(0)}A.
\]

Acceptance requires

\[
G_{\partial}=G_{\rm transported}
\]

for every frozen connector.

## 5. Naive composition

Define

\[
G_{\rm naive}=BA.
\]

Since \(A\) is invertible,

\[
G_{\rm transported}=G_{\rm naive}
\]

iff

\[
TBT^{-1}=B,
\]

equivalently

\[
TB=BT.
\]

Thus the exact local-to-global transport defect is

\[
D_T
=
G_{\partial}-G_{\rm naive}
=
(TBT^{-1}-B)A.
\]

## 6. Frozen connector suite

The 12 connectors are:

- `I`
- `B`
- `B2`
- `B_INV`
- `A`
- `A2`
- `A_INV`
- `AB`
- `BA`
- `S`
- `AS`
- `SA`

where

\[
S=
\begin{pmatrix}
0&-1\\
1&0
\end{pmatrix}.
\]

Expected classification:

- 4 commuting connectors: `I`, `B`, `B2`, `B_INV`
- 8 noncommuting connectors: all remaining cases

Therefore:

- 4/12: naive composition is accidentally correct;
- 8/12: naive composition fails;
- 12/12: transported composition equals the direct outer boundary.

## 7. Primary unequal-residue witness

For connector

\[
T=BA=
\begin{pmatrix}
1&1\\
1&2
\end{pmatrix},
\]

the correct outer operator is

\[
G_{\partial}
=
\begin{pmatrix}
3&2\\
4&3
\end{pmatrix},
\]

while the naive composition is

\[
BA=
\begin{pmatrix}
1&1\\
1&2
\end{pmatrix}.
\]

Their traces differ:

\[
\operatorname{tr}(G_{\partial})=6,
\qquad
\operatorname{tr}(G_{\rm naive})=3.
\]

This is the main nontrivial local-to-global witness.

## 8. Exact-cancellation transport witness

For

\[
T=S,
\]

the correctly transported outer loop is exactly

\[
G_{\partial}=I,
\]

while the naive local product remains

\[
BA\neq I.
\]

So even whether the global boundary is trivial can depend on correct basepoint transport.

## 9. Basepoint covariance

For a fixed change-of-basepoint matrix \(C\), define

\[
G' = C^{-1}G_{\partial}C.
\]

The exact matrix representation changes, but conjugacy invariants satisfy

\[
\det G'=\det G_{\partial},
\qquad
\operatorname{tr}G'=\operatorname{tr}G_{\partial}.
\]

AH9 therefore distinguishes:
- representation at a chosen basepoint;
- transported local composition;
- basepoint-invariant conjugacy data.

## 10. Claim firewall

AH9 proves only finite matrix identities in the frozen construction.

It does not establish:
- physical curvature;
- gauge fields in nature;
- spacetime holonomy;
- cosmological nested bubbles.

The result is an operational warning: local loop operators at different basepoints cannot generally be composed without transport.
