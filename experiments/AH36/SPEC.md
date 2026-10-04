# AH36 Frozen Specification

## 1. Purpose

AH36 asks:

> What exactly changes when a task-refinement permission is revoked after richer evidence has already been released?

AH14/AH15 distinguished permission revocation from memory downgrade and erasure.

AH36 applies the same discipline to the distinction-access-structure branch.

## 2. Frozen substrate

Reuse AH35's ten-panel ensemble and five release grants:

1. `HISTORIAN : Q_LIFETIME`
2. `OPERATOR : Q_RECENT`
3. `ADAPTIVE_CONTROLLER : Q_ADAPTIVE`
4. `AUDITOR : Q_LIFETIME`
5. `AUDITOR : Q_RECENT`

Task/release levels:

\[
COMMON\_ONLY < TRIAGE < FULL\_STATUS.
\]

Reuse the full target:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

## 3. Three frozen disclosure views

At step \(t\), track:

### Authority view

\[
P^{auth}_t
\]

is the maximum release mode currently authorized for each grant.

It answers:

> What could a newly materialized release legally contain now?

### Current materialized view

\[
P^{cur}_t
\]

is the mode of the values currently materialized for each grant.

Revoking authority does not automatically mutate previously materialized values.

### Historical ledger view

\[
L_t
=
(Z_{e_1},Z_{e_2},\ldots)
\]

contains every release snapshot emitted so far.

The ledger is append-only in this experiment.

## 4. Frozen privacy metric

For any descriptor \(Z\):

\[
\Pi(Z)=H(M\mid Z)
\]

over the uniform ten-panel ensemble.

Positive \(\Pi\) means exact target reconstruction is impossible on the frozen ensemble.

Zero \(\Pi\) means the descriptor exactly determines the frozen target.

## 5. Frozen dynamic sequence

Grant order remains:

```text
HISTORIAN:LIFETIME
OPERATOR:RECENT
ADAPTIVE_CONTROLLER:ADAPTIVE
AUDITOR:LIFETIME
AUDITOR:RECENT
```

### E0 — INITIAL_RELEASE

Authority:

```text
COMMON_ONLY / COMMON_ONLY / COMMON_ONLY / COMMON_ONLY / COMMON_ONLY
```

Current materialized release matches authority.

Emit snapshot to ledger.

Expected:

\[
\Pi_{auth}
=
\Pi_{cur}
=
\Pi_{ledger}
=
1.160964047443681.
\]

Descriptor classes:

\[
5.
\]

### E1 — GRANT_H_L_TRIAGE_AND_REFRESH

Grant:

```text
H_L:T
```

Authority/current:

```text
TRIAGE / COMMON_ONLY / COMMON_ONLY / COMMON_ONLY / COMMON_ONLY
```

Emit refreshed snapshot.

Expected:

\[
\Pi_{auth}
=
\Pi_{cur}
=
\Pi_{ledger}
=
0.6754887502163468.
\]

Descriptor classes:

\[
6.
\]

### E2 — GRANT_ADAPTIVE_TRIAGE_AND_REFRESH

Grant:

```text
A_A:T
```

Authority/current:

```text
TRIAGE / COMMON_ONLY / TRIAGE / COMMON_ONLY / COMMON_ONLY
```

Emit refreshed snapshot.

Expected:

\[
\Pi_{auth}
=
\Pi_{cur}
=
\Pi_{ledger}
=
0.4.
\]

Descriptor classes:

\[
7.
\]

### E3 — GRANT_ADAPTIVE_FULL_AND_REFRESH

Grant:

```text
A_A:F
```

Authority/current:

```text
TRIAGE / COMMON_ONLY / FULL_STATUS / COMMON_ONLY / COMMON_ONLY
```

This is one AH35 minimal collapse path.

Emit refreshed snapshot.

Expected:

\[
\boxed{
\Pi_{auth}
=
\Pi_{cur}
=
\Pi_{ledger}
=
0.
}
\]

Descriptor classes:

\[
9.
\]

## 6. Revocation without current-value downgrade

### E4 — REVOKE_H_L_TRIAGE_ONLY

Revoke:

```text
H_L:T
```

and therefore historian lifetime authority falls to:

```text
COMMON_ONLY.
```

New authority profile:

```text
COMMON_ONLY / COMMON_ONLY / FULL_STATUS / COMMON_ONLY / COMMON_ONLY
```

But do **not** rematerialize the current historian value and do **not** append a new release snapshot.

Therefore current materialized profile remains:

```text
TRIAGE / COMMON_ONLY / FULL_STATUS / COMMON_ONLY / COMMON_ONLY
```

Expected authority-view privacy:

\[
\boxed{
\Pi_{auth}=0.4
}
\]

with:

\[
7
\]

authority descriptor classes.

Expected current-view privacy remains:

\[
\boxed{
\Pi_{cur}=0
}
\]

with:

\[
9
\]

current descriptor classes.

Historical ledger remains:

\[
\boxed{
\Pi_{ledger}=0.
}
\]

Thus:

\[
\boxed{
\text{permission revoked}
\not\Rightarrow
\text{current disclosure coarsened}.
}
\]

## 7. Explicit current-value downgrade

### E5 — DOWNGRADE_H_L_CURRENT_AND_REFRESH

Rematerialize historian lifetime at its now-authorized level:

```text
COMMON_ONLY.
```

Current profile now equals authority:

```text
COMMON_ONLY / COMMON_ONLY / FULL_STATUS / COMMON_ONLY / COMMON_ONLY
```

Append this downgraded snapshot to the ledger.

Expected:

\[
\boxed{
\Pi_{auth}
=
\Pi_{cur}
=
0.4.
}
\]

Current descriptor classes:

\[
7.
\]

But historical ledger still contains the E3 collapsing disclosure.

Expected:

\[
\boxed{
\Pi_{ledger}=0
}
\]

with:

\[
9
\]

ledger descriptor classes.

Thus:

\[
\boxed{
\text{current disclosure coarsened}
\not\Rightarrow
\text{historical disclosure erased}.
}
\]

## 8. Fresh observer versus historical observer

At E5 define:

### Fresh observer

Receives only the E5 current materialized snapshot.

Expected:

\[
\boxed{
H(M\mid Z_{\rm fresh})=0.4.
}
\]

### Historical observer

Receives the full append-only ledger through E5.

Expected:

\[
\boxed{
H(M\mid Z_{\rm history})=0.
}
\]

So the same current authorization state supports different privacy outcomes depending on prior disclosure history.

## 9. History-projection control

Construct a **toy projection** that discards all pre-E5 snapshots and retains only the final downgraded snapshot.

Expected:

\[
\boxed{
H(M\mid Z_{\rm projected})=0.4.
}
\]

This is only a mathematical control.

It must not be described as secure erasure, because AH36 does not model copies, caches, commitments, side channels, or adversarial retention.

## 10. Monotonic ledger information

Because the historical ledger only appends deterministic release snapshots, residual uncertainty must never increase:

\[
\Pi_{ledger}(t+1)
\le
\Pi_{ledger}(t).
\]

Expected ledger privacy sequence:

\[
\boxed{
[
1.160964047443681,
0.6754887502163468,
0.4,
0,
0,
0
].
}
\]

Once exact reconstruction occurs at E3, the append-only ledger never recovers privacy.

## 11. Current-view non-monotonicity

Expected current privacy sequence:

\[
\boxed{
[
1.160964047443681,
0.6754887502163468,
0.4,
0,
0,
0.4
].
}
\]

Current disclosure can regain positive residual privacy after explicit downgrade.

Therefore:

\[
\boxed{
\text{current-view privacy can recover while historical-view privacy cannot}.
}
\]

## 12. Authority/current mismatch witness

At E4:

\[
P^{auth}_{E4}
\neq
P^{cur}_{E4}.
\]

Specifically historian lifetime is:

```text
authority = COMMON_ONLY
current materialized = TRIAGE
```

Acceptance requires a deterministic status:

```text
REVOKED_BUT_STALE_DISCLOSURE_PRESENT
```

At E5:

```text
AUTHORITY_AND_CURRENT_ALIGNED
```

## 13. Frozen event receipts

Every event receipt records:

- event id;
- operation;
- authority profile;
- current materialized profile;
- whether a release snapshot was emitted;
- authority residual privacy;
- current residual privacy;
- ledger residual privacy;
- authority descriptor classes;
- current descriptor classes;
- ledger descriptor classes;
- authority/current alignment status;
- deterministic receipt hash.

Replay must be byte-exact.

## 14. Interpretation

AH36 supports:

\[
\boxed{
\text{permission revocation is prospective}
}
\]

in the frozen disclosure model unless a separate current-value downgrade occurs.

It also supports:

\[
\boxed{
\text{privacy restoration is observer-history relative}.
}
\]

A fresh observer may see only the downgraded release, while a historical observer may retain enough prior information to reconstruct the denied target.

## 15. Claim firewall

AH36 does not establish:

- secure deletion;
- cryptographic forward secrecy;
- cache invalidation guarantees;
- revocation security in deployed systems;
- deletion of third-party copies;
- erasure of commitments or side channels.

It proves only finite current-view, authority-view, and append-only-ledger information properties over the frozen ten-panel model.