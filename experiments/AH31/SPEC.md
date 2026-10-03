# AH31 Frozen Specification

## 1. Purpose

AH31 extends AH30 from one actor to coalitions of actors.

For actor coalition \(C\), define pooled direct release set:

\[
\mathcal R(C)
=
\bigcup_{a\in C}\mathcal R(a).
\]

Define coalition effective authority:

\[
\boxed{
\mathcal A_{\rm eff}(C)
=
Cl(\mathcal R(C))
}
\]

using the AH30 derivation closure.

## 2. Frozen contracts

Let:

\[
L=Q_{\rm LIFETIME},
\quad
R=Q_{\rm RECENT},
\quad
A=Q_{\rm ADAPTIVE},
\quad
M=Q_{\rm MULTI}.
\]

Frozen derivation rules:

\[
M\Rightarrow L,R,A
\]

and:

\[
L\land R\land A\Rightarrow M.
\]

## 3. Frozen actor panel

Exclude roles that individually already derive or directly receive `Q_MULTI`.

Use exactly four individually derivation-safe roles:

### HISTORIAN

\[
\mathcal R(H)=\{L\}.
\]

### OPERATOR

\[
\mathcal R(O)=\{R\}.
\]

### ADAPTIVE_CONTROLLER

\[
\mathcal R(A_c)=\{A\}.
\]

### AUDITOR

\[
\mathcal R(U)=\{L,R\}.
\]

Every singleton must satisfy:

\[
M\notin Cl(\mathcal R(\{a\})).
\]

## 4. Exhaustive coalition enumeration

There are:

\[
2^4=16
\]

actor coalitions.

A coalition is `MULTI_DERIVABLE` iff:

\[
M\in Cl(\mathcal R(C)).
\]

Expected dangerous coalition family:

\[
\{
\{A_c,U\},
\{H,O,A_c\},
\{H,A_c,U\},
\{O,A_c,U\},
\{H,O,A_c,U\}
\}.
\]

Exactly:

\[
\boxed{5/16}
\]

coalitions derive `Q_MULTI`.

## 5. Minimal dangerous coalitions

Expected minimal dangerous coalitions:

\[
\boxed{
\{A_c,U\}
}
\]

and:

\[
\boxed{
\{H,O,A_c\}
}.
\]

The first is a two-actor collusion.

The second is a three-actor collusion.

Minimum collusion size:

\[
\boxed{2}.
\]

## 6. Mandatory collusion core

Intersect the minimal dangerous coalitions:

\[
\{A_c,U\}
\cap
\{H,O,A_c\}
=
\{A_c\}.
\]

Therefore:

\[
\boxed{
ADAPTIVE\_CONTROLLER
}
\]

is mandatory in every minimal `Q_MULTI`-deriving coalition in the frozen actor panel.

This is task-relative to the frozen role allocation.

## 7. Minimal actor cut sets

Treat the minimal dangerous coalitions as success paths for derivation.

A cut set intersects every minimal dangerous coalition.

Expected minimal cut sets:

\[
\boxed{
\{A_c\}
}
\]

\[
\boxed{
\{U,H\}
}
\]

\[
\boxed{
\{U,O\}
}.
\]

Thus disabling or isolating `ADAPTIVE_CONTROLLER` alone destroys all `Q_MULTI` collusion paths in the frozen panel.

Alternatively, both the Auditor and one of the two single-horizon roles must be blocked.

## 8. Uniform-panel information cross-check

Reuse the AH28/AH29 seven-panel ensemble.

Define target:

\[
M_{\rm state}
=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

For each actor coalition \(C\), construct descriptor from the pooled single-horizon releases:

\[
D_C.
\]

Acceptance requires exact equivalence:

\[
\boxed{
M\in Cl(\mathcal R(C))
\iff
H(M_{\rm state}\mid D_C)=0.
}
\]

for all 16 coalitions.

Thus symbolic closure and finite information sufficiency must agree exactly.

## 9. Frozen entropy controls

Expected:

### Auditor alone

\[
H(M_{\rm state}\mid L,R)
=
0.39355535745192405.
\]

### Historian + Operator

Also only \(L,R\):

\[
0.39355535745192405.
\]

### Historian + Adaptive

\[
H(M_{\rm state}\mid L,A)
=
0.2857142857142857.
\]

### Operator + Adaptive

\[
H(M_{\rm state}\mid R,A)
=
0.6792696431662097.
\]

### Auditor + Adaptive

\[
H(M_{\rm state}\mid L,R,A)=0.
\]

### Historian + Operator + Adaptive

\[
H(M_{\rm state}\mid L,R,A)=0.
\]

These controls show that all singleton actors and selected non-dangerous coalitions retain positive uncertainty.

## 10. Individually safe / collectively unsafe witness

Require:

\[
M\notin Cl(\mathcal R(U))
\]

and:

\[
M\notin Cl(\mathcal R(A_c)).
\]

But:

\[
\boxed{
M\in Cl(\mathcal R(\{U,A_c\})).
}
\]

So:

\[
\boxed{
\text{per-actor derivation safety}
\not\Rightarrow
\text{coalition derivation safety}.
}
\]

## 11. Unrestricted pooling impossibility

Consider every configuration formed by removing zero or more of the five baseline direct grants:

- \(H:L\)
- \(O:R\)
- \(A_c:A\)
- \(U:L\)
- \(U:R\)

There are:

\[
2^5=32
\]

release configurations.

Require organizational coverage:

\[
L,R,A
\]

must each remain released to at least one actor.

Assume unrestricted pooling by the grand coalition of all four actors.

Then any coverage-preserving configuration has pooled direct set containing:

\[
\{L,R,A\}.
\]

Therefore:

\[
M\in Cl(\mathcal R(\text{ALL}))
\]

for every such configuration.

Acceptance requires exhaustive enumeration showing:

\[
\boxed{
0
}
\]

coverage-preserving configurations are grand-coalition derivation-safe.

## 12. Consequence of the impossibility result

Under the frozen assumptions, a system-wide effective deny on `Q_MULTI` cannot coexist with all three conditions:

1. lifetime evidence is released somewhere;
2. recent evidence is released somewhere;
3. adaptive evidence is released somewhere;
4. every holder may pool releases without restriction.

At least one assumption must change.

Possible future mechanisms include:

- coalition/pooling restrictions;
- transformed non-composable releases;
- removal of one component horizon;
- cryptographic or trusted-compute boundaries.

AH31 does not implement those mechanisms.

## 13. Coalition access-structure interpretation

The `Q_MULTI` derivation family is upward-closed.

Minimal successful coalitions:

\[
\{A_c,U\},
\quad
\{H,O,A_c\}.
\]

This is a finite access structure, reconnecting AH30 derivation closure to the AH19 coalition topology and AH20 cut-set duality.

## 14. Deterministic receipt

The qualification receipt records:

- actor panel;
- all 16 coalitions;
- pooled direct releases;
- effective closure;
- residual entropy;
- dangerous/safe classification;
- minimal dangerous coalitions;
- mandatory core;
- minimal cut sets;
- coverage-preserving configuration count;
- safe coverage-preserving configuration count;
- replay hash.

## 15. Interpretation

AH31 supports:

\[
\boxed{
\text{coalition effective authority}
=
Cl\left(\bigcup_{a\in C}\mathcal R(a)\right)
}
\]

and:

\[
\boxed{
\text{individual least privilege does not compose automatically under pooling}.
}
\]

## 16. Claim firewall

AH31 does not establish:

- cryptographic collusion resistance;
- side-channel security;
- real organizational trust boundaries;
- secure multiparty computation;
- legal separation of duties;
- a production IAM policy.

It proves only finite coalition, closure, conditional-entropy, access-structure, cut-set, and exhaustive release-configuration facts for the frozen model.
