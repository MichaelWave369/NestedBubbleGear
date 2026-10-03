# AH34 Frozen Specification

## 1. Purpose

AH34 asks:

> Which specific task upgrades consume coalition privacy, which upgrades are free in the frozen ensemble, and how should richer task allocations be constrained by a declared privacy floor?

Reuse AH33's ten-panel evidence ensemble and nested task hierarchy.

## 2. Frozen grants

Grant order:

1. `HISTORIAN : Q_LIFETIME`
2. `OPERATOR : Q_RECENT`
3. `ADAPTIVE_CONTROLLER : Q_ADAPTIVE`
4. `AUDITOR : Q_LIFETIME`
5. `AUDITOR : Q_RECENT`

## 3. Task levels

Use AH33 exactly:

\[
COMMON\_ONLY < TRIAGE < FULL\_STATUS.
\]

Assign richness scores:

\[
r(COMMON\_ONLY)=0,
\]

\[
r(TRIAGE)=1,
\]

\[
r(FULL\_STATUS)=2.
\]

For mixed profile:

\[
P=(p_1,\ldots,p_5),
\]

define total requested richness:

\[
R(P)=\sum_i r(p_i).
\]

This score is a frozen toy utility proxy, not a universal utility measure.

## 4. Mixed-profile space

Each of five grants chooses one of three task levels.

Total profiles:

\[
\boxed{3^5=243}.
\]

Because the hierarchy is nested, the least-disclosing task-sufficient release for profile \(P\) is the profile itself.

No richer release can increase residual privacy.

## 5. Frozen target

Reuse AH33:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
)
\]

over the uniform ten-panel ensemble.

Expected:

\[
\boxed{
H(M)=3.1219280948873624
\text{ bits}.
}
\]

For profile \(P\), let pooled release be:

\[
Z_P.
\]

Define residual privacy:

\[
\Pi(P)=H(M\mid Z_P).
\]

A profile is frozen-model coalition-safe iff:

\[
\Pi(P)>0.
\]

## 6. Residual-privacy spectrum

Across all 243 profiles, expected residual values and counts are:

| residual privacy | profile count |
|---:|---:|
| 1.160964047443681 | 4 |
| 0.8 | 4 |
| 0.6754887502163468 | 17 |
| 0.4 | 46 |
| 0.2 | 35 |
| 0 | 137 |

Therefore:

\[
\boxed{106/243}
\]

profiles retain positive residual privacy, while:

\[
\boxed{137/243}
\]

exactly reconstruct the frozen target.

## 7. Single-upgrade sensitivity

Start from:

```text
COMMON_ONLY
COMMON_ONLY
COMMON_ONLY
COMMON_ONLY
COMMON_ONLY
```

with:

\[
\Pi=1.160964047443681.
\]

Expected single-grant upgrades:

### HISTORIAN lifetime

TRIAGE:

\[
\Pi=0.6754887502163468.
\]

FULL_STATUS:

\[
\Pi=0.4.
\]

### OPERATOR recent

TRIAGE:

\[
\Pi=1.160964047443681.
\]

FULL_STATUS:

\[
\Pi=0.6754887502163468.
\]

### ADAPTIVE_CONTROLLER adaptive

TRIAGE:

\[
\Pi=0.8.
\]

FULL_STATUS:

\[
\Pi=0.4.
\]

### AUDITOR lifetime

TRIAGE:

\[
\Pi=0.6754887502163468.
\]

FULL_STATUS:

\[
\Pi=0.4.
\]

### AUDITOR recent

TRIAGE:

\[
\Pi=1.160964047443681.
\]

FULL_STATUS:

\[
\Pi=0.6754887502163468.
\]

No single-grant upgrade collapses privacy.

## 8. Free task upgrades

Upgrade both recent consumers to TRIAGE:

```text
HISTORIAN lifetime            = COMMON_ONLY
OPERATOR recent               = TRIAGE
ADAPTIVE_CONTROLLER adaptive  = COMMON_ONLY
AUDITOR lifetime              = COMMON_ONLY
AUDITOR recent                = TRIAGE
```

Richness score:

\[
R=2.
\]

Residual privacy remains:

\[
\boxed{
1.160964047443681
}
\]

exactly equal to the all-COMMON baseline.

Thus the frozen ensemble contains richer authorized task allocations with zero additional coalition-information leakage.

## 9. Minimum richness collapse

Among profiles with:

\[
\Pi(P)=0,
\]

the minimum total richness score is:

\[
\boxed{3}.
\]

Exactly two profiles achieve collapse at score 3.

### Collapse witness 1

```text
HISTORIAN lifetime            = COMMON_ONLY
OPERATOR recent               = COMMON_ONLY
ADAPTIVE_CONTROLLER adaptive  = FULL_STATUS
AUDITOR lifetime              = TRIAGE
AUDITOR recent                = COMMON_ONLY
```

### Collapse witness 2

```text
HISTORIAN lifetime            = TRIAGE
OPERATOR recent               = COMMON_ONLY
ADAPTIVE_CONTROLLER adaptive  = FULL_STATUS
AUDITOR lifetime              = COMMON_ONLY
AUDITOR recent                = COMMON_ONLY
```

So adaptive FULL status plus either lifetime TRIAGE carrier is sufficient to exactly reconstruct the frozen target.

No profile with richness score 0, 1, or 2 has zero residual privacy.

## 10. Maximum-richness safe profile

Among all profiles satisfying:

\[
\Pi(P)>0,
\]

the maximum richness score is:

\[
\boxed{7}.
\]

The unique score-7 safe profile is:

```text
HISTORIAN lifetime            = FULL_STATUS
OPERATOR recent               = TRIAGE
ADAPTIVE_CONTROLLER adaptive  = TRIAGE
AUDITOR lifetime              = FULL_STATUS
AUDITOR recent                = TRIAGE
```

with:

\[
\boxed{
\Pi=0.2.
}
\]

Any profile with richness score:

\[
R\ge8
\]

has:

\[
\Pi=0.
\]

## 11. Mixed-profile Pareto frontier

Maximize both:

- total task richness \(R(P)\);
- residual privacy \(\Pi(P)\).

Expected nondominated frontier coordinates:

\[
\boxed{(2,\ 1.160964047443681)}
\]

\[
\boxed{(3,\ 0.8)}
\]

\[
\boxed{(4,\ 0.6754887502163468)}
\]

\[
\boxed{(6,\ 0.4)}
\]

\[
\boxed{(7,\ 0.2)}
\]

\[
\boxed{(10,\ 0)}.
\]

There are:

\[
\boxed{8}
\]

nondominated profiles total because two coordinates have two distinct task allocations.

## 12. Frozen privacy budget

Set required privacy floor:

\[
\boxed{
\epsilon=0.4\text{ bits}.
}
\]

A profile is budget-feasible iff:

\[
\Pi(P)\ge0.4.
\]

Expected feasible count:

\[
\boxed{71}.
\]

Among feasible profiles, maximize total richness score.

Expected maximum:

\[
\boxed{R=6}.
\]

Exactly two profiles achieve the maximum.

### Budget optimum A

```text
COMMON_ONLY
FULL_STATUS
FULL_STATUS
COMMON_ONLY
FULL_STATUS
```

### Budget optimum B

```text
FULL_STATUS
TRIAGE
COMMON_ONLY
FULL_STATUS
TRIAGE
```

Both have:

\[
\Pi=0.4.
\]

Thus a scalar privacy floor plus total richness objective does not uniquely determine role allocation.

## 13. Stronger privacy floor control

At:

\[
\epsilon=0.8,
\]

expected feasible profile count:

\[
\boxed{8}.
\]

Maximum richness score:

\[
\boxed{3}.
\]

Unique optimum:

```text
COMMON_ONLY
TRIAGE
TRIAGE
COMMON_ONLY
TRIAGE
```

with:

\[
\Pi=0.8.
\]

## 14. Maximum privacy by richness score

Expected best achievable privacy at each total richness score:

| richness | max residual privacy |
|---:|---:|
| 0 | 1.160964047443681 |
| 1 | 1.160964047443681 |
| 2 | 1.160964047443681 |
| 3 | 0.8 |
| 4 | 0.6754887502163468 |
| 5 | 0.4 |
| 6 | 0.4 |
| 7 | 0.2 |
| 8 | 0 |
| 9 | 0 |
| 10 | 0 |

This shows plateaus and cliffs rather than a smooth privacy decay.

## 15. Interpretation

AH34 supports:

\[
\boxed{
\text{privacy cost depends on which distinctions are jointly released, not only how many upgrades are granted}
}
\]

and:

\[
\boxed{
\text{some task upgrades are privacy-free in the frozen ensemble while specific combinations collapse privacy abruptly}.
}
\]

It also supports:

\[
\boxed{
\text{privacy budgets can constrain task allocation without uniquely determining it}.
}
\]

## 16. Claim firewall

AH34 does not establish:

- a universal utility score;
- a real privacy budget;
- differential privacy;
- cryptographic confidentiality;
- production role design;
- robustness to auxiliary information;
- universal importance of any specific horizon.

It proves only finite mixed-profile, entropy, Pareto, threshold, and exhaustive-enumeration facts over the frozen AH33 ten-panel model.
