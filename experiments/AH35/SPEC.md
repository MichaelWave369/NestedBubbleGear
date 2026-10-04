# AH35 Frozen Specification

## 1. Purpose

AH35 converts AH34's mixed-task privacy problem into an access structure over **extra distinctions**.

Core question:

> Which task refinements are jointly sufficient to reconstruct the denied target?

## 2. Frozen grants and upgrade atoms

Reuse five AH34 grants:

1. `H_L` = HISTORIAN : Q_LIFETIME
2. `O_R` = OPERATOR : Q_RECENT
3. `A_A` = ADAPTIVE_CONTROLLER : Q_ADAPTIVE
4. `U_L` = AUDITOR : Q_LIFETIME
5. `U_R` = AUDITOR : Q_RECENT

Each grant has two atomic upgrades.

### TRIAGE atom

Suffix:

```text
:T
```

means:

\[
COMMON\_ONLY\to TRIAGE.
\]

### FULL atom

Suffix:

```text
:F
```

means:

\[
TRIAGE\to FULL\_STATUS.
\]

Frozen atom order:

```text
H_L:T
H_L:F
O_R:T
O_R:F
A_A:T
A_A:F
U_L:T
U_L:F
U_R:T
U_R:F
```

## 3. Validity / prerequisite rule

A FULL atom is valid only if its corresponding TRIAGE atom is also present.

For each grant \(g\):

\[
g:F\in X
\Rightarrow
g:T\in X.
\]

The valid subsets of the ten atoms are therefore in one-to-one correspondence with the AH34 profiles:

\[
\boxed{3^5=243}.
\]

## 4. Frozen target and danger criterion

Reuse AH34's ten-panel ensemble and full target:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

For valid upgrade set \(X\), let \(Z_X\) be the pooled release descriptor.

Define:

\[
X\text{ is dangerous}
\iff
H(M\mid Z_X)=0.
\]

Expected:

\[
\boxed{137/243}
\]

valid upgrade sets are dangerous.

Expected:

\[
\boxed{106/243}
\]

retain positive residual privacy.

## 5. Upward closure

Because each refinement only preserves or adds distinctions:

\[
X\subseteq Y
\]

for valid upgrade sets implies:

\[
H(M\mid Z_Y)\le H(M\mid Z_X).
\]

Acceptance requires the dangerous family to be upward-closed over the valid prerequisite-closed upgrade sets:

\[
\boxed{
X\text{ dangerous and }X\subseteq Y
\Rightarrow
Y\text{ dangerous}.
}
\]

## 6. Minimal collapsing upgrade sets

Expected exactly:

\[
\boxed{10}
\]

minimal dangerous upgrade sets.

Using the frozen atom names:

### P1

```text
U_L:T
U_L:F
U_R:T
U_R:F
```

### P2

```text
A_A:T
U_L:T
U_R:T
U_R:F
```

### P3

```text
A_A:T
A_A:F
U_L:T
```

### P4

```text
O_R:T
O_R:F
U_L:T
U_L:F
```

### P5

```text
O_R:T
O_R:F
A_A:T
U_L:T
```

### P6

```text
H_L:T
A_A:T
U_R:T
U_R:F
```

### P7

```text
H_L:T
A_A:T
A_A:F
```

### P8

```text
H_L:T
O_R:T
O_R:F
A_A:T
```

### P9

```text
H_L:T
H_L:F
U_R:T
U_R:F
```

### P10

```text
H_L:T
H_L:F
O_R:T
O_R:F
```

Minimum path cardinality:

\[
\boxed{3}.
\]

Exactly two minimal paths have cardinality 3:

```text
A_A:T + A_A:F + U_L:T
H_L:T + A_A:T + A_A:F
```

These are AH34's minimum-richness collapse witnesses expressed as prerequisite-aware atomic upgrades.

## 7. Mandatory core

Intersect all ten minimal dangerous sets.

Expected:

\[
\boxed{\varnothing}.
\]

There is no single upgrade atom whose presence is mandatory in every collapse path.

So AH35 must not claim a universal one-atom kill switch.

## 8. Inclusion-minimal upgrade cut sets

A cut set intersects every minimal dangerous path.

Expected exactly:

\[
\boxed{12}
\]

inclusion-minimal cuts.

They are:

```text
{H_L:T, U_L:T}

{H_L:T, A_A:T, U_L:F}
{H_L:F, A_A:T, U_L:T}
{H_L:F, A_A:T, U_L:F}

{O_R:T, A_A:T, U_R:T}
{O_R:T, A_A:T, U_R:F}
{O_R:T, A_A:F, U_R:T}
{O_R:T, A_A:F, U_R:F}

{O_R:F, A_A:T, U_R:T}
{O_R:F, A_A:T, U_R:F}
{O_R:F, A_A:F, U_R:T}
{O_R:F, A_A:F, U_R:F}
```

The unique minimum-cardinality cut is:

\[
\boxed{
\{H_L:T,U_L:T\}
}
\]

with cut size:

\[
\boxed{2}.
\]

Interpretation:

> If neither lifetime carrier may refine beyond COMMON_ONLY, every frozen exact-reconstruction path is blocked.

## 9. Structural policy versus scalar richness cap

AH34 showed:

- every profile with richness score \(R\le2\) is safe;
- some profiles with \(R=3\) already collapse privacy.

Therefore the strongest scalar score threshold that guarantees privacy for *every* allocation is:

\[
\boxed{R\le2}.
\]

Under the unique two-atom structural cut:

```text
deny H_L:T
deny U_L:T
```

the other three grants may refine all the way to FULL_STATUS.

The maximum permitted profile is:

```text
COMMON_ONLY
FULL_STATUS
FULL_STATUS
COMMON_ONLY
FULL_STATUS
```

with richness:

\[
\boxed{6}
\]

and residual privacy:

\[
\boxed{0.4\text{ bits}}.
\]

Thus the structural rule permits:

\[
\boxed{3\times}
\]

the scalar guaranteed-safe richness score in this frozen toy metric.

This is not a universal utility comparison.

## 10. Structural-cut policy frontier

For every cut policy \(C\), forbid any profile containing a denied upgrade atom in \(C\).

Compute:

- cut cost = number of denied upgrade atoms;
- maximum permitted richness;
- minimum residual privacy among all permitted profiles.

Among all hitting-set policies, expected nondominated triples:

\[
\boxed{(2,\ 6,\ 0.4)}
\]

\[
\boxed{(3,\ 7,\ 0.2)}
\]

\[
\boxed{(3,\ 4,\ 0.6754887502163468)}
\]

\[
\boxed{(5,\ 3,\ 0.8)}
\]

\[
\boxed{(5,\ 2,\ 1.160964047443681)}.
\]

Coordinates are:

```text
(cut cost, maximum permitted richness, minimum permitted residual privacy)
```

This exposes a governance tradeoff rather than collapsing it into one score.

## 11. Utility-maximal minimal cut

Among inclusion-minimal cuts, the greatest maximum permitted richness is:

\[
\boxed{7}.
\]

One such policy is:

```text
deny A_A:F
deny O_R:F
deny U_R:F
```

It permits the unique AH34 score-7 safe profile:

```text
FULL_STATUS
TRIAGE
TRIAGE
FULL_STATUS
TRIAGE
```

and has worst permitted residual privacy:

\[
\boxed{0.2}.
\]

So a larger structural cut can preserve more maximum task richness while guaranteeing only a smaller privacy margin.

## 12. Exact cut safety

For every inclusion-minimal cut \(C\), acceptance requires:

\[
\boxed{
\text{all profiles avoiding }C
\text{ retain positive residual privacy}.
}
\]

For every proper subset \(C'\subset C\), acceptance requires at least one dangerous profile avoiding \(C'\).

This verifies minimality operationally, not just combinatorially.

## 13. Access-structure duality

Minimal dangerous upgrade sets act as success paths.

Minimal cut sets act as blockers.

This reconnects the task-richness branch to AH19/AH20:

\[
\boxed{
\text{privacy-critical distinctions form an access structure}.
}
\]

But the elements are no longer actors or Keyholes.

They are permissions to retain finer distinctions.

## 14. Deterministic receipt

The receipt records:

- ten upgrade atoms;
- 243 valid upgrade sets;
- 137 dangerous sets;
- 10 minimal dangerous sets;
- empty mandatory core;
- 12 inclusion-minimal cuts;
- unique minimum cut;
- scalar guaranteed-safe cap;
- structural-cut maximum richness;
- structural-cut policy frontier;
- replay hash.

## 15. Interpretation

AH35 supports:

\[
\boxed{
\text{task refinement permissions can themselves have quorum/access-structure behavior}
}
\]

and:

\[
\boxed{
\text{structure-aware deny rules can preserve more useful task richness than scalar caps}.
}
\]

## 16. Claim firewall

AH35 does not establish:

- a production permission architecture;
- cryptographic privacy;
- a universal richness metric;
- a real organizational utility model;
- robustness to auxiliary information;
- universal importance of lifetime evidence.

It proves only finite prerequisite, entropy, access-structure, cut-set, and policy-frontier facts over the frozen AH34 model.
