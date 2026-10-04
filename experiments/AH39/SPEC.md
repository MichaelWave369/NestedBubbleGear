# AH39 Frozen Specification

## 1. Purpose

AH39 asks:

> What changes when verification-key authority changes after an epoch boundary?

The experiment distinguishes:

- a public authenticator already retained by the observer;
- an authenticator withheld behind mediated verification;
- a later key disclosure;
- a later authenticator disclosure.

AH38's 8-key public-HMAC control is already enumerable, so AH39 must not falsely describe later key release as the event that first reveals the target in that branch.

## 2. Frozen substrate

Reuse AH38's ten-panel ensemble.

Full target:

\[
M=
(
S_{\rm lifetime},
S_{\rm recent},
S_{\rm adaptive},
A_{\rm arbitration}
).
\]

Epoch-0 rich profile:

```text
TRIAGE
COMMON_ONLY
FULL_STATUS
COMMON_ONLY
COMMON_ONLY
```

Epoch-1 profile:

```text
COMMON_ONLY
COMMON_ONLY
FULL_STATUS
COMMON_ONLY
COMMON_ONLY
```

Expected:

\[
H(M\mid Z_1)=0.4.
\]

## 3. Frozen toy HMAC construction

Reuse the AH38 keyspace:

```text
AH38-KEY-0
...
AH38-KEY-7
```

Actual key:

```text
AH38-KEY-3
```

Authenticator:

\[
T_0=HMAC\_SHA256(K,Z_0).
\]

AH38 already established under exhaustive 8-key × old-state enumeration:

\[
H(M\mid T_0,Z_1)=0.
\]

Therefore the public-tag branch begins already declassified in the frozen toy model.

## 4. Panel-independent key disclosure

The actual key value is the same across all ten candidate panels.

If an observer receives:

\[
(K,Z_1)
\]

but never received \(T_0\) or \(Z_0\), then \(K\) contributes no panel distinction.

Expected:

\[
\boxed{
H(M\mid K,Z_1)=0.4.
}
\]

This is a finite information statement only: a constant key value across candidate worlds cannot distinguish those worlds by itself.

## 5. Public-tag history branch

### P0 — TAG_PUBLIC_BEFORE_KEY

Observer has:

\[
(T_0,Z_1).
\]

Expected:

\[
\boxed{H(M\mid T_0,Z_1)=0.}
\]

### P1 — KEY_DISCLOSED_AFTER_PUBLIC_TAG

Observer now has:

\[
(T_0,K,Z_1).
\]

Expected:

\[
\boxed{H(M\mid T_0,K,Z_1)=0.}
\]

No privacy transition occurs because the tag branch was already fully revealing in the frozen finite-keyspace attacker model.

Emit status:

```text
ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE
```

## 6. Tag-withheld branch

### W0 — TAG_WITHHELD_BEFORE_KEY

Observer has:

\[
Z_1
\]

plus panel-independent metadata saying an old epoch was verified.

Expected:

\[
\boxed{H(M)=0.4\text{ residual given observer descriptor}.}
\]

### W1 — KEY_DISCLOSED_TAG_STILL_WITHHELD

Observer has:

\[
(K,V_0,Z_1)
\]

where \(V_0\) is the mediated panel-independent `VERIFIED` receipt.

Expected:

\[
\boxed{
H(M\mid K,V_0,Z_1)=0.4.
}
\]

Emit status:

```text
KEY_DISCLOSED_BUT_AUTHENTICATOR_WITHHELD
```

### W2 — TAG_RELEASED_AFTER_KEY

Observer now receives:

\[
T_0
\]

in addition to retained:

\[
(K,V_0,Z_1).
\]

Expected:

\[
\boxed{
H(M\mid T_0,K,V_0,Z_1)=0.
}
\]

Emit status:

```text
RETROACTIVE_AUTHENTICATOR_DECLASSIFICATION
```

The privacy transition is tied to release of the panel-dependent authenticator, not to the earlier key release alone.

## 7. Mediated-receipt branch

Observer retains only:

\[
(V_0,Z_1)
\]

before key disclosure.

After key disclosure it has:

\[
(K,V_0,Z_1).
\]

Expected privacy sequence:

\[
\boxed{0.4\rightarrow0.4}.
\]

So a later key disclosure does not retroactively turn a panel-independent receipt into a panel-dependent authenticator.

## 8. Artifact-history principle

Let:

\[
\mathcal H_A
\]

be artifacts previously released to the observer, and:

\[
\mathcal H_K
\]

be key-authority history.

Define frozen effective disclosure descriptor:

\[
D_{\rm eff}=F(\mathcal H_A,\mathcal H_K,Z_1).
\]

AH39 demonstrates three cases:

### Public-tag history

\[
T_0\in\mathcal H_A
\]

already determines the target in the toy model.

### Key-only history

\[
K\in\mathcal H_K,\quad T_0\notin\mathcal H_A
\]

does not determine the old target.

### Later tag release

\[
K\in\mathcal H_K,\quad T_0\text{ later added to }\mathcal H_A
\]

collapses residual privacy.

Thus:

\[
\boxed{
\text{key authority and authenticator history compose}.
}
\]

## 9. Revoking or rotating the key after public-tag exposure

Freeze a final control:

After P1, remove the key from **current authority** but preserve the observer's previously received public tag and previously disclosed key history.

Historical observer remains:

\[
\boxed{H(M)=0\text{ residual}.}
\]

Emit:

```text
KEY_REVOKED_BUT_DISCLOSURE_HISTORY_PERSISTS
```

This parallels AH36:

\[
\text{current key authority revoked}
\neq
\text{historical key/artifact disclosure erased}.
\]

## 10. Observer table

Expected:

| State | Artifacts / key history | Residual privacy |
|---|---|---:|
| FRESH_E1 | Z1 | 0.4 |
| P0 | public T0 + Z1 | 0 |
| P1 | public T0 + K + Z1 | 0 |
| W0 | mediated VERIFIED + Z1 | 0.4 |
| W1 | K + mediated VERIFIED + Z1 | 0.4 |
| W2 | T0 + K + mediated VERIFIED + Z1 | 0 |
| P2 revoked-current-key control | retained T0 + retained K history + Z1 | 0 |

## 11. No high-entropy-key extrapolation

AH39 inherits AH38's refusal:

```text
NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE
```

The delayed-key results are exact only for:

- the frozen finite candidate panel ensemble;
- the frozen finite toy keyspace;
- the explicit artifact-history descriptors.

## 12. Interpretation

AH39 supports:

\[
\boxed{
\text{later key disclosure does not recreate an authenticator that was never disclosed}
}
\]

and:

\[
\boxed{
\text{already-public authenticators remain part of disclosure history across later key-policy changes}.
}
\]

It also supports:

\[
\boxed{
\text{effective disclosure must account for both artifact history and key-authority history}.
}
\]

## 13. Claim firewall

AH39 does not establish:

- cryptographic forward secrecy;
- secure key deletion;
- security of high-entropy HMAC keys;
- hiding of public tags under computational assumptions;
- deployed key-rotation correctness;
- side-channel resistance.

It proves only finite observer-history and key-authority composition facts over the frozen toy model.
