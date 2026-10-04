# AH40 Candidate — Split Verification Authority and Threshold Declassification

AH39 shows that key authority alone does not recreate a withheld authenticator, but once a panel-dependent authenticator is released into a history that also contains the relevant key, the old target becomes fully reconstructible in the frozen toy model.

AH40 should split verification authority across multiple principals.

Candidate construction:

- verifier A holds one share/capability;
- verifier B holds another;
- ordinary observer receives only mediated verification results;
- no single verifier can expose the old authenticator path alone;
- authorized quorum can produce a verification result without necessarily releasing the authenticator itself.

Questions:

1. What are the minimal verifier coalitions capable of declassification?
2. Can verification succeed at quorum while public disclosure remains coarsened?
3. What happens if one verifier later releases its share/history?
4. Can threshold authority be represented as an access structure over **verification capabilities** rather than evidence distinctions?
5. How does this reconnect to AH18/AH19 quorum topology?

Core distinction:

[
\text{verification quorum}
\neq
\text{public evidence release quorum}.
]
