# AH27 Frozen Specification

## 1. Purpose

AH27 asks whether the correct evidence memory depends on the time horizon of the governance query.

Freeze three memory operators:

### Lifetime

\[
D_{\rm life}(t)
=
A_0+\sum_{i=1}^{t}B_i.
\]

### Recent two-batch window

\[
D_{\rm recent}(t)
=
B_{t-1}+B_t
\]

for \(t\ge2\), and \(B_1\) for the first batch.

### Exponentially discounted

\[
D_{\rm disc}(t)
=
\lambda D_{\rm disc}(t-1)+B_t,
\qquad
\lambda=0.1.
\]

Initialize:

\[
D_{\rm disc}(0)=A_0.
\]

## 2. Frozen archive

The lifetime archive is an exact independence table with:

\[
N=100000.
\]

\[
A_0=(57760,18240,18240,5760).
\]

Thus:

\[
p_1=p_3=0.24,
\]

\[
p_{11}=0.0576,
\]

\[
\Delta=0.
\]

## 3. Frozen recent batch types

### I — independent batch

\[
I=(1444,456,456,144),
\qquad
N=2500.
\]

### C — common-mode batch

\[
C=(1805,95,95,505),
\qquad
N=2500.
\]

Both preserve:

\[
p_1=p_3=0.24.
\]

## 4. Primary recent sequence

Freeze:

\[
[I,C,C,I,I].
\]

The lifetime, recent-window, and discounted memories process the same sequence.

## 5. Expected lifetime states

Expected lifetime raw-status sequence:

\[
\boxed{
[
INDEPENDENCE\_COMPATIBLE,
INSUFFICIENT\_EVIDENCE,
INSUFFICIENT\_EVIDENCE,
INSUFFICIENT\_EVIDENCE,
INSUFFICIENT\_EVIDENCE
]
}
\]

The large archive prevents the lifetime summary from satisfying the frozen common-mode effect-size threshold even while recent evidence changes sharply.

Expected lifetime \(\Delta\):

\[
[
0,
0.00343809523809524,
0.006716279069767447,
0.006563636363636369,
0.006417777777777786
].
\]

## 6. Expected recent-window states

Rolling two-batch sequence:

\[
[I],
[I,C],
[C,C],
[C,I],
[I,I].
\]

Expected statuses:

\[
\boxed{
[
INDEPENDENCE\_COMPATIBLE,
COMMON\_MODE\_EVIDENCE,
COMMON\_MODE\_EVIDENCE,
COMMON\_MODE\_EVIDENCE,
INDEPENDENCE\_COMPATIBLE
]
}
\]

At the fully common recent window:

\[
[C,C],
\]

\[
p_{11}=0.202,
\]

\[
\Delta=0.1444,
\]

\[
I(E_1;E_3)=0.42610481405706996
\text{ bits}.
\]

## 7. Expected discounted states

Use:

\[
\lambda=0.1.
\]

Expected status sequence:

\[
\boxed{
[
INDEPENDENCE\_COMPATIBLE,
COMMON\_MODE\_EVIDENCE,
COMMON\_MODE\_EVIDENCE,
INSUFFICIENT\_EVIDENCE,
INDEPENDENCE\_COMPATIBLE
]
}
\]

Expected discounted \(\Delta\):

\[
[
0,
0.09626666666666668,
0.1381217391304348,
0.014245739910313901,
0.0014290598290598241
].
\]

So discounted memory reacts faster than lifetime memory but clears faster than the rolling two-batch window in this frozen stream.

## 8. Query-horizon disagreement

At primary step 2:

\[
D_{\rm life}
\Rightarrow
INSUFFICIENT\_EVIDENCE,
\]

while:

\[
D_{\rm recent}
\Rightarrow
COMMON\_MODE\_EVIDENCE,
\]

and:

\[
D_{\rm disc}
\Rightarrow
COMMON\_MODE\_EVIDENCE.
\]

At step 4:

\[
D_{\rm life}
\Rightarrow
INSUFFICIENT\_EVIDENCE,
\]

\[
D_{\rm recent}
\Rightarrow
COMMON\_MODE\_EVIDENCE,
\]

\[
D_{\rm disc}
\Rightarrow
INSUFFICIENT\_EVIDENCE.
\]

At step 5:

\[
D_{\rm recent}
=
D_{\rm disc}
\Rightarrow
INDEPENDENCE\_COMPATIBLE,
\]

while lifetime remains:

\[
INSUFFICIENT\_EVIDENCE.
\]

Thus the three memory horizons answer different temporal questions.

## 9. Frozen order witness

Use the same archive \(A_0\).

Define:

### History A

\[
H_A=[C,C,I,I].
\]

### History B

\[
H_B=[I,I,C,C].
\]

Both histories contain exactly:

- two independent recent batches;
- two common-mode recent batches.

Therefore their final lifetime cumulative tables are identical:

\[
D_{\rm life}(H_A)
=
D_{\rm life}(H_B)
=
(64258,19342,19342,7058).
\]

Both lifetime statuses are:

\[
INSUFFICIENT\_EVIDENCE.
\]

But final recent windows differ.

For \(H_A\):

\[
[I,I]
\Rightarrow
INDEPENDENCE\_COMPATIBLE.
\]

For \(H_B\):

\[
[C,C]
\Rightarrow
COMMON\_MODE\_EVIDENCE.
\]

The discounted memories also differ:

\[
D_{\rm disc}(H_A)
\Rightarrow
INDEPENDENCE\_COMPATIBLE,
\]

\[
D_{\rm disc}(H_B)
\Rightarrow
COMMON\_MODE\_EVIDENCE.
\]

Thus:

\[
\boxed{
D_{\rm life}(H_A)=D_{\rm life}(H_B)
}
\]

while:

\[
\boxed{
Q_{\rm recent}(H_A)\neq Q_{\rm recent}(H_B)
}
\]

and:

\[
\boxed{
Q_{\rm disc}(H_A)\neq Q_{\rm disc}(H_B).
}
\]

## 10. Reliability view

Freeze:

\[
p_2=0.10.
\]

For any evidence memory \(D\):

\[
\widehat R(D)
=
0.9(1-\hat p_{11}(D)).
\]

Primary recent-window reliability trace:

\[
[
0.84816,
0.78318,
0.7182,
0.78318,
0.84816
].
\]

Lifetime reliability moves only gradually:

\[
[
0.84816,
0.8450657142857143,
0.8421153488372093,
0.8422527272727273,
0.842384
].
\]

The recent query therefore sees a much larger transient redundancy loss than the lifetime aggregate.

## 11. Memory interpretation

AH27 distinguishes at least two query families:

### Lifetime query

> What does the full historical record say about long-horizon coupling?

### Recent-hazard query

> What does the most recent operating regime say about current coupling?

The same retained summary need not be sufficient for both.

Operationally:

\[
\boxed{
R_{\mathcal Q,\tau}(\Gamma)
}
\]

may need both a query family \(\mathcal Q\) and a time horizon \(\tau\).

## 12. Claim firewall

AH27 does not establish:

- an optimal rolling-window size;
- an optimal decay factor;
- correct field monitoring horizons;
- stationarity or true change-point detection;
- universal statistical thresholds.

It proves only exact finite behavior for the frozen archive, recent batches, memory operators, and AH25 classifier.
