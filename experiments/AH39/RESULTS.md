# AH39 v0.1.0 Qualification Results

## Verdict

**PASS_AH39_QUALIFIED**

- Frozen acceptance checks: **26/26**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Observer history comparison

| State | Residual privacy (bits) | Descriptor classes | Status |
|---|---:|---:|---|
| FRESH_E1 | 0.400000000000000 | 7 |  |
| P0_TAG_PUBLIC_BEFORE_KEY | 0.000000000000000 | 9 | ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE |
| P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG | 0.000000000000000 | 9 | ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE |
| W0_TAG_WITHHELD_BEFORE_KEY | 0.400000000000000 | 7 | AUTHENTICATOR_WITHHELD |
| W1_KEY_DISCLOSED_TAG_STILL_WITHHELD | 0.400000000000000 | 7 | KEY_DISCLOSED_BUT_AUTHENTICATOR_WITHHELD |
| W2_TAG_RELEASED_AFTER_KEY | 0.000000000000000 | 9 | RETROACTIVE_AUTHENTICATOR_DECLASSIFICATION |
| P2_KEY_REVOKED_HISTORY_PERSISTS | 0.000000000000000 | 9 | KEY_REVOKED_BUT_DISCLOSURE_HISTORY_PERSISTS |

## Main result

`key disclosure does not recreate an authenticator that never crossed the boundary`

`already-public authenticators remain part of disclosure history across later key-policy changes`

`effective disclosure must account for artifact history + key-authority history`

## Finite keyspace control

- candidate keys: **8**
- enumerated key×old-state tags: **72**
- every observed tag identifies one target class: **True**

## Claim refusal

`NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE`

AH39 is a finite disclosure-history/key-authority result, not a cryptographic forward-secrecy or high-entropy-HMAC theorem.
