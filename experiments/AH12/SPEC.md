# AH12 Frozen Specification

## 1. Purpose

AH12 extends AH11 from one future task to multiple future query sets.

AH11 established that the task residue

\[
R_\Gamma=H_3^{(0)}H_2^{(0)}
\]

is sufficient for reconstructing the global operator

\[
G_\partial=R_\Gamma A.
\]

AH12 asks:

> Is the same compressed memory sufficient when the future asks for other quantities?

## 2. Frozen history ensemble

Reuse the AH11 ensemble.

Let

\[
U,V\in\{I,A,B,S\},
\qquad
k\in\{-1,0,+1\}.
\]

Define

\[
T_1=UB^k,
\qquad
T_2=B^{-k}V,
\]

so that

\[
P_2=T_1T_2=UV.
\]

Transported local loops are

\[
H_2^{(0)}=T_1BT_1^{-1},
\]

\[
H_3^{(0)}=P_2CP_2^{-1},
\]

with

\[
C=AB.
\]

Define

\[
R_\Gamma=H_3^{(0)}H_2^{(0)}
\]

and

\[
G_\partial=R_\Gamma A.
\]

Total labeled histories:

\[
4\times4\times3=48.
\]

## 3. Candidate memory descriptors

The frozen descriptor family is identical to AH11:

- `label` = \((U,V,k)\)
- `raw` = \((T_1,T_2)\)
- `prefix` = \((T_1,P_2)\)
- `action` = \((H_2^{(0)},H_3^{(0)})\)
- `residue` = \(R_\Gamma\)
- `cumulative` = \(P_2\)
- `H2` = \(H_2^{(0)}\)
- `H3` = \(H_3^{(0)}\)
- `trace` = \((\operatorname{tr}H_2^{(0)},\operatorname{tr}H_3^{(0)})\)

## 4. Query families

### Q_G — global reconstruction

Target:

\[
\mathcal Q_G=\{G_\partial\}.
\]

Frozen coarsest sufficient candidate:

\[
R_{\mathcal Q_G}=R_\Gamma.
\]

Expected:
- 13 classes;
- entropy 3.625 bits;
- \(H(G_\partial\mid R_\Gamma)=0\).

### Q_H2 — recover intermediate transported loop

Target:

\[
\mathcal Q_{H2}=\{H_2^{(0)}\}.
\]

Frozen coarsest sufficient candidate:

\[
R_{\mathcal Q_{H2}}=H_2^{(0)}.
\]

Expected:
- 3 classes;
- entropy 1.5 bits;
- the AH11 residue is **not** sufficient:
  \[
  H(H_2^{(0)}\mid R_\Gamma)=0.25\ {\rm bits}.
  \]

### Q_H3 — recover third transported loop

Target:

\[
\mathcal Q_{H3}=\{H_3^{(0)}\}.
\]

Frozen coarsest sufficient candidate:

\[
R_{\mathcal Q_{H3}}=H_3^{(0)}.
\]

Expected:
- 9 classes;
- entropy 3.077819531114783 bits.

### Q_P2 — recover cumulative transport

Target:

\[
\mathcal Q_{P2}=\{P_2\}.
\]

Frozen coarsest sufficient candidate:

\[
R_{\mathcal Q_{P2}}=P_2.
\]

Expected:
- 13 classes;
- entropy 3.625 bits;
- the AH11 residue is **not** sufficient:
  \[
  H(P_2\mid R_\Gamma)=0.25\ {\rm bits}.
  \]

### Q_ALL — broad future query family

Target tuple:

\[
\mathcal Q_{\rm ALL}
=
(G_\partial,H_2^{(0)},H_3^{(0)},P_2).
\]

Frozen coarsest sufficient candidate:

\[
R_{\mathcal Q_{\rm ALL}}
=
(H_2^{(0)},H_3^{(0)}).
\]

Expected:
- 15 classes;
- entropy 3.875 bits;
- `action` is sufficient;
- `residue` is insufficient;
- `cumulative` is insufficient.

## 5. Sufficiency criterion

For query family \(\mathcal Q\) and memory descriptor \(D\),

\[
D(x)=D(x')
\Longrightarrow
\mathcal Q(x)=\mathcal Q(x')
\]

for all frozen histories.

Equivalently:

\[
H(\mathcal Q\mid D)=0.
\]

## 6. Frozen coarsest-candidate table

| Query family | Coarsest sufficient candidate | Classes | Entropy |
|---|---|---:|---:|
| \(Q_G\) | residue \(R_\Gamma\) | 13 | 3.625 |
| \(Q_{H2}\) | \(H_2^{(0)}\) | 3 | 1.5 |
| \(Q_{H3}\) | \(H_3^{(0)}\) | 9 | 3.077819531114783 |
| \(Q_{P2}\) | cumulative \(P_2\) | 13 | 3.625 |
| \(Q_{\rm ALL}\) | action pair | 15 | 3.875 |

All "coarsest" claims are restricted to the frozen candidate descriptor set.

## 7. Cross-task failure matrix

The experiment freezes these cross-task failures:

\[
H(H_2^{(0)}\mid R_\Gamma)=0.25
\]

\[
H(P_2\mid R_\Gamma)=0.25
\]

\[
H(G_\partial\mid P_2)=0.25
\]

while:

\[
H(G_\partial\mid R_\Gamma)=0.
\]

Therefore a memory sufficient for one future query can be lossy for another.

## 8. Explicit witness: same AH11 residue, different future answers

Frozen histories:

\[
(U,V,k)=(I,A,-1)
\]

and

\[
(U,V,k)=(S,S,-1).
\]

They share the same AH11 task residue:

\[
R_\Gamma=
\begin{pmatrix}
2&-1\\
1&0
\end{pmatrix},
\]

and therefore the same global operator:

\[
G_\partial=
\begin{pmatrix}
2&1\\
1&1
\end{pmatrix}.
\]

But they differ in:

\[
H_2^{(0)}
\]

and

\[
P_2.
\]

Thus the AH11 compression is exact for \(Q_G\) but loses distinctions required by \(Q_{H2}\) and \(Q_{P2}\).

## 9. Explicit dual witness: same cumulative path, different global answer

Reuse the AH11 pair:

\[
(U,V,k)=(I,A,0)
\]

and

\[
(U,V,k)=(A,I,0).
\]

Both share

\[
P_2=A
\]

but yield different global operators.

Thus \(P_2\) is exact memory for \(Q_{P2}\) but lossy for \(Q_G\).

## 10. Query-family refinement

The broad query family has 15 distinguishable outcome classes:

\[
|\mathcal Q_{\rm ALL}|=15.
\]

The `action` descriptor also has 15 classes and:

\[
H(\mathcal Q_{\rm ALL}\mid D_{\rm action})=0.
\]

The single-task residue has only 13 classes and cannot answer the expanded query set exactly.

Operational interpretation:

> As the permitted future query set expands, previously safe memory compression can become destructive.

## 11. Working memory statement

AH12 motivates the task-indexed notation:

\[
\boxed{
R_{\mathcal Q}(\Gamma)
}
\]

for retained path residue sufficient with respect to a declared query family \(\mathcal Q\).

Within the frozen model:

\[
R_{\mathcal Q_G}
\neq
R_{\mathcal Q_{H2}}
\neq
R_{\mathcal Q_{H3}}
\]

in their coarsest preregistered forms.

The result does not assert uniqueness or global minimality across all possible encodings.

## 12. Claim firewall

AH12 establishes finite partition/sufficiency facts for a frozen integer-matrix ensemble.

It does not establish:
- universal cognitive memory laws;
- optimal context compression for arbitrary AI systems;
- biological memory mechanisms;
- physical gauge memory;
- spacetime memory;
- cosmology.
