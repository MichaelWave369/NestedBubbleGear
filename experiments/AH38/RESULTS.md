# AH38 v0.1.0 Qualification Results

## Verdict

**PASS_AH38_QUALIFIED**

- Frozen acceptance checks: **24/24**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Observer comparison

| Observer / artifact | Residual privacy (bits) | Descriptor classes |
|---|---:|---:|
| FINITE_KEYSPACE_HMAC_TAG_E1 | 0.000000000000000 | 9 |
| FINITE_SECRET_SALT_DIGEST_E1 | 0.000000000000000 | 9 |
| FRESH_E1 | 0.400000000000000 | 7 |
| KEY_AUTHORIZED_VERIFIER | 0.000000000000000 | 9 |
| MEDIATED_VERIFIED_E1 | 0.400000000000000 | 7 |
| PUBLIC_DIGEST_E1 | 0.000000000000000 | 9 |
| PUBLIC_SALT_DIGEST_E1 | 0.000000000000000 | 9 |

## Finite HMAC enumeration control

- candidate keys: **8**
- distinct observed actual-key tags: **9**
- distinct enumerated key×old-state tags: **72**
- every observed tag identifies one target class in the frozen candidate space: **True**

## Finite secret-salt enumeration control

- candidate salts: **8**
- distinct observed actual-salt digests: **9**
- distinct enumerated salt×old-state digests: **72**
- every observed digest identifies one target class: **True**

## Claim refusal

`NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE`

AH38 does not fabricate an information-theoretic hiding result for a high-entropy secret HMAC key. That would require a computational security model.

## Main result

`verification authority != evidence disclosure authority`

`public verifier artifact design is part of the privacy boundary`

`tiny enumerable secret spaces are not hiding mechanisms`
