# AH11 Frozen Specification

## 1. Purpose

AH11 tests path-memory compression in the AH10 three-plaquette transport model.

The target is not to prove a globally minimal sufficient statistic over all imaginable encodings.

The frozen claim is narrower:

> Among the explicitly preregistered candidate descriptors, identify the coarsest descriptor that exactly preserves the global outer operator.

## 2. Local loops

Use the same local loops as AH10:

[
H_1=A,
\qquad
H_2=B,
\qquad
H_3=C=AB,
]

with

[
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
]

## 3. Base connector ensemble

Let

[
U,V\in\{I,A,B,S\},
]

giving 16 base connector pairs.

For each base pair, generate three labeled path histories using

[
k\in\{-1,0,+1\}.
]

Define

[
T_1(U,k)=U B^k,
]

[
T_2(V,k)=B^{-k}V.
]

Therefore

[
T_1T_2=UV
]

is unchanged by (k).

Because (B^k) commutes with (H_2=B),

[
T_1BT_1^{-1}
=
UBU^{-1}
]

is also unchanged by (k).

Thus the three (k)-variants are intentionally different raw path histories that are equivalent for the frozen global-reconstruction task.

Total labeled histories:

[
16\times3=48.
]

## 4. Global operator

Define

[
P_2=T_1T_2.
]

Transported local loops at basepoint 0 are

[
H_2^{(0)}=T_1BT_1^{-1},
]

[
H_3^{(0)}=P_2CP_2^{-1}.
]

The global operator is

[
G_\partial
=
H_3^{(0)}H_2^{(0)}A.
]

## 5. Candidate memory descriptors

### D0 — Full labeled history

[
D_{\rm label}=(U,V,k).
]

48 classes by construction.

### D1 — Raw matrix pair

[
D_{\rm raw}=(T_1,T_2).
]

Expected: 46 classes in the frozen ensemble.

### D2 — Prefix memory

[
D_{\rm prefix}=(T_1,P_2).
]

Expected: 46 classes.

### D3 — Transport action pair

[
D_{\rm action}
=
(H_2^{(0)},H_3^{(0)}).
]

Expected: 15 classes.

### D4 — Task residue

[
D_R
=
R_\Gamma
=
H_3^{(0)}H_2^{(0)}.
]

Expected: 13 classes.

Since

[
G_\partial=R_\Gamma A
]

and (A) is fixed and invertible, (D_R) is sufficient for exact global reconstruction.

### D5 — Cumulative endpoint transport only

[
D_{\rm cumulative}=P_2.
]

Expected: 13 classes.

This descriptor has the same class count as (D_R), but it is not sufficient.

### D6 — Second-loop action only

[
D_{H2}=H_2^{(0)}.
]

Expected: 3 classes and insufficient.

### D7 — Third-loop action only

[
D_{H3}=H_3^{(0)}.
]

Expected: 9 classes and insufficient.

### D8 — Conjugacy traces only

[
D_{\rm trace}
=
(\operatorname{tr}H_2^{(0)},
 \operatorname{tr}H_3^{(0)}).
]

Because trace is invariant under conjugation, this collapses to one class and is insufficient.

## 6. Sufficiency criterion

For descriptor (D), define it as sufficient for global reconstruction iff:

[
D(x)=D(x')
\Longrightarrow
G_\partial(x)=G_\partial(x')
]

for every pair of frozen histories.

Equivalently:

[
H(G_\partial\mid D)=0.
]

## 7. Frozen expected class counts

| Descriptor | Classes | Sufficient? |
|---|---:|---|
| labeled history | 48 | yes |
| raw pair | 46 | yes |
| prefix memory | 46 | yes |
| action pair | 15 | yes |
| task residue (R_\Gamma) | 13 | yes |
| cumulative (P_2) | 13 | **no** |
| (H_2^{(0)}) only | 3 | no |
| (H_3^{(0)}) only | 9 | no |
| trace pair | 1 | no |

Thus (R_\Gamma) is the coarsest sufficient descriptor in the frozen candidate set.

## 8. Frozen entropy expectations

The 48 labeled histories are uniformly weighted.

Expected:

[
H(G_\partial)=3.625\ {\rm bits}.
]

[
H(D_{\rm label})=\log_2 48
=5.584962500721156.
]

[
H(D_{\rm action})=3.875.
]

[
H(D_R)=3.625.
]

[
H(G_\partial\mid D_R)=0.
]

[
H(G_\partial\mid P_2)=0.25.
]

Thus (D_R) carries exactly the global-output entropy for this frozen task.

## 9. Same-capacity / wrong-information witness

Two histories can share

[
P_2=A
]

yet yield different global operators.

Frozen pair:

### History 1

[
(U,V)=(I,A).
]

### History 2

[
(U,V)=(A,I).
]

Both have

[
P_2=A,
]

but their global operators are:

[
G_1=
\begin{pmatrix}
2&1\\
1&1
\end{pmatrix},
]

[
G_2=
\begin{pmatrix}
5&2\\
2&1
\end{pmatrix}.
]

So the cumulative path endpoint alone does not preserve the intermediate action needed for reconstruction.

## 10. Gauge-like compression witness

For base pair

[
(U,V)=(A,B),
]

all three (k\in\{-1,0,+1\}) produce different labeled/raw paths but the same:

- cumulative transport (P_2);
- transported action pair;
- task residue (R_\Gamma);
- global operator.

This is an operationally redundant path deformation for the frozen task.

## 11. Interpretation

AH11 distinguishes:

- raw history;
- sufficient transported action;
- task-specific compressed residue;
- lossy coarse summaries.

The result motivates the working memory statement:

> Memory is not necessarily the full past. For a declared future task, it can be the smallest retained causal residue that preserves all relevant future distinctions.

The word "smallest" here applies only to the frozen candidate descriptor family, not to all possible encodings.

## 12. Claim firewall

AH11 proves finite ensemble properties for integer matrices.

It does not establish:
- biological memory laws;
- information-theoretic optimality in arbitrary systems;
- physical gauge symmetry;
- spacetime memory;
- cosmological structure.
