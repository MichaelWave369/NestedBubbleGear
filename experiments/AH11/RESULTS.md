# AH11 v0.1.0 Qualification Results

## Verdict

**PASS_AH11**

- Frozen acceptance checks: **34/34**
- Unit tests: **12/12 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**
- Labeled path histories: **48**
- Distinct global operators: **13**
- Global entropy: **3.625 bits**

## Main result

The task residue

[
R_\Gamma=H_3^{(0)}H_2^{(0)}
]

has 13 classes and entropy

[
H(R_\Gamma)=3.625\ \text{bits},
]

matching the 13 global operator classes and

[
H(G_\partial)=3.625\ \text{bits}.
]

Because

[
G_\partial=R_\Gamma A,
]

the frozen task has

[
H(G_\partial\mid R_\Gamma)=0.
]

Among the preregistered descriptors, (R_\Gamma) is the coarsest sufficient one.

## Same capacity, wrong information

The cumulative connector endpoint

[
P_2=T_1T_2
]

also has 13 classes and entropy 3.625 bits, but

[
H(G_\partial\mid P_2)=0.25\ \text{bits}.
]

Thus equal class count and equal Shannon entropy do not imply equal causal sufficiency.

## Frozen counterexample

Two histories with ((U,V)=(I,A)) and ((A,I)) share the same cumulative endpoint (P_2=A), but produce different global operators:

[
G_1=
\begin{pmatrix}
2&1\\
1&1
\end{pmatrix},
\qquad
G_2=
\begin{pmatrix}
5&2\\
2&1
\end{pmatrix}.
]

## Gauge-like compression witness

For base pair ((U,V)=(A,B)), the three labeled histories (k=-1,0,+1) use different raw connector paths yet have identical cumulative transport, transported action pair, task residue, and global operator.

## Interpretation

AH10 established that connector history is sufficient.

AH11 shows that the full history is not necessary for this declared task.

The retained memory can be compressed to a task-specific causal residue, but a superficially equally compact descriptor can still discard the wrong distinctions.

The claim is limited to the frozen descriptor family and finite matrix ensemble.
