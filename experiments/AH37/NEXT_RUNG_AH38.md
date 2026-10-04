# AH38 Candidate — Hiding Commitments, Key Scope, and Disclosure-Safe Epoch Receipts

AH37 finds a negative result:

A deterministic public SHA-256 digest of a rich old-epoch disclosure is enough to recover the old target in the frozen tiny domain by enumeration.

AH38 should compare commitment/receipt constructions with different observer capabilities.

Candidate constructions:

1. public deterministic digest:
   \[
   H(Z_0)
   \]
2. keyed MAC where the observer lacks the key:
   \[
   HMAC_K(Z_0)
   \]
3. salted digest with public salt;
4. salted digest with secret salt;
5. panel-independent policy receipt with no data commitment.

Questions:

- Which constructions remain enumerable under a frozen candidate domain?
- Does secret material merely relocate authority to the key holder?
- What happens when the key is later disclosed?
- Can receipt verification be separated from disclosure to unauthorized observers?
- How should key authority and evidence authority compose?

Core principle:

\[
\text{verifiability}
\neq
\text{publicly revealing the commitment value to every observer}.
\]

This would reconnect epoch boundaries to external authority and commitment leakage from AH14/AH16.
