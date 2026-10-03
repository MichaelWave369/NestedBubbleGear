# AH26 Frozen Specification

## 1. Purpose

AH26 asks:

> When should a governed system change its redundancy warning as evidence accumulates?

It explicitly separates:

\[
\text{raw evidence classification}
\]

from:

\[
\text{governed alert state}.
\]

## 2. Frozen AH25 classifier

Reuse the AH25 contingency-table statistics and thresholds exactly.

Statuses:

- `INSUFFICIENT_EVIDENCE`
- `INDEPENDENCE_COMPATIBLE`
- `COMMON_MODE_EVIDENCE`
- `DEPENDENCE_OTHER_DIRECTION`

Minimum sample size:

\[
N_{\min}=400.
\]

## 3. Frozen batches

The sequence is deterministic.

### B1 — SMALL_AMBIGUOUS

\[
(15,4,4,2),
\qquad
N=25.
\]

### B2 — INDEPENDENT_625

\[
(361,114,114,36),
\qquad
N=625.
\]

### B3 — COMMON_CAUSE_500

\[
(361,19,19,101),
\qquad
N=500.
\]

### B4 — COMMON_CAUSE_500

same as B3.

### B5 — INDEPENDENT_312500

\[
500\times(361,114,114,36)
=
(180500,57000,57000,18000).
\]

### B6 — INDEPENDENT_625

same as B2.

All cumulative tables preserve:

\[
p_1=p_3=0.24.
\]

## 4. Expected cumulative evidence states

After B1:

\[
N=25,
\]

status:

\[
\boxed{INSUFFICIENT\_EVIDENCE}.
\]

After B2:

\[
N=650,
\]

\[
\Delta=0.0008615384615384622,
\]

\[
p_{\chi^2}=0.9041487156232365,
\]

status:

\[
\boxed{INDEPENDENCE\_COMPATIBLE}.
\]

After B3:

\[
N=1150,
\]

\[
\Delta=0.0632695652173913,
\]

status:

\[
\boxed{COMMON\_MODE\_EVIDENCE}.
\]

After B4:

\[
N=1650,
\]

\[
\Delta=0.08785454545454545,
\]

status:

\[
\boxed{COMMON\_MODE\_EVIDENCE}.
\]

After B5:

\[
N=314150,
\]

\[
\Delta=0.0004614356199267866,
\]

\[
p_{\chi^2}=0.1562111806842332,
\]

status:

\[
\boxed{INDEPENDENCE\_COMPATIBLE}.
\]

After B6:

\[
N=314775,
\]

status:

\[
\boxed{INDEPENDENCE\_COMPATIBLE}.
\]

Thus the frozen raw sequence is exactly:

\[
I_E,
I_C,
C,
C,
I_C,
I_C
\]

where \(I_E\) means insufficient evidence and \(I_C\) means independence compatible.

## 5. Governed persistence rule

Track:

- `common_streak`;
- `compatible_streak`;
- `alert_active`.

### Activation

If raw state is `COMMON_MODE_EVIDENCE`:

\[
common\_streak\leftarrow common\_streak+1.
\]

Reset:

\[
compatible\_streak\leftarrow0.
\]

Activate only when:

\[
common\_streak\ge2.
\]

### Clear

If raw state is `INDEPENDENCE_COMPATIBLE`:

\[
compatible\_streak\leftarrow compatible\_streak+1.
\]

Reset:

\[
common\_streak\leftarrow0.
\]

If alert is active, clear only when:

\[
compatible\_streak\ge2.
\]

### Other states

`INSUFFICIENT_EVIDENCE` and `DEPENDENCE_OTHER_DIRECTION` reset both persistence streaks but do not silently clear an active common-mode alert.

## 6. Frozen governed states

Expected governed sequence:

### B1

\[
\boxed{NO\_ALERT}
\]

### B2

\[
\boxed{NO\_ALERT}
\]

### B3

first common-mode hit:

\[
\boxed{PENDING\_ESCALATION}
\]

### B4

second consecutive common-mode hit:

\[
\boxed{ACTIVE\_ALERT}
\]

### B5

first independence-compatible hit after activation:

\[
\boxed{ACTIVE\_PENDING\_CLEAR}
\]

### B6

second consecutive independence-compatible hit:

\[
\boxed{CLEARED\_AFTER\_PERSISTENCE}
\]

The active alert therefore survives one contrary compatible state.

## 7. Naive mirror negative control

Define a naive alert:

\[
A_{\rm naive}=1
\iff
\text{raw status is COMMON_MODE_EVIDENCE}.
\]

Frozen naive sequence:

\[
0,0,1,1,0,0.
\]

This:

- escalates one batch earlier than the governed rule;
- clears one batch earlier than the governed rule.

The governed rule is intentionally less reactive in both directions.

## 8. Reliability evidence trace

Freeze:

\[
p_2=0.10.
\]

At every cumulative step:

\[
\widehat R_{\rm observed}
=
0.9(1-\hat p_{11}).
\]

Marginal-only independence assumption remains:

\[
R_{\rm assumed}=0.84816
\]

at every step because:

\[
p_1=p_3=0.24.
\]

Expected observed dual-path reliability:

| Batch | \(\widehat R_{\rm observed}\) |
|---|---:|
| B1 | 0.8280000000000001 |
| B2 | 0.8473846153846154 |
| B3 | 0.7912173913043478 |
| B4 | 0.769090909090909 |
| B5 | 0.8477447079420659 |
| B6 | 0.8477455325232309 |

At B4, the marginal-only assumption overstates the observed redundancy estimate by:

\[
0.07906909090909091.
\]

## 9. Event ledger

Every batch must emit a deterministic receipt containing:

- batch id;
- incremental table;
- cumulative table;
- raw status;
- governed state;
- streak counters;
- alert-active flag;
- observed reliability;
- marginal-only assumed reliability.

Replaying the same sequence must produce byte-identical receipts.

## 10. Interpretation

AH26 supports:

\[
\boxed{
\text{evidence state}
\neq
\text{governance transition}
}
\]

and:

\[
\boxed{
\text{persistence can prevent one-batch alert flapping}
}
\]

within the frozen sequential panel.

## 11. Claim firewall

AH26 does not establish:

- universally correct sequential thresholds;
- valid repeated-testing error rates;
- an optimal hysteresis rule;
- real operational alert policy;
- causal proof from statistical dependence.

It demonstrates only the frozen deterministic evidence classifier and persistence state machine.
