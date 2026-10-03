# AH9 v0.1.0 Qualification Results

## Verdict

**PASS_AH9**

- Frozen acceptance checks: **106/106**
- Unit tests: **10/10 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Connectors: **12**
- Commuting controls: **4**
- Noncommuting witnesses: **8**
- Naive local composition correct: **4/12**
- Basepoint-transported composition correct: **12/12**

## Core identity

For two neighboring plaquettes with right-loop basepoint connector \(T\):

\[
G_{\partial}=(TBT^{-1})A.
\]

The naive rule

\[
BA
\]

matches the directly computed outer boundary iff

\[
TB=BT.
\]

Therefore the exact transport defect is

\[
D_T
=
G_{\partial}-BA
=
(TBT^{-1}-B)A.
\]

## Primary unequal-residue witness

For \(T=BA\):

\[
G_{\partial}
=
\begin{pmatrix}
3&2\\
4&3
\end{pmatrix},
\]

while

\[
G_{\rm naive}
=
\begin{pmatrix}
1&1\\
1&2
\end{pmatrix}.
\]

Their traces are 6 and 3 respectively.

## Exact-cancellation witness

For connector \(T=S\), the correctly transported outer loop is exactly identity:

\[
G_{\partial}=I,
\]

while the naive local product is nonidentity.

So omitting basepoint transport can change even the classification of a global boundary as trivial or nontrivial.

## Basepoint covariance

For a conjugate change of basepoint,

\[
G' = C^{-1}G C,
\]

the exact matrix representation changes while trace and determinant remain invariant in all frozen cases.

## Interpretation

AH9 upgrades AH8's balanced local/global cancellation result into a basepoint-aware local-to-global composition rule.

The result is finite and algebraic. It does not establish physical curvature or spacetime holonomy.
