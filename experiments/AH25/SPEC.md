# AH25 Frozen Specification

## 1. Purpose

AH25 inverts AH24.

Instead of declaring a hidden failure relation and computing reliability, AH25 receives observed binary failure traces and asks:

> Is there enough evidence to reject a simple independence picture for the two outer Keyholes?

The experiment deliberately distinguishes:

- positive common-mode evidence;
- data compatible with independence;
- strong dependence in the opposite direction;
- insufficient evidence.

## 2. Frozen contingency representation

For \(E_1,E_3\in\{0,1\}\), where 1 means failure, define counts:

\[
(n_{00},n_{01},n_{10},n_{11}).
\]

Total:

\[
N=n_{00}+n_{01}+n_{10}+n_{11}.
\]

## 3. Frozen statistics

Marginals:

\[
p_1=P(E_1=1),
\qquad
p_3=P(E_3=1).
\]

Joint failure:

\[
p_{11}=P(E_1=1,E_3=1).
\]

Co-failure excess:

\[
\Delta=p_{11}-p_1p_3.
\]

Mutual information:

\[
I(E_1;E_3)
=
\sum_{i,j}
p_{ij}
\log_2
\frac{p_{ij}}{p_ip_j}.
\]

Pearson statistic:

\[
\chi^2
=
\sum_{i,j}
\frac{(O_{ij}-E_{ij})^2}{E_{ij}}.
\]

For the frozen \(2\times2\) table:

\[
df=1.
\]

Use:

\[
p_{\chi^2}
=
\operatorname{erfc}
\left(
\sqrt{\chi^2/2}
\right).
\]

## 4. Frozen evidence classifier

Minimum sample size:

\[
N_{\min}=400.
\]

### INSUFFICIENT_EVIDENCE

Return this if:

\[
N<400.
\]

No independence/common-mode conclusion is permitted.

### COMMON_MODE_EVIDENCE

Require:

\[
N\ge400,
\]

\[
p_{\chi^2}\le10^{-3},
\]

and:

\[
\Delta\ge0.02.
\]

### DEPENDENCE_OTHER_DIRECTION

Require:

\[
N\ge400,
\]

\[
p_{\chi^2}\le10^{-3},
\]

and:

\[
\Delta\le-0.02.
\]

### INDEPENDENCE_COMPATIBLE

Require:

\[
N\ge400,
\]

\[
p_{\chi^2}\ge0.10,
\]

and:

\[
|\Delta|\le0.01.
\]

This status does **not** prove independence.

All other cases return:

\[
INSUFFICIENT\_EVIDENCE.
\]

## 5. Frozen datasets

### MATCHED_INDEPENDENT

\[
(n_{00},n_{01},n_{10},n_{11})
=
(5776,1824,1824,576).
\]

Expected:

\[
N=10000,
\]

\[
p_1=p_3=0.24,
\]

\[
p_{11}=0.0576,
\]

\[
\Delta=0,
\]

\[
I(E_1;E_3)=0,
\]

\[
\chi^2=0,
\]

\[
p_{\chi^2}=1.
\]

Status:

\[
\boxed{INDEPENDENCE\_COMPATIBLE}
\]

### MATCHED_COMMON_CAUSE

\[
(7220,380,380,2020).
\]

Expected:

\[
p_1=p_3=0.24,
\]

\[
p_{11}=0.202,
\]

\[
\Delta=0.1444.
\]

Expected:

\[
\chi^2
=
6267.361111111111.
\]

Expected mutual information:

\[
0.42610481405706996
\text{ bits}.
\]

Status:

\[
\boxed{COMMON\_MODE\_EVIDENCE}
\]

### MATCHED_ANTI_DEPENDENCE

\[
(5200,2400,2400,0).
\]

Expected:

\[
p_1=p_3=0.24,
\]

\[
p_{11}=0,
\]

\[
\Delta=-0.0576.
\]

Expected:

\[
\chi^2
=
997.2299168975069.
\]

Expected mutual information:

\[
0.11123502277384265
\text{ bits}.
\]

Status:

\[
\boxed{DEPENDENCE\_OTHER\_DIRECTION}
\]

This prevents the auditor from treating every statistically dependent trace as common-mode positive coupling.

### SMALL_AMBIGUOUS

\[
(15,4,4,2).
\]

Expected:

\[
N=25,
\]

\[
p_1=p_3=0.24,
\]

\[
p_{11}=0.08,
\]

\[
\Delta=0.0224.
\]

Even though \(\Delta>0\), the sample is below the frozen minimum.

Status:

\[
\boxed{INSUFFICIENT\_EVIDENCE}
\]

## 6. Marginal-only negative control

The first three large datasets all have identical one-Keyhole marginals:

\[
p_1=p_3=0.24.
\]

Therefore a marginal-only observer maps all three to the same descriptor:

\[
M=(0.24,0.24).
\]

Yet their joint structures and reliability consequences differ.

Thus:

\[
\boxed{
\text{same marginals}
\not\Rightarrow
\text{same failure domain}
}
\]

## 7. Dual-path reliability estimate

Freeze:

\[
p_2=0.10.
\]

For a dual-path topology requiring \(E_2\) plus at least one outer Keyhole, estimate:

\[
\widehat R_{\rm BOTH}
=
(1-p_2)(1-\hat p_{11}).
\]

Expected:

### MATCHED_INDEPENDENT

\[
0.9(1-0.0576)
=
0.84816.
\]

### MATCHED_COMMON_CAUSE

\[
0.9(1-0.202)
=
0.7182.
\]

### MATCHED_ANTI_DEPENDENCE

\[
0.9(1-0)
=
0.9.
\]

These recover the AH24 independent/common-cause reliability values from observed joint failure traces alone.

## 8. Redundancy overstatement

Define independence-assumed reliability using marginals only:

\[
R_{\rm assumed}
=
(1-p_2)(1-p_1p_3).
\]

For all three large matched-marginal datasets:

\[
R_{\rm assumed}=0.84816.
\]

Define overstatement:

\[
O=
R_{\rm assumed}-\widehat R_{\rm BOTH}.
\]

Expected:

- MATCHED_INDEPENDENT:
  \[
  O=0;
  \]
- MATCHED_COMMON_CAUSE:
  \[
  O=0.12996;
  \]
- MATCHED_ANTI_DEPENDENCE:
  \[
  O=-0.05184.
  \]

So marginal-only independence assumptions can either overestimate or underestimate observed redundancy value.

## 9. Evidence/refusal semantics

`INDEPENDENCE_COMPATIBLE` means only:

> The frozen trace does not contradict the independence model under the declared audit thresholds.

It must not be rendered as:

> independence proven.

`INSUFFICIENT_EVIDENCE` is an affirmative audit state, not an error.

## 10. Interpretation

AH25 supports:

\[
\boxed{
\text{joint failure traces can expose hidden failure-domain coupling erased by marginal summaries}
}
\]

and:

\[
\boxed{
\text{marginal dashboards can materially misstate redundancy}
}
\]

in the frozen synthetic panel.

## 11. Claim firewall

AH25 does not establish:

- real deployed failure-domain structure;
- causal direction from statistical dependence alone;
- proof of independence;
- correct universal evidence thresholds;
- field reliability certification.

It proves only exact finite calculations and frozen classifier behavior on the declared synthetic contingency tables.
