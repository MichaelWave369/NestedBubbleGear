# AH30 Frozen Specification

## 1. Purpose

AH30 formalizes the negative result from AH29:

\[
Q_{\rm MULTI}
\notin
\mathcal A_{\rm direct}
\]

does not imply:

\[
Q_{\rm MULTI}
\notin
\mathcal A_{\rm effective}.
\]

Define:

\[
\boxed{
\mathcal A_{\rm effective}
=
\operatorname{Cl}(\mathcal A_{\rm direct})
}
\]

where `Cl` is deterministic derivation closure.

## 2. Frozen contracts

Let:

\[
L=Q_{\rm LIFETIME},
\]

\[
R=Q_{\rm RECENT},
\]

\[
A=Q_{\rm ADAPTIVE},
\]

\[
M=Q_{\rm MULTI}.
\]

## 3. Frozen derivation rules

AH28 `Q_MULTI` contains the three single-horizon states, so:

\[
M\Rightarrow L,R,A.
\]

AH29 proved that all three singles reconstruct the informational content of `Q_MULTI`, so:

\[
L\land R\land A\Rightarrow M.
\]

No other derivation rules are frozen.

## 4. Closure algorithm

Starting from seed set \(S\):

1. add every consequence of the frozen rules;
2. repeat until no new contract appears.

Acceptance requires:

### Extensivity

\[
S\subseteq Cl(S).
\]

### Idempotence

\[
Cl(Cl(S))=Cl(S).
\]

### Monotonicity

\[
S\subseteq T
\Rightarrow
Cl(S)\subseteq Cl(T).
\]

These properties are exhaustively checked over all:

\[
2^4=16
\]

contract subsets.

## 5. Frozen direct role authority

Reuse AH29:

### HISTORIAN

\[
\{L\}
\]

### OPERATOR

\[
\{R\}
\]

### ADAPTIVE_CONTROLLER

\[
\{A\}
\]

### AUDITOR

\[
\{L,R\}
\]

### TRI_HORIZON_ANALYST

\[
\{L,R,A\}
\]

### ROOT_GOVERNOR

\[
\{L,R,A,M\}
\]

## 6. Expected effective authority

### HISTORIAN

\[
Cl(\{L\})=\{L\}.
\]

### OPERATOR

\[
Cl(\{R\})=\{R\}.
\]

### ADAPTIVE_CONTROLLER

\[
Cl(\{A\})=\{A\}.
\]

### AUDITOR

\[
Cl(\{L,R\})=\{L,R\}.
\]

### TRI_HORIZON_ANALYST

\[
\boxed{
Cl(\{L,R,A\})
=
\{L,R,A,M\}
}
\]

so effective authority strictly exceeds direct authority.

### ROOT_GOVERNOR

\[
Cl(\{L,R,A,M\})
=
\{L,R,A,M\}.
\]

## 7. Reverse projection control

Starting only from:

\[
\{M\},
\]

closure must recover:

\[
\boxed{
Cl(\{M\})
=
\{L,R,A,M\}.
}
\]

This encodes that a multi-horizon release necessarily exposes its component horizon states in the frozen contract.

## 8. Hardened-deny problem

Baseline direct release set for `TRI_HORIZON_ANALYST`:

\[
S_0=\{L,R,A\}.
\]

Desired effective deny:

\[
M\notin Cl(S').
\]

Frozen task requirement:

\[
\boxed{
\{L,R\}\subseteq S'
}
\]

because the role must retain lifetime and recent evidence.

Candidate hardened release sets satisfy:

\[
S'\subseteq S_0.
\]

Optimization objective:

1. preserve required contracts \(L,R\);
2. make \(M\) non-derivable;
3. minimize number of removed direct releases;
4. lexicographic tie-break.

## 9. Expected hardening solution

The baseline is unsafe for the deny:

\[
M\in Cl(\{L,R,A\}).
\]

Withhold adaptive only:

\[
S^\star=\{L,R\}.
\]

Then:

\[
M\notin Cl(S^\star).
\]

Removed set:

\[
\boxed{\{A\}}.
\]

Removal count:

\[
\boxed{1}.
\]

This is the unique minimum feasible solution under the frozen task requirement.

## 10. One-removal structural controls

Without the task-preservation constraint, each single removal from:

\[
\{L,R,A\}
\]

breaks exact `Q_MULTI` derivability:

\[
Cl(\{L,R\})=\{L,R\},
\]

\[
Cl(\{L,A\})=\{L,A\},
\]

\[
Cl(\{R,A\})=\{R,A\}.
\]

Thus the unique adaptive-removal result comes from the declared task requirement, not from a claim that adaptive evidence is intrinsically less important.

## 11. Frozen information recovery measure

Reuse the AH29 uniform seven-panel ensemble.

Let:

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

Baseline:

\[
H(M_{\rm state}\mid L,R,A)=0.
\]

Hardened:

\[
\boxed{
H(M_{\rm state}\mid L,R)
=
0.39355535745192405
\text{ bits}.
}
\]

So the hardening restores positive residual uncertainty about the denied multi-horizon answer.

For comparison:

\[
H(M_{\rm state}\mid L,A)
=
0.2857142857142857
\]

and:

\[
H(M_{\rm state}\mid R,A)
=
0.6792696431662097.
\]

All three one-release removals make exact multi reconstruction impossible on the frozen ensemble.

## 12. Direct versus effective deny audit

Define a deny as **interface-only** if:

\[
M\notin S
\]

but:

\[
M\in Cl(S).
\]

Define it as **derivation-safe in the frozen model** if:

\[
M\notin Cl(S).
\]

Expected:

### TRI baseline

`INTERFACE_ONLY_DENY`

### Hardened TRI

`DERIVATION_SAFE_DENY`

## 13. Synthesis receipt

The deterministic hardening receipt contains:

- role;
- baseline direct authority;
- baseline effective authority;
- required direct releases;
- effective deny target;
- selected hardened direct authority;
- selected hardened effective authority;
- removed releases;
- removal count;
- baseline residual entropy;
- hardened residual entropy;
- deny audit before;
- deny audit after;
- version;
- receipt hash.

Replay must be byte-exact.

## 14. Interpretation

AH30 supports:

\[
\boxed{
\text{authority must be closed under derivation}
}
\]

and:

\[
\boxed{
\text{a meaningful deny must be checked against effective authority, not only direct grants}.
}
\]

## 15. Claim firewall

AH30 does not establish:

- cryptographic secrecy;
- side-channel noninterference;
- computational hardness;
- production IAM correctness;
- resistance to external auxiliary information;
- universal minimal disclosure.

It proves only finite deterministic closure, authority, entropy, and release-synthesis properties over the frozen AH28/AH29 model.
