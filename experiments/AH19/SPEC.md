# AH19 Frozen Specification

## 1. Purpose

AH19 formalizes coalition capability as an access structure over the Boolean lattice of three authority Keyholes.

For task \(Q\), local actor memory \(D_{\rm local}\), and coalition \(C\), define capability by:

\[
C\in\mathcal A_Q
\iff
H(Q\mid D_{\rm local},C)=0.
\]

The experiment asks:

1. Is \(\mathcal A_Q\) upward-closed under coalition supersets?
2. What are the minimal sufficient coalitions?
3. Which Keyholes appear in every minimal coalition?
4. Do different tasks induce different access structures?
5. Can policy authorization be a strict subfamily of mathematical capability?

## 2. Frozen history ensemble

Reuse the AH11-AH18 ensemble:

\[
U,V\in\{I,A,B,S\},
\qquad
k\in\{-1,0,+1\}.
\]

Define:

\[
T_1=UB^k,
\qquad
T_2=B^{-k}V,
\qquad
P_2=T_1T_2,
\]

\[
H_2=T_1BT_1^{-1},
\]

\[
H_3=P_2CP_2^{-1},
\qquad
C=AB,
\]

\[
R_\Gamma=H_3H_2,
\qquad
G=R_\Gamma A.
\]

Total histories:

\[
48.
\]

## 3. Frozen Keyholes

Use the AH18 authority views:

\[
E_1=(H_2)_{00},
\qquad
E_2=(H_2)_{10},
\qquad
E_3=(H_2)_{11}.
\]

Coalitions are all eight subsets of:

\[
E=\{E_1,E_2,E_3\}.
\]

## 4. Task T1 — H2_FULL

Local memory: none.

Target:

\[
Q_{H2}=H_2.
\]

Frozen conditional-entropy table:

| Coalition | \(H(H_2\mid C)\) |
|---|---:|
| \(\varnothing\) | 1.5 |
| \(\{E_1\}\) | 0.6887218755408672 |
| \(\{E_2\}\) | 0.6887218755408672 |
| \(\{E_3\}\) | 0.6887218755408672 |
| \(\{E_1,E_2\}\) | 0 |
| \(\{E_1,E_3\}\) | 0.6887218755408672 |
| \(\{E_2,E_3\}\) | 0 |
| \(\{E_1,E_2,E_3\}\) | 0 |

Therefore:

\[
\mathcal A_{H2}
=
\{
\{E_1,E_2\},
\{E_2,E_3\},
\{E_1,E_2,E_3\}
\}.
\]

Minimal capable coalitions:

\[
\mathcal M_{H2}
=
\{
\{E_1,E_2\},
\{E_2,E_3\}
\}.
\]

Mandatory core:

\[
\bigcap_{C\in\mathcal M_{H2}} C
=
\{E_2\}.
\]

## 5. Task T2 — GLOBAL_REAUTH

Local memory:

\[
D_{\rm local}=P_2.
\]

Target:

\[
Q_G=G.
\]

Frozen capability structure:

\[
\mathcal A_G
=
\mathcal A_{H2}.
\]

Conditional entropies:

- empty coalition: 0.25 bits;
- every singleton: 0.125 bits;
- \(E_1+E_2\): 0;
- \(E_1+E_3\): 0.125;
- \(E_2+E_3\): 0;
- triple: 0.

Minimal capable coalitions:

\[
\{E_1,E_2\},
\qquad
\{E_2,E_3\}.
\]

Mandatory core:

\[
\{E_2\}.
\]

## 6. Task T3 — ROUTE_REAUTH

Local memory:

\[
D_{\rm local}=H_3.
\]

Target:

\[
Q_R=P_2.
\]

Frozen capability structure:

\[
\mathcal A_R
=
\mathcal A_{H2}.
\]

Conditional entropies:

- empty coalition: 0.5471804688852168 bits;
- every singleton: 0.25 bits;
- \(E_1+E_2\): 0;
- \(E_1+E_3\): 0.25;
- \(E_2+E_3\): 0;
- triple: 0.

Mandatory core:

\[
\{E_2\}.
\]

## 7. Task T4 — C_CLASS_ALARM

Define the coarse target:

\[
Q_C
=
\mathbf 1[
H_2=
\begin{pmatrix}
2&-1\\
1&0
\end{pmatrix}
].
\]

Local memory: none.

Frozen conditional entropies:

| Coalition | \(H(Q_C\mid C)\) |
|---|---:|
| \(\varnothing\) | 0.8112781244591328 |
| \(\{E_1\}\) | 0 |
| \(\{E_2\}\) | 0.6887218755408672 |
| \(\{E_3\}\) | 0 |
| every pair containing \(E_1\) or \(E_3\) | 0 |
| triple | 0 |

Capability family:

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
\mathcal M_C
=
\{
\{E_1\},
\{E_3\}
\}.
\]

Mandatory core:

\[
\varnothing.
\]

Thus the same Keyholes induce a different access structure for a different future query.

## 8. Monotonicity

For every frozen task:

\[
C\in\mathcal A_Q
\land
C\subseteq C'
\Longrightarrow
C'\in\mathcal A_Q.
\]

All four access structures must pass an exhaustive monotonicity check over all coalition pairs.

## 9. Minimal-coalition recovery

Define minimal capable coalition:

\[
C\in\mathcal M_Q
\iff
C\in\mathcal A_Q
\]

and no strict subset of \(C\) is capable.

The harness must recover the preregistered minimal families exactly.

## 10. Mandatory-core statistic

Define:

\[
K_Q
=
\bigcap_{C\in\mathcal M_Q} C.
\]

Frozen results:

\[
K_{H2}
=
K_G
=
K_R
=
\{E_2\},
\]

while:

\[
K_C=\varnothing.
\]

So a Keyhole can be structurally mandatory for one task family and unnecessary for another.

## 11. Policy overlay

Mathematical capability and policy authority are distinct.

Freeze upward-closed authorized families.

### H2_FULL policy

Minimal authorized coalition:

\[
\{E_1,E_2\}.
\]

Authorized family:

\[
\mathcal P_{H2}
=
\{
\{E_1,E_2\},
\{E_1,E_2,E_3\}
\}.
\]

The capable coalition \(\{E_2,E_3\}\) is denied.

### GLOBAL_REAUTH policy

Same policy family as H2_FULL.

### ROUTE_REAUTH policy

Minimal authorized coalition:

\[
\{E_2,E_3\}.
\]

Authorized family:

\[
\mathcal P_R
=
\{
\{E_2,E_3\},
\{E_1,E_2,E_3\}
\}.
\]

The capable coalition \(\{E_1,E_2\}\) is denied.

### C_CLASS_ALARM policy

Minimal authorized coalition:

\[
\{E_3\}.
\]

Authorized family:

\[
\mathcal P_C
=
\{
\{E_3\},
\{E_1,E_3\},
\{E_2,E_3\},
\{E_1,E_2,E_3\}
\}.
\]

Capable coalitions \(\{E_1\}\) and \(\{E_1,E_2\}\) are denied.

For every task:

\[
\mathcal P_Q
\subsetneq
\mathcal A_Q.
\]

## 12. Policy monotonicity

Every frozen authorized family is upward-closed:

\[
C\in\mathcal P_Q
\land
C\subseteq C'
\Longrightarrow
C'\in\mathcal P_Q.
\]

So policy does not revoke authorization merely because an additional Keyhole joins.

## 13. Access-structure comparison

The experiment freezes:

\[
\mathcal A_{H2}
=
\mathcal A_G
=
\mathcal A_R
\]

but:

\[
\mathcal A_C
\neq
\mathcal A_{H2}.
\]

Thus access structure is task-relative:

\[
\boxed{
\mathcal A_Q
\text{ depends on }Q
}
\]

even with the same Keyholes and same underlying histories.

## 14. Interpretation

AH19 supports the finite framework:

\[
\boxed{
\mathcal A_Q
=
\{C:
H(Q\mid D_{\rm local},C)=0\}
}
\]

with:

- upward-closed capability families;
- exact minimal sufficient coalitions;
- task-relative mandatory cores;
- strict policy subfamilies.

## 15. Claim firewall

AH19 does not establish:

- cryptographic access structures;
- monotone span programs;
- secret-sharing security;
- threshold signatures;
- secure multiparty computation;
- collusion resistance;
- real-world identity enforcement.

It proves only finite access-structure, partition, and policy facts for the frozen NBG Keyhole model.
