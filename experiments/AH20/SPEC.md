# AH20 Frozen Specification

## 1. Purpose

AH20 converts AH19 access structures into a finite failure/resilience analysis.

For task \(Q\), let:

\[
\mathcal A_Q
\]

be the mathematical capability family and:

\[
\mathcal P_Q
\subsetneq
\mathcal A_Q
\]

be the policy-authorized family.

For a failed-Keyhole set:

\[
F\subseteq E,
\qquad
E=\{E_1,E_2,E_3\},
\]

a family survives iff:

\[
\exists C
\text{ in the family such that }
C\cap F=\varnothing.
\]

## 2. Frozen history ensemble and Keyholes

Reuse AH19 exactly.

There are 48 histories and three Keyholes:

\[
E_1=(H_2)_{00},
\qquad
E_2=(H_2)_{10},
\qquad
E_3=(H_2)_{11}.
\]

AH20 re-derives the AH19 access structures from conditional entropy before performing resilience analysis.

## 3. Capability access structures

For:

- `H2_FULL`
- `GLOBAL_REAUTH`
- `ROUTE_REAUTH`

the capable family is:

\[
\mathcal A_{\rm full}
=
\{
\{E_1,E_2\},
\{E_2,E_3\},
\{E_1,E_2,E_3\}
\}.
\]

Minimal capable coalitions:

\[
\{E_1,E_2\},
\qquad
\{E_2,E_3\}.
\]

For `C_CLASS_ALARM`:

\[
\mathcal A_C
=
\{
\{E_1\},
\{E_3\},
\{E_1,E_2\},
\{E_1,E_3\},
\{E_2,E_3\},
\{E_1,E_2,E_3\}
\}.
\]

Minimal capable coalitions:

\[
\{E_1\},
\qquad
\{E_3\}.
\]

## 4. Minimal cut sets

A cut set \(F\) destroys a family iff every coalition in that family intersects \(F\).

A minimal cut set is a cut set with no strict subset that is also a cut set.

Equivalently, minimal cut sets are minimal hitting sets of the minimal successful coalitions.

### Full capability tasks

Expected minimal capability cuts:

\[
\boxed{
\{E_2\},
\quad
\{E_1,E_3\}
}
\]

So \(E_2\) is a single point of capability failure.

### Coarse alarm capability

Expected minimal capability cut:

\[
\boxed{
\{E_1,E_3\}
}
\]

No singleton Keyhole failure destroys alarm capability.

## 5. Frozen policy families

### H2_FULL policy

Minimal authorized coalition:

\[
\{E_1,E_2\}.
\]

Minimal policy cuts:

\[
\boxed{
\{E_1\},
\quad
\{E_2\}
}
\]

Policy therefore introduces an additional singleton vulnerability at \(E_1\).

### GLOBAL_REAUTH policy

Same as H2_FULL:

\[
\boxed{
\{E_1\},
\quad
\{E_2\}
}
\]

Additional singleton vulnerability:

\[
\{E_1\}.
\]

### ROUTE_REAUTH policy

Minimal authorized coalition:

\[
\{E_2,E_3\}.
\]

Minimal policy cuts:

\[
\boxed{
\{E_2\},
\quad
\{E_3\}
}
\]

Additional singleton vulnerability:

\[
\{E_3\}.
\]

### C_CLASS_ALARM policy

Minimal authorized coalition:

\[
\{E_3\}.
\]

Minimal policy cut:

\[
\boxed{
\{E_3\}
}
\]

Capability has no singleton cut, so policy introduces \(E_3\) as a single point of failure.

## 6. Failure-family monotonicity

If failure set \(F\) destroys a family, every superset must also destroy it:

\[
F\text{ fails}
\land
F\subseteq F'
\Longrightarrow
F'\text{ fails}.
\]

AH20 exhaustively checks this property over all eight failure sets for both capability and policy families.

## 7. Cut-set duality

For each task and each family:

1. compute minimal successful coalitions;
2. compute all minimal hitting sets of those minimal coalitions;
3. compute minimal failure sets directly;
4. require exact equality.

This verifies the finite success/failure duality rather than merely asserting it.

## 8. Independent-failure reliability model

For a diagnostic reliability comparison only, assume each Keyhole fails independently with common probability:

\[
p.
\]

This is not asserted as a real-world failure model.

Define:

\[
R(p)=P(\text{task survives}).
\]

AH20 derives exact polynomial coefficients by enumerating all eight failure states.

### Full capability tasks

\[
R_{\rm cap}^{\rm full}(p)
=
1-p-p^2+p^3.
\]

Equivalent form:

\[
R_{\rm cap}^{\rm full}(p)
=
(1-p)(1-p^2).
\]

### H2/GLOBAL/ROUTE policy

Each frozen full-task policy requires one specific pair:

\[
R_{\rm pol}^{\rm full}(p)
=
(1-p)^2
=
1-2p+p^2.
\]

Capability-policy gap:

\[
\Delta R_{\rm full}(p)
=
p(1-p)^2.
\]

At:

\[
p=0.1:
\quad
R_{\rm cap}=0.891,
\quad
R_{\rm pol}=0.81,
\quad
\Delta R=0.081.
\]

At:

\[
p=0.5:
\quad
R_{\rm cap}=0.375,
\quad
R_{\rm pol}=0.25,
\quad
\Delta R=0.125.
\]

### C_CLASS_ALARM capability

\[
R_{\rm cap}^{C}(p)
=
1-p^2.
\]

### C_CLASS_ALARM policy

\[
R_{\rm pol}^{C}(p)
=
1-p.
\]

Gap:

\[
\Delta R_C(p)
=
p(1-p).
\]

At:

\[
p=0.1:
\quad
0.99
\text{ versus }
0.9.
\]

At:

\[
p=0.5:
\quad
0.75
\text{ versus }
0.5.
\]

## 9. Policy-induced fragility

Define singleton cut set family:

\[
S(\mathcal F)
=
\{
\{E_i\}:
\{E_i\}\text{ is a minimal cut of }\mathcal F
\}.
\]

Policy-induced singleton vulnerabilities are:

\[
S(\mathcal P_Q)
\setminus
S(\mathcal A_Q).
\]

Frozen results:

| Task | Capability singleton cuts | Policy singleton cuts | Policy-induced |
|---|---|---|---|
| H2_FULL | \(\{E_2\}\) | \(\{E_1\},\{E_2\}\) | \(\{E_1\}\) |
| GLOBAL_REAUTH | \(\{E_2\}\) | \(\{E_1\},\{E_2\}\) | \(\{E_1\}\) |
| ROUTE_REAUTH | \(\{E_2\}\) | \(\{E_2\},\{E_3\}\) | \(\{E_3\}\) |
| C_CLASS_ALARM | none | \(\{E_3\}\) | \(\{E_3\}\) |

## 10. Interpretation

AH20 distinguishes:

\[
\boxed{
\text{capability resilience}
\neq
\text{policy resilience}
}
\]

A governance policy can deliberately reject mathematically redundant coalitions and thereby create operational single points of failure.

That may be acceptable policy, but it is a measurable tradeoff rather than a free choice.

## 11. Claim firewall

AH20 does not establish:

- real-world hardware reliability;
- independent component failure in deployed systems;
- safety-critical fault tolerance;
- Byzantine resilience;
- cryptographic quorum availability;
- operational service-level guarantees.

It proves only finite failure-set, hitting-set, and toy reliability properties for the frozen authority access structures.
