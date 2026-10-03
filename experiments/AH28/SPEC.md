# AH28 Frozen Specification

## 1. Purpose

AH28 turns AH27's horizon-relative evidence into an explicit governance API.

Core principle:

\[
\boxed{
\text{evidence without a declared time horizon is an incomplete governance claim}
}
\]

## 2. Frozen evidence memories

Reuse AH27:

### Lifetime

\[
D_{\rm life}(t)
=
A_0+\sum_{i=1}^{t}B_i.
\]

### Recent two-batch

\[
D_{\rm recent}(t)
=
B_{t-1}+B_t.
\]

### Adaptive discounted

\[
D_{\rm adaptive}(t)
=
0.1D_{\rm adaptive}(t-1)+B_t.
\]

## 3. Frozen query contracts

### Q_LIFETIME

Returns only the lifetime evidence state.

Receipt horizon:

`LIFETIME`

### Q_RECENT

Returns only the two-batch recent evidence state.

Receipt horizon:

`RECENT_2`

### Q_ADAPTIVE

Returns only the discounted evidence state.

Receipt horizon:

`DISCOUNTED_0.1`

### Q_MULTI

Returns all three states plus an arbitration state.

Receipt horizon:

`MULTI`

## 4. Underspecified request refusal

If a request asks:

> What is the evidence state?

but provides no query contract / horizon, return:

\[
\boxed{REFUSE\_UNDERSPECIFIED\_HORIZON}
\]

No default horizon is permitted.

## 5. Evidence-to-signal mapping

Raw evidence states map only to scoped signals.

### COMMON_MODE_EVIDENCE

\[
\to
RISK\_SIGNAL
\]

### INDEPENDENCE_COMPATIBLE

\[
\to
NO\_COMMON\_MODE\_SIGNAL
\]

### INSUFFICIENT_EVIDENCE

\[
\to
UNCERTAIN
\]

### DEPENDENCE_OTHER_DIRECTION

\[
\to
OTHER\_DEPENDENCE\_SIGNAL
\]

The output string `SAFE` is forbidden.

`INDEPENDENCE_COMPATIBLE` therefore does not imply a universal safety claim.

## 6. Arbitration rule

Compare lifetime and recent evidence states first.

### CONSISTENT

If:

\[
S_{\rm life}=S_{\rm recent},
\]

emit:

\[
\boxed{CONSISTENT}.
\]

### RECENT_RISK_ONLY

If:

\[
S_{\rm recent}=COMMON\_MODE\_EVIDENCE
\]

and:

\[
S_{\rm life}\neq COMMON\_MODE\_EVIDENCE,
\]

emit:

\[
\boxed{RECENT\_RISK\_ONLY}.
\]

### LIFETIME_RISK_ONLY

If:

\[
S_{\rm life}=COMMON\_MODE\_EVIDENCE
\]

and:

\[
S_{\rm recent}\neq COMMON\_MODE\_EVIDENCE,
\]

emit:

\[
\boxed{LIFETIME\_RISK\_ONLY}.
\]

### HORIZON_CONFLICT

All other disagreements emit:

\[
\boxed{HORIZON\_CONFLICT}.
\]

The adaptive/discounted state is preserved in the receipt but does not overwrite the primary lifetime-vs-recent arbitration label.

## 7. Frozen panels

### Panel A — RECENT_RISK

Use AH27 primary state after `[I,C]`.

Expected:

- lifetime:
  `INSUFFICIENT_EVIDENCE`
- recent:
  `COMMON_MODE_EVIDENCE`
- adaptive:
  `COMMON_MODE_EVIDENCE`

Arbitration:

\[
\boxed{RECENT\_RISK\_ONLY}
\]

### Panel B — THREE_WAY_SPLIT

Use AH27 primary state after `[I,C,C,I]`.

Expected:

- lifetime:
  `INSUFFICIENT_EVIDENCE`
- recent:
  `COMMON_MODE_EVIDENCE`
- adaptive:
  `INSUFFICIENT_EVIDENCE`

Arbitration:

\[
\boxed{RECENT\_RISK\_ONLY}
\]

The adaptive state is not allowed to silently cancel the recent warning.

### Panel C — CONSISTENT_COMPATIBLE

Use independence archive plus `[I,I]`.

Expected:

- lifetime:
  `INDEPENDENCE_COMPATIBLE`
- recent:
  `INDEPENDENCE_COMPATIBLE`
- adaptive:
  `INDEPENDENCE_COMPATIBLE`

Arbitration:

\[
\boxed{CONSISTENT}
\]

### Panel D — LIFETIME_RISK

Use a large common-mode archive:

\[
A_C=(72200,3800,3800,20200)
\]

followed by `[I,I]`.

Expected:

- lifetime:
  `COMMON_MODE_EVIDENCE`
- recent:
  `INDEPENDENCE_COMPATIBLE`
- adaptive:
  `COMMON_MODE_EVIDENCE`

Arbitration:

\[
\boxed{LIFETIME\_RISK\_ONLY}
\]

### Panel E — CONSISTENT_RISK

Use the same common-mode archive followed by `[C,C]`.

Expected:

- lifetime:
  `COMMON_MODE_EVIDENCE`
- recent:
  `COMMON_MODE_EVIDENCE`
- adaptive:
  `COMMON_MODE_EVIDENCE`

Arbitration:

\[
\boxed{CONSISTENT}
\]

### Panel F — ORDER_WITNESS_A

Use AH27:

\[
[C,C,I,I].
\]

Expected:

- lifetime:
  `INSUFFICIENT_EVIDENCE`
- recent:
  `INDEPENDENCE_COMPATIBLE`
- adaptive:
  `INDEPENDENCE_COMPATIBLE`

Arbitration:

\[
\boxed{HORIZON\_CONFLICT}
\]

because lifetime and recent are different non-common states.

### Panel G — ORDER_WITNESS_B

Use AH27:

\[
[I,I,C,C].
\]

Expected:

- lifetime:
  `INSUFFICIENT_EVIDENCE`
- recent:
  `COMMON_MODE_EVIDENCE`
- adaptive:
  `COMMON_MODE_EVIDENCE`

Arbitration:

\[
\boxed{RECENT\_RISK\_ONLY}
\]

Panels F and G share the same lifetime table but produce different governance arbitration.

## 8. Same-lifetime governance witness

Require:

\[
D_{\rm life}(F)=D_{\rm life}(G).
\]

Yet:

\[
A(F)=HORIZON\_CONFLICT,
\]

\[
A(G)=RECENT\_RISK\_ONLY.
\]

Therefore lifetime evidence alone is insufficient to reproduce the multi-horizon governance answer.

## 9. Request API

Frozen request form:

```text
query(panel_id, query_contract)
```

Expected examples:

```text
query(A, Q_RECENT)
-> COMMON_MODE_EVIDENCE
```

```text
query(A, Q_LIFETIME)
-> INSUFFICIENT_EVIDENCE
```

```text
query(A, Q_MULTI)
-> RECENT_RISK_ONLY
```

Missing contract:

```text
query(A, None)
-> REFUSE_UNDERSPECIFIED_HORIZON
```

Unknown contract:

```text
-> REFUSE_UNKNOWN_QUERY_CONTRACT
```

## 10. Receipts

Every accepted query receipt contains:

- panel id;
- query contract;
- declared horizon;
- evidence status or arbitration status;
- scoped signal;
- source memory descriptor;
- version;
- deterministic receipt hash.

Refusal receipts contain:

- refusal reason;
- panel id;
- version;
- deterministic hash.

No receipt may omit the horizon for an accepted horizon-specific query.

## 11. No silent collapse

For `Q_MULTI` with arbitration other than `CONSISTENT`, the result must not emit one synthetic evidence state.

It emits the individual horizon states plus arbitration.

Thus:

\[
\boxed{
\text{conflicting horizons remain visible}
}
\]

## 12. Interpretation

AH28 supports:

\[
\boxed{
R_{\mathcal Q,\tau}(\Gamma)
}
\]

as an operational memory/evidence contract in the frozen model.

It also supports:

\[
\boxed{
\text{time horizon is part of governance semantics}
}
\]

rather than an implementation detail.

## 13. Claim firewall

AH28 does not establish:

- that any frozen horizon is correct for a deployed system;
- a universal arbitration policy;
- production safety semantics;
- a legal/compliance decision rule;
- that `INDEPENDENCE_COMPATIBLE` means safe.

It proves only finite request-routing, refusal, arbitration, and receipt properties for the frozen evidence panels.
