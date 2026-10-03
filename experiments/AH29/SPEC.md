# AH29 Frozen Specification

## 1. Purpose

AH29 asks:

> Which evidence horizons may an actor inspect, and what can still be inferred from the horizons that are legitimately released?

Core distinction:

\[
\boxed{
\text{EVIDENCE CAPABILITY}
\neq
\text{EVIDENCE AUTHORITY}
}
\]

and a second, stricter distinction:

\[
\boxed{
\text{interface denial}
\neq
\text{informational non-derivability}.
}
\]

## 2. Frozen substrate

Reuse the AH28 seven-panel ensemble:

- `A_RECENT_RISK`
- `B_THREE_WAY_SPLIT`
- `C_CONSISTENT_COMPATIBLE`
- `D_LIFETIME_RISK`
- `E_CONSISTENT_RISK`
- `F_ORDER_A`
- `G_ORDER_B`

The substrate can compute all contracts for every panel:

- `Q_LIFETIME`
- `Q_RECENT`
- `Q_ADAPTIVE`
- `Q_MULTI`

## 3. Frozen authority matrix

### HISTORIAN

Authorized:

\[
\{Q_{\rm LIFETIME}\}.
\]

### OPERATOR

Authorized:

\[
\{Q_{\rm RECENT}\}.
\]

### ADAPTIVE_CONTROLLER

Authorized:

\[
\{Q_{\rm ADAPTIVE}\}.
\]

### AUDITOR

Authorized:

\[
\{Q_{\rm LIFETIME},Q_{\rm RECENT}\}.
\]

### TRI_HORIZON_ANALYST

Authorized:

\[
\{Q_{\rm LIFETIME},Q_{\rm RECENT},Q_{\rm ADAPTIVE}\}.
\]

Explicitly denied:

\[
Q_{\rm MULTI}.
\]

### ROOT_GOVERNOR

Authorized:

\[
\{Q_{\rm LIFETIME},Q_{\rm RECENT},Q_{\rm ADAPTIVE},Q_{\rm MULTI}\}.
\]

## 4. Authorization semantics

Accepted request:

```text
role_query(role, panel, contract)
```

returns the scoped AH28 evidence release plus:

- role;
- authority decision `ALLOW`;
- deterministic receipt hash.

Denied known contract:

```text
REFUSE_UNAUTHORIZED_HORIZON
```

Missing contract:

```text
REFUSE_UNDERSPECIFIED_HORIZON
```

Unknown contract:

```text
REFUSE_UNKNOWN_QUERY_CONTRACT
```

Unknown role:

```text
REFUSE_UNKNOWN_ROLE
```

No denied receipt may include:

- `evidence_status`
- `states`
- `signals`
- `arbitration`
- hidden horizon tables

## 5. Capability-authority witnesses

The substrate can answer a contract even when a role cannot.

Example:

```text
substrate(A, Q_RECENT)
-> COMMON_MODE_EVIDENCE
```

while:

```text
role_query(HISTORIAN, A, Q_RECENT)
-> REFUSE_UNAUTHORIZED_HORIZON
```

Thus:

\[
\boxed{
\text{substrate capability does not imply actor authority}.
}
\]

## 6. Release invariance witnesses

### HISTORIAN witness

Panels:

- `F_ORDER_A`
- `G_ORDER_B`

have the same lifetime evidence state:

\[
INSUFFICIENT\_EVIDENCE
\]

but different recent states:

\[
INDEPENDENCE\_COMPATIBLE
\]

versus:

\[
COMMON\_MODE\_EVIDENCE.
\]

The historian's released evidence payload must be identical across the two panels.

### OPERATOR witness

Panels:

- `C_CONSISTENT_COMPATIBLE`
- `D_LIFETIME_RISK`

have the same recent state:

\[
INDEPENDENCE\_COMPATIBLE
\]

but different lifetime states:

\[
INDEPENDENCE\_COMPATIBLE
\]

versus:

\[
COMMON\_MODE\_EVIDENCE.
\]

The operator release must be identical across the pair.

### ADAPTIVE_CONTROLLER witness

Panels:

- `C_CONSISTENT_COMPATIBLE`
- `F_ORDER_A`

have the same adaptive state:

\[
INDEPENDENCE\_COMPATIBLE
\]

but different lifetime states.

The adaptive-controller release must be identical across the pair.

### AUDITOR witness

Panels:

- `A_RECENT_RISK`
- `B_THREE_WAY_SPLIT`

have the same pair:

\[
(
S_{\rm lifetime},
S_{\rm recent}
)
=
(
INSUFFICIENT\_EVIDENCE,
COMMON\_MODE\_EVIDENCE
)
\]

but different adaptive states:

\[
COMMON\_MODE\_EVIDENCE
\]

versus:

\[
INSUFFICIENT\_EVIDENCE.
\]

The auditor's authorized lifetime+recent snapshot must be identical across the pair.

## 7. Uniform-panel information test

Treat the seven frozen panels as a uniform finite ensemble.

Define the full multi-horizon target:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

Because arbitration is deterministic from lifetime and recent in AH28, the informational distinction is carried by the three horizon states.

### Auditor

Descriptor:

\[
D_{\rm AUDITOR}
=
(
S_{\rm lifetime},
S_{\rm recent}
).
\]

Expected:

\[
H(M\mid D_{\rm AUDITOR})
=
0.39355535745192405
\text{ bits}.
\]

So lifetime+recent does **not** determine the full multi-horizon answer.

### TRI_HORIZON_ANALYST

Descriptor:

\[
D_{\rm TRI}
=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive}
).
\]

Expected:

\[
\boxed{
H(M\mid D_{\rm TRI})=0.
}
\]

Therefore the role can reconstruct the informational content of `Q_MULTI` even though the API denies that contract.

## 8. Denied-Q_MULTI negative control

For `TRI_HORIZON_ANALYST`:

```text
role_query(TRI_HORIZON_ANALYST, panel, Q_MULTI)
-> REFUSE_UNAUTHORIZED_HORIZON
```

for every panel.

Yet:

```text
derive_multi(
    Q_LIFETIME,
    Q_RECENT,
    Q_ADAPTIVE
)
```

must reproduce the substrate `Q_MULTI`:

- three horizon states;
- three scoped signals;
- arbitration.

Thus:

\[
\boxed{
\text{contract deny}
\not\Rightarrow
\text{answer non-derivability}.
}
\]

This is a deliberate negative result.

## 9. Single-role residual uncertainty

Under the same uniform panel ensemble:

### HISTORIAN

\[
H(S_{\rm recent}\mid S_{\rm lifetime})
=
0.7493017854052187
\text{ bits}.
\]

### OPERATOR

\[
H(S_{\rm lifetime}\mid S_{\rm recent})
=
1.1428571428571428
\text{ bits}.
\]

### ADAPTIVE_CONTROLLER

\[
H(M\mid S_{\rm adaptive})
=
1.1428571428571428
\text{ bits}.
\]

These positive conditional entropies demonstrate that the corresponding authorized releases do not determine the listed unauthorized targets in the frozen ensemble.

## 10. Underspecified horizon survives root authority

Even `ROOT_GOVERNOR` must receive:

```text
REFUSE_UNDERSPECIFIED_HORIZON
```

when no contract is supplied.

Broad authority does not repair an incomplete query.

## 11. Receipt semantics

Accepted receipts include:

- role;
- panel id;
- query contract;
- declared horizon;
- authority decision `ALLOW`;
- released evidence payload;
- deterministic hash.

Denied receipts include:

- role;
- panel id;
- requested contract if known;
- refusal reason;
- authority decision `DENY`;
- deterministic hash.

Denied receipts do not contain evidence values.

## 12. Interpretation

AH29 supports:

\[
\boxed{
\text{evidence least privilege is a property of released information, not only API permission bits}
}
\]

and:

\[
\boxed{
\text{authority composition must account for derivability}.
}
\]

## 13. Claim firewall

AH29 does not establish:

- cryptographic secrecy;
- noninterference against side channels;
- production IAM correctness;
- legal privacy guarantees;
- security against colluding actors;
- that interface denial prevents inference.

It proves only finite authorization, release-invariance, conditional-entropy, and derivability facts over the frozen AH28 panel ensemble.
