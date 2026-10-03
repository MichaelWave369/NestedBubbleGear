# AH33 Frozen Specification

## 1. Purpose

AH33 asks:

> How much task fidelity can be retained before a denied multi-horizon target becomes exactly reconstructible again?

AH32 froze one coarse task. AH33 freezes a nested task hierarchy.

## 2. Frozen evidence status alphabet

Use four possible AH25/AH28 evidence states:

- `COMMON_MODE_EVIDENCE`
- `INSUFFICIENT_EVIDENCE`
- `INDEPENDENCE_COMPATIBLE`
- `DEPENDENCE_OTHER_DIRECTION`

The original AH28 seven-panel ensemble does not exercise the fourth state.

AH33 therefore adds three frozen negative-dependence panels.

## 3. Frozen additional controls

Use:

\[
ANTI\_ARCHIVE=(52000,24000,24000,0)
\]

and:

\[
ANTI\_BATCH=(1300,600,600,0).
\]

Add:

### H_ANTI_ALL

Anti archive + `[ANTI,ANTI]`.

Expected:

\[
(
S_L,S_R,S_A
)
=
(
DEPENDENCE\_OTHER\_DIRECTION,
DEPENDENCE\_OTHER\_DIRECTION,
DEPENDENCE\_OTHER\_DIRECTION
).
\]

### I_ANTI_ARCHIVE_RECENT_CLEAN

Anti archive + `[I,I]`.

Expected:

\[
(
DEPENDENCE\_OTHER\_DIRECTION,
INDEPENDENCE\_COMPATIBLE,
INSUFFICIENT\_EVIDENCE
).
\]

### J_RECENT_ANTI

Independence archive + `[ANTI,ANTI]`.

Expected:

\[
(
INSUFFICIENT\_EVIDENCE,
DEPENDENCE\_OTHER\_DIRECTION,
DEPENDENCE\_OTHER\_DIRECTION
).
\]

Total frozen panel count:

\[
\boxed{10}.
\]

## 4. Full target

For each panel:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

Arbitration remains the AH28 rule.

The ten panels contain:

\[
\boxed{9}
\]

distinct full targets.

Expected target entropy under the uniform ten-panel ensemble:

\[
\boxed{
H(M)=3.1219280948873624
\text{ bits}.
}
\]

## 5. Nested task hierarchy

Define deterministic task/release transformations.

### COMMON_ONLY

\[
f_C(s)=
\begin{cases}
COMMON & s=COMMON\_MODE\_EVIDENCE\\
NOT\_COMMON & \text{otherwise}.
\end{cases}
\]

Partition:

\[
\{C\}
\mid
\{I,S,D\}.
\]

### TRIAGE

\[
f_T(s)=
\begin{cases}
COMMON & s=C\\
UNKNOWN & s=I\\
KNOWN\_NON\_COMMON & s\in\{S,D\}.
\end{cases}
\]

Partition:

\[
\{C\}
\mid
\{I\}
\mid
\{S,D\}.
\]

### FULL_STATUS

\[
f_F(s)=s.
\]

Partition:

\[
\{C\}
\mid
\{I\}
\mid
\{S\}
\mid
\{D\}.
\]

Thus:

\[
COMMON\_ONLY
\prec
TRIAGE
\prec
FULL\_STATUS.
\]

## 6. Frozen grants

Reuse AH32's five grants:

1. `HISTORIAN : Q_LIFETIME`
2. `OPERATOR : Q_RECENT`
3. `ADAPTIVE_CONTROLLER : Q_ADAPTIVE`
4. `AUDITOR : Q_LIFETIME`
5. `AUDITOR : Q_RECENT`

Each grant independently chooses one of the three release modes.

Total design space:

\[
\boxed{3^5=243}.
\]

## 7. Global task profiles

Freeze three profiles.

For profile \(P\), every grant's release mode must be at least as informative as \(P\) in the nested hierarchy.

This operationalizes exact task sufficiency.

### COMMON_ONLY profile

All 243 designs are task-sufficient.

Expected coalition-safe designs:

\[
\boxed{106}.
\]

### TRIAGE profile

Each grant must be TRIAGE or FULL_STATUS.

Task-sufficient designs:

\[
2^5=32.
\]

Expected coalition-safe designs:

\[
\boxed{4}.
\]

### FULL_STATUS profile

Every grant must be FULL_STATUS.

Task-sufficient designs:

\[
\boxed{1}.
\]

Coalition-safe designs:

\[
\boxed{0}.
\]

## 8. Task information

For each profile, form the three-horizon task vector:

\[
T_P=
(
f_P(S_L),
f_P(S_R),
f_P(S_A)
).
\]

Expected entropy:

### COMMON_ONLY

\[
\boxed{
H(T_C)=1.9609640474436811
}
\]

### TRIAGE

\[
\boxed{
H(T_T)=2.721928094887362
}
\]

### FULL_STATUS

\[
\boxed{
H(T_F)=3.1219280948873624.
}
\]

The FULL task vector determines the full target because arbitration is deterministic from lifetime and recent.

## 9. Maximum privacy under each task profile

For each profile, among task-sufficient designs maximize:

\[
H(M\mid Z_{\rm grand}).
\]

Tie-break by:

1. minimum total release richness score;
2. lexicographic mode tuple.

Mode richness scores:

- COMMON_ONLY = 0
- TRIAGE = 1
- FULL_STATUS = 2

Expected:

### COMMON_ONLY

Maximum residual entropy:

\[
\boxed{
1.160964047443681
}
\]

Unique selected minimum-richness design:

```text
COMMON_ONLY
COMMON_ONLY
COMMON_ONLY
COMMON_ONLY
COMMON_ONLY
```

Pooled descriptor classes:

\[
\boxed{5}.
\]

### TRIAGE

Maximum residual entropy:

\[
\boxed{0.4}.
\]

Unique selected design:

```text
TRIAGE
TRIAGE
TRIAGE
TRIAGE
TRIAGE
```

Pooled descriptor classes:

\[
\boxed{7}.
\]

### FULL_STATUS

Residual entropy:

\[
\boxed{0}.
\]

No coalition-safe task-sufficient design exists.

## 10. Information accounting

Because each selected pooled task descriptor is a deterministic function of \(M\):

\[
H(M)=H(T_P)+H(M\mid T_P).
\]

Acceptance requires:

### COMMON_ONLY

\[
1.9609640474436811
+
1.160964047443681
=
3.1219280948873624.
\]

### TRIAGE

\[
2.721928094887362
+
0.4
=
3.1219280948873624.
\]

### FULL_STATUS

\[
3.1219280948873624
+
0
=
3.1219280948873624.
\]

Thus richer task fidelity consumes residual uncertainty in the frozen model.

## 11. TRIAGE safe-family structure

Among the 32 TRIAGE-task-sufficient designs, exactly four are coalition-safe.

Acceptance requires:

- `OPERATOR:Q_RECENT` remains TRIAGE;
- `ADAPTIVE_CONTROLLER:Q_ADAPTIVE` remains TRIAGE;
- `AUDITOR:Q_RECENT` remains TRIAGE;
- either lifetime carrier may be TRIAGE or FULL_STATUS.

Therefore:

\[
2^2=4
\]

safe TRIAGE designs.

Any FULL_STATUS upgrade to either recent carrier or to adaptive evidence collapses exact privacy in the frozen panel ensemble.

This is ensemble-relative and must not be generalized beyond the frozen panel.

## 12. FULL_STATUS impossibility

When all five authorized tasks require exact statuses, every task-sufficient release design must expose exact:

\[
S_L,S_R,S_A.
\]

Therefore:

\[
H(M\mid Z_{\rm grand})=0.
\]

So under unrestricted pooling:

\[
\boxed{
\text{FULL_STATUS task fidelity}
\Rightarrow
\text{no coalition-safe release design}
}
\]

within the frozen representation family.

## 13. Privacy-utility frontier

The frozen selected points are:

\[
(
H(T_P),
H(M\mid Z_P)
)
\]

equal to:

\[
\boxed{
(1.9609640474436811,\ 1.160964047443681)
}
\]

\[
\boxed{
(2.721928094887362,\ 0.4)
}
\]

\[
\boxed{
(3.1219280948873624,\ 0)
}.
\]

Task information is monotone increasing.

Residual privacy is monotone decreasing.

## 14. Interpretation

AH33 supports:

\[
\boxed{
\text{task richness and coalition privacy trade off through retained distinctions}
}
\]

and:

\[
\boxed{
\text{some task contracts are too rich to support the desired deny under unrestricted pooling}.
}
\]

It sharpens AH32:

\[
\boxed{
\text{task sufficiency must itself be governed}.
}
\]

## 15. Claim firewall

AH33 does not establish:

- a universal privacy-utility law;
- differential privacy;
- cryptographic secrecy;
- a production privacy budget;
- optimal real-world task definitions;
- robustness to auxiliary information.

It proves only finite partition, entropy, exhaustive-design, feasibility, and frontier facts over the frozen ten-panel model.
