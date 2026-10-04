# AH39 Candidate — Delayed Key Disclosure and Retroactive Receipt Declassification

AH38 separates verification authority from ordinary evidence disclosure and refuses to pretend that a large secret-key HMAC claim is information-theoretic.

AH39 should make key authority temporal.

Candidate sequence:

1. Epoch 1 ordinary observer receives:
   - public HMAC tag from Epoch 0;
   - no key;
   - current Epoch-1 release;
2. verifier keeps key authority;
3. later disclose the verification key;
4. compare observers who retained the old public tag versus observers who never received the tag;
5. test whether key disclosure retroactively declassifies the old receipt.

Important branches:

- `tag retained + key later disclosed`
- `tag withheld + key later disclosed`
- `mediated VERIFIED receipt + key later disclosed`

Core distinction:

\[
\text{key revocation/rotation}
\neq
\text{retroactive hiding of already-public authenticators}.
\]

This would extend AH36/AH37 from evidence history to **key-authority history**.
