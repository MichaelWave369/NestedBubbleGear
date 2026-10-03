# AH10 v0.1.0 Qualification Results

## Verdict

**PASS_AH10**

- Frozen acceptance checks: **158/158**
- Unit tests: **11/11 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Connector pairs: **16**
- Correct transported reconstruction: **16/16**
- Left-grouped reconstruction: **16/16**
- Right-grouped reconstruction: **16/16**
- Naive local product accidentally correct: **1/16**
- Omit-second-connector reconstruction accidentally correct: **4/16**
- Omit-first-connector reconstruction accidentally correct: **4/16**

## Core result

For three local loops (H_1=A), (H_2=B), (H_3=C=AB):

[
G_{\partial}
=
(T_1T_2)C(T_1T_2)^{-1}
(T_1BT_1^{-1})
A.
]

Across all 16 frozen connector pairs:

[
G_{\partial}
=
G_{\rm transported}
=
G_L
=
G_R.
]

Correct transported composition is therefore consistent under both frozen parenthesizations.

## Primary witness

For (T_1=A), (T_2=B):

[
G_{\partial}
=
\begin{pmatrix}
5&3\\
3&2
\end{pmatrix},
]

while the connector-free local product is

[
CBA
=
\begin{pmatrix}
3&4\\
2&3
\end{pmatrix}.
]

Their traces differ: (7\neq6).

## Exact-cancellation witness

For (T_1=B), (T_2=S):

[
G_{\partial}=I.
]

But all three frozen wrong reconstructions are nonidentity. Incomplete path memory can therefore change even whether the global boundary is classified as trivial.

## Interpretation

AH9 showed that a neighboring loop must be transported to a common basepoint.

AH10 shows that the same requirement scales to a three-cell chain: cumulative connector history is sufficient for exact reconstruction, and transported composition is associative in the frozen model.

The result remains a finite matrix identity, not evidence for physical spacetime curvature or gauge transport.
