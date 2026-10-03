# AH23 Frozen Specification

## 1. Purpose

AH23 asks whether AH22's policy frontier survives uncertainty in the common Keyhole failure probability.

Freeze the finite scenario set:

\[
\mathcal P=
\{0.05,0.10,0.15,0.20,0.25,0.30\}.
\]

This is a finite uncertainty set, not a claim about a continuous real-world distribution.

## 2. Frozen policy contexts

Reuse AH22 exactly:

- H2_FULL;
- GLOBAL_REAUTH;
- ROUTE_REAUTH;
- ALARM_SOFT_COST;
- ALARM_HARD_DENY.

Legal policy families, hard denies, coalition weights, access structures, and reliability polynomials remain unchanged.

## 3. Robust metrics

For policy \(\pi\), define worst-case reliability:

\[
R_{\min}(\pi)
=
\min_{p\in\mathcal P}
R_\pi(p).
\]

Define capability regret at scenario \(p\):

\[
\operatorname{Regret}(\pi,p)
=
R_{\rm cap}(p)-R_\pi(p).
\]

Define maximum regret:

\[
G_{\max}(\pi)
=
\max_{p\in\mathcal P}
\operatorname{Regret}(\pi,p).
\]

## 4. Robust Pareto dominance

Policy \(A\) robustly dominates policy \(B\) iff:

- `cost(A) <= cost(B)`;
- `induced_singletons(A) <= induced_singletons(B)`;
- `R_min(A) >= R_min(B)`;
- `G_max(A) <= G_max(B)`;

with at least one strict inequality.

The robust frontier contains all nondominated legal policies.

## 5. Full-task robust values

For H2_FULL, GLOBAL_REAUTH, and ROUTE_REAUTH:

### Baseline pair policy

\[
R_{\rm base}(p)=(1-p)^2.
\]

Worst case occurs at \(p=0.30\):

\[
R_{\min}=0.49.
\]

Capability policy:

\[
R_{\rm cap}(p)
=
1-p-p^2+p^3.
\]

At \(p=0.30\):

\[
R_{\rm cap}=0.637.
\]

Baseline maximum regret over the frozen set:

\[
G_{\max}=0.147.
\]

Capability maximum regret:

\[
0.
\]

Expected robust frontiers:

- H2_FULL:
  \[
  (0,1,0.49,0.147),
  (3,0,0.637,0)
  \]
- GLOBAL_REAUTH:
  \[
  (0,1,0.49,0.147),
  (5,0,0.637,0)
  \]
- ROUTE_REAUTH:
  \[
  (0,1,0.49,0.147),
  (2,0,0.637,0)
  \]

Tuple order:

\[
(\text{cost},\text{induced cuts},R_{\min},G_{\max}).
\]

## 6. Alarm soft-cost robust values

### Baseline

\[
R_{\rm base}(p)=1-p.
\]

At \(p=0.30\):

\[
R_{\min}=0.70.
\]

Capability:

\[
R_{\rm cap}(p)=1-p^2.
\]

At \(p=0.30\):

\[
0.91.
\]

Maximum regret:

\[
0.21.
\]

### Pair-backup hardening

\[
R_{\rm pair}(p)=1-2p^2+p^3.
\]

At \(p=0.30\):

\[
R_{\min}=0.847.
\]

Regret relative to capability:

\[
R_{\rm cap}-R_{\rm pair}
=
p^2(1-p).
\]

Maximum on the frozen scenario set occurs at \(p=0.30\):

\[
G_{\max}=0.063.
\]

### Full capability

\[
R_{\min}=0.91,
\qquad
G_{\max}=0.
\]

Expected robust frontier:

\[
(0,1,0.70,0.21),
\]

\[
(1,0,0.847,0.063),
\]

\[
(5,0,0.91,0).
\]

All three remain nondominated.

## 7. Alarm hard-deny robust values

Singleton `{E1}` remains forbidden.

Expected robust frontier:

\[
(0,1,0.70,0.21),
\]

\[
(1,0,0.847,0.063).
\]

The zero-regret capability point is infeasible.

## 8. Frontier stability

Freeze the AH22 single-point frontier membership and compare it with AH23 robust frontier membership.

Acceptance requires exact policy-family equality between:

- AH22 frontier at `p=0.1`;
- AH23 robust frontier over \(\mathcal P\).

Thus:

\[
\boxed{
\text{no frontier membership reversal}
}
\]

under the frozen common-\(p\) uncertainty model.

This is a result, not a design requirement for future heterogeneous models.

## 9. Scenario monotonicity

For every legal policy and every adjacent frozen scenario:

\[
p_i < p_{i+1}
\Longrightarrow
R_\pi(p_i)\ge R_\pi(p_{i+1}).
\]

Acceptance requires exact monotone non-increase across the frozen set.

Therefore worst-case reliability occurs at:

\[
p=0.30
\]

for every legal policy.

## 10. Robust threshold queries

For ALARM_SOFT_COST:

### Worst-case reliability

Minimum cost achieving:

\[
R_{\min}\ge0.84
\]

is:

\[
1.
\]

Minimum cost achieving:

\[
R_{\min}\ge0.90
\]

is:

\[
5.
\]

### Maximum regret

Minimum cost achieving:

\[
G_{\max}\le0.07
\]

is:

\[
1.
\]

Minimum cost achieving:

\[
G_{\max}\le0.01
\]

is:

\[
5.
\]

For ALARM_HARD_DENY:

\[
R_{\min}\ge0.84
\]

costs 1, while:

\[
R_{\min}\ge0.90
\]

is infeasible.

Likewise:

\[
G_{\max}\le0.07
\]

costs 1, while:

\[
G_{\max}\le0.01
\]

is infeasible.

## 11. Interpretation

AH23 supports:

\[
\boxed{
\text{a policy can be evaluated across uncertainty without collapsing the trade space to one score}
}
\]

and, in this frozen common-failure model:

\[
\boxed{
\text{AH22 frontier membership is robust across the declared scenarios}
}
\]

## 12. Claim firewall

AH23 does not establish:

- the true Keyhole failure probability;
- independence or identical failure rates in deployed systems;
- continuous-interval robustness;
- correlated-failure robustness;
- real operational risk;
- a preferred governance choice.

It proves only finite robust-frontier facts over the declared scenario set and frozen toy model.
