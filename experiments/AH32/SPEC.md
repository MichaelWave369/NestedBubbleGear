# AH32 Frozen Specification

## 1. Purpose

AH31 proved that raw horizon releases cannot simultaneously preserve:

1. organizational coverage of lifetime, recent, and adaptive evidence;
2. unrestricted grand-coalition pooling;
3. non-derivability of `Q_MULTI`.

AH32 relaxes **release fidelity**, not horizon coverage.

Core question:

> Can task-sufficient coarsenings preserve each actor's declared job while preventing pooled releases from exactly reconstructing the multi-horizon target?

## 2. Frozen AH31 actor grants

Reuse exactly five direct grants:

1. `HISTORIAN : Q_LIFETIME`
2. `OPERATOR : Q_RECENT`
3. `ADAPTIVE_CONTROLLER : Q_ADAPTIVE`
4. `AUDITOR : Q_LIFETIME`
5. `AUDITOR : Q_RECENT`

The actor panel remains:

- `HISTORIAN`
- `OPERATOR`
- `ADAPTIVE_CONTROLLER`
- `AUDITOR`

## 3. Frozen release modes

Each grant independently chooses one of:

### RAW

Release the exact AH28 evidence state.

Observed state alphabet across the seven frozen panels includes:

- `COMMON_MODE_EVIDENCE`
- `INDEPENDENCE_COMPATIBLE`
- `INSUFFICIENT_EVIDENCE`

### RISK

Release only:

\[
\rho(s)=
\begin{cases}
COMMON & s=COMMON\_MODE\_EVIDENCE\\
NOT\_COMMON & \text{otherwise}.
\end{cases}
\]

This is a deterministic coarsening of the raw state.

## 4. Frozen actor tasks

The experiment does **not** assume every actor needs the exact AH28 state.

Freeze the following tasks.

### HISTORIAN

Determine:

\[
T_H=
1[S_{\rm lifetime}=COMMON\_MODE\_EVIDENCE].
\]

### OPERATOR

Determine:

\[
T_O=
1[S_{\rm recent}=COMMON\_MODE\_EVIDENCE].
\]

### ADAPTIVE_CONTROLLER

Determine:

\[
T_A=
1[S_{\rm adaptive}=COMMON\_MODE\_EVIDENCE].
\]

### AUDITOR

Determine the pair:

\[
T_U=
(
1[S_{\rm lifetime}=COMMON\_MODE\_EVIDENCE],
1[S_{\rm recent}=COMMON\_MODE\_EVIDENCE]
).
\]

Both RAW and RISK representations are sufficient for the corresponding frozen task.

Acceptance requires zero task error for every role in all 32 designs.

## 5. Frozen target

Reuse:

\[
M_{\rm state}
=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
)
\]

over the uniform seven-panel AH28 ensemble.

A release design is **coalition-safe in the frozen model** iff:

\[
H(M_{\rm state}\mid Z_{\rm grand})>0
\]

where \(Z_{\rm grand}\) is the concatenation of all five releases under unrestricted pooling.

This means only that exact reconstruction fails on the frozen ensemble.

## 6. Exhaustive release-design space

There are five binary release-mode choices:

\[
2^5=32.
\]

Acceptance requires exhaustive enumeration of all 32 designs.

For each design record:

- RAW/RISK mode of each grant;
- frozen task error for every actor;
- number of transformed grants;
- pooled descriptor class count;
- residual entropy:
  \[
  H(M_{\rm state}\mid Z_{\rm grand});
  \]
- safe/unsafe classification.

## 7. Baseline raw design

All five grants use RAW.

Expected:

\[
H(M_{\rm state}\mid Z_{\rm grand})=0.
\]

Thus baseline is:

\[
\boxed{EXACTLY\_DERIVABLE}.
\]

This reproduces AH31's grand-coalition result.

## 8. Safe-design family

Acceptance requires exactly:

\[
\boxed{8/32}
\]

release designs to satisfy:

\[
H(M_{\rm state}\mid Z_{\rm grand})>0.
\]

Every safe design must use `RISK` for both lifetime carriers:

- `HISTORIAN:Q_LIFETIME`
- `AUDITOR:Q_LIFETIME`

The modes of the remaining three grants may be RAW or RISK without changing the frozen residual uncertainty.

Therefore the safe family is exactly:

\[
2^3=8.
\]

## 9. Unique minimum safe transformation

Optimization objective:

1. preserve all frozen actor tasks exactly;
2. obtain positive grand-coalition residual entropy;
3. minimize number of grants changed from RAW to RISK;
4. lexicographic tie-break.

Expected unique optimum:

```text
HISTORIAN:Q_LIFETIME           -> RISK
OPERATOR:Q_RECENT              -> RAW
ADAPTIVE_CONTROLLER:Q_ADAPTIVE -> RAW
AUDITOR:Q_LIFETIME             -> RISK
AUDITOR:Q_RECENT               -> RAW
```

Transformation count:

\[
\boxed{2}.
\]

No one-grant transformation is coalition-safe.

## 10. Frozen residual uncertainty

For the unique minimum safe design:

\[
\boxed{
H(M_{\rm state}\mid Z_{\rm grand})
=
0.2857142857142857
\text{ bits}
}
\]

and pooled descriptor class count is:

\[
\boxed{5}.
\]

Baseline RAW design has:

\[
6
\]

descriptor classes for the six distinct multi-horizon targets in the seven-panel ensemble.

## 11. Same-release / different-target witness

Use AH28 panels:

### C

\[
(
S_L,S_R,S_A,A_{\rm arb}
)
=
(
INDEPENDENCE\_COMPATIBLE,
INDEPENDENCE\_COMPATIBLE,
INDEPENDENCE\_COMPATIBLE,
CONSISTENT
).
\]

### F

\[
(
S_L,S_R,S_A,A_{\rm arb}
)
=
(
INSUFFICIENT\_EVIDENCE,
INDEPENDENCE\_COMPATIBLE,
INDEPENDENCE\_COMPATIBLE,
HORIZON\_CONFLICT
).
\]

Under the minimum safe release design:

- both lifetime carriers release `NOT_COMMON`;
- recent RAW releases are identical;
- adaptive RAW releases are identical.

Therefore:

\[
\boxed{
Z_{\rm grand}(C)=Z_{\rm grand}(F)
}
\]

while:

\[
\boxed{
M_{\rm state}(C)\neq M_{\rm state}(F).
}
\]

This is the exact finite non-reconstruction witness.

## 12. Why lifetime must be coarsened everywhere

If either lifetime carrier remains RAW, the grand coalition receives exact lifetime status.

The recent and adaptive exact/raw-or-risk states in the frozen ensemble then suffice to distinguish every multi-horizon target.

Acceptance requires:

\[
\boxed{
\text{safe}
\iff
\text{both lifetime grants use RISK}
}
\]

across all 32 designs.

Thus coarsening recent or adaptive evidence alone does not repair the frozen collusion leak.

## 13. Task sufficiency

For each role \(a\), let \(T_a\) be its frozen task and \(Z_a\) its released descriptor.

Acceptance requires:

\[
H(T_a\mid Z_a)=0
\]

for all roles and all 32 designs.

For the minimum safe design:

\[
H(T_H\mid Z_H)=0,
\]

\[
H(T_O\mid Z_O)=0,
\]

\[
H(T_A\mid Z_A)=0,
\]

\[
H(T_U\mid Z_U)=0.
\]

Thus the selected privacy hardening has zero loss for the declared toy tasks.

## 14. Release entropy reduction

On the seven-panel ensemble, the exact lifetime state has entropy:

\[
H(S_L)=1.3787834934861753.
\]

The lifetime common-mode task bit has entropy:

\[
H(T_H)=0.863120568566631.
\]

Therefore each transformed lifetime release removes:

\[
0.5156629249195443
\]

bits of status detail in this finite ensemble while preserving the frozen common-mode task.

This is descriptive, not a universal privacy metric.

## 15. Design receipt

The deterministic synthesis receipt records:

- all five baseline grants;
- selected mode per grant;
- transformed grants;
- transformation count;
- task errors;
- baseline residual entropy;
- hardened residual entropy;
- baseline descriptor classes;
- hardened descriptor classes;
- safe design count;
- total design count;
- witness panels;
- receipt hash.

Replay must be byte-identical.

## 16. Interpretation

AH32 supports:

\[
\boxed{
\text{task-sufficient release}
\neq
\text{raw state release}
}
\]

and:

\[
\boxed{
\text{coalition safety can sometimes be restored by coarsening information rather than deleting capability}.
}
\]

It also sharpens the earlier memory principle:

\[
\boxed{
\text{release only the distinction required by the authorized task}.
}
\]

## 17. Claim firewall

AH32 does not establish:

- differential privacy;
- cryptographic secrecy;
- protection against auxiliary information;
- side-channel noninterference;
- production confidentiality;
- optimal real-world task definitions.

It proves only finite task-sufficiency, release-coarsening, conditional-entropy, exhaustive-design, and witness properties over the frozen seven-panel model.
