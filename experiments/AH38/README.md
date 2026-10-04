# NBG-AH38 v0.1.0 — Hiding Commitments, Key Scope, and Disclosure-Safe Epoch Receipts

AH37 showed that a public deterministic SHA-256 digest of a rich old-epoch disclosure can reveal the old target by enumeration in a tiny known domain.

AH38 compares several receipt constructions and makes the observer model explicit.

Frozen constructions:

1. public SHA-256 of the old rich disclosure;
2. public-salt SHA-256;
3. public HMAC-SHA256 tag with the key withheld but drawn from a known 8-key toy keyspace;
4. public secret-salt digest where the hidden salt is drawn from a known 8-salt toy keyspace;
5. mediated verification where a verifier keeps the old disclosure and secret material internal and releases only a panel-independent `VERIFIED` receipt.

Main result:

- public digest: **0 bits** residual privacy;
- public-salt digest: **0 bits**;
- finite-keyspace HMAC public tag: **0 bits** under exhaustive key+state enumeration;
- finite-secret-salt public digest: **0 bits** under exhaustive salt+state enumeration;
- mediated panel-independent verification result + Epoch 1: **0.4 bits**.

AH38 deliberately makes **no** information-theoretic claim about a large secret HMAC keyspace. That would require a computational security assumption outside this finite entropy model.

This is a finite observer/key-scope experiment, not a cryptographic hiding theorem.
