# AH10 Frozen Specification

## 1. Purpose

Test whether a three-plaquette local-to-global composition is:

1. exactly reconstructible from local loops plus connector paths;
2. associative when basepoint transport is handled correctly;
3. corrupted when an intermediate connector is omitted.

## 2. Matrix convention

States are row vectors. Edge transports multiply in traversal order.

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
\end{pmatrix},
\]

and

\[
C=AB=
\begin{pmatrix}
2&1\\
1&1
\end{pmatrix}.
\]

The three frozen local plaquette loops are

\[
H_1=A,\qquad H_2=B,\qquad H_3=C.
\]

## 3. Explicit three-cell edge complex

Let the top edges be

\[
t_1=T_1,\qquad t_2=T_2,\qquad t_3=I.
\]

All vertical edges are identity.

Choose the bottom edges so that each local plaquette has the frozen local loop:

\[
b_1=A^{-1}T_1,
\]

\[
b_2=B^{-1}T_2,
\]

\[
b_3=C^{-1}.
\]

Then the local loops at their native basepoints are exactly:

\[
t_1b_1^{-1}=A,
\]

\[
t_2b_2^{-1}=B,
\]

\[
t_3b_3^{-1}=C.
\]

## 4. Direct outer boundary

The complete outer loop is computed edge-by-edge:

\[
G_{\partial}
=
t_1t_2t_3
b_3^{-1}
b_2^{-1}
b_1^{-1}.
\]

Substitution yields

\[
G_{\partial}
=
T_1T_2CT_2^{-1}BT_1^{-1}A.
\]

## 5. Common-basepoint transport

Transport the second loop to basepoint 0:

\[
H_2^{(0)}
=
T_1BT_1^{-1}.
\]

Transport the third loop along the cumulative connector path:

\[
H_3^{(0)}
=
(T_1T_2)C(T_1T_2)^{-1}.
\]

Correct global reconstruction is

\[
G_{\rm transported}
=
H_3^{(0)}H_2^{(0)}H_1.
\]

Acceptance requires

\[
G_{\partial}=G_{\rm transported}.
\]

## 6. Associativity test

### Left-grouped

First compose plaquettes 1 and 2 at basepoint 0:

\[
H_{12}
=
H_2^{(0)}H_1.
\]

Then:

\[
G_L
=
H_3^{(0)}H_{12}.
\]

### Right-grouped

First compose plaquettes 2 and 3 at basepoint 1:

\[
H_{23}^{(1)}
=
(T_2CT_2^{-1})B.
\]

Transport the composite to basepoint 0:

\[
G_R
=
T_1H_{23}^{(1)}T_1^{-1}A.
\]

Acceptance requires

\[
G_L
=
G_R
=
G_{\partial}
\]

for every frozen connector pair.

## 7. Wrong reconstructions

### Naive local product

Ignore all connector paths:

\[
G_{\rm naive}
=
CBA.
\]

### Omit second connector

Incorrectly transport the third loop using \(T_1\) only:

\[
G_{\rm omit2}
=
(T_1CT_1^{-1})
(T_1BT_1^{-1})
A.
\]

### Omit first connector / use only local frame of second-to-third relation

\[
G_{\rm omit1}
=
(T_2CT_2^{-1})BA.
\]

These are frozen negative controls.

## 8. Frozen connector grid

\[
T_1,T_2
\in
\{I,A,B,S\},
\]

with

\[
S=
\begin{pmatrix}
0&-1\\
1&0
\end{pmatrix}.
\]

This gives 16 connector pairs.

Frozen expectations:

- direct outer = transported reconstruction: 16/16;
- left grouping = direct outer: 16/16;
- right grouping = direct outer: 16/16;
- naive local product = direct outer: 1/16;
- omit-second-connector reconstruction = direct outer: 4/16;
- omit-first-connector reconstruction = direct outer: 4/16.

Within this frozen connector grid, the single naive-success case is exactly the case in which both required conjugations become unnecessary.

## 9. Primary witness

For

\[
T_1=A,\qquad T_2=B,
\]

the correct outer loop is

\[
G_{\partial}
=
\begin{pmatrix}
5&3\\
3&2
\end{pmatrix},
\]

while the naive local product is

\[
CBA
=
\begin{pmatrix}
3&4\\
2&3
\end{pmatrix}.
\]

Their traces differ:

\[
7\neq6.
\]

## 10. Exact-cancellation witness

For

\[
T_1=B,\qquad T_2=S,
\]

correct transport gives

\[
G_{\partial}=I,
\]

while all three frozen wrong reconstructions are nonidentity.

Thus dropping connector history can change even whether the complete three-cell boundary is classified as globally trivial.

## 11. Basepoint covariance

For a fixed change-of-basepoint matrix \(Q\):

\[
G'=Q^{-1}G_{\partial}Q.
\]

Acceptance requires trace and determinant invariance across all 16 cases.

## 12. Claim firewall

AH10 demonstrates only finite matrix identities in an explicit three-cell complex.

It does not establish:
- physical curvature;
- gauge fields in nature;
- spacetime holonomy;
- cosmological nested domains.

The supported conclusion is narrower:

> In this frozen noncommutative transport model, local loop data are insufficient for correct global reconstruction unless the connector paths relating their basepoints are retained.
