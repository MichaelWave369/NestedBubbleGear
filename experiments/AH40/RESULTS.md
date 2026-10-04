# AH40 v0.1.0 Qualification Results

## Verdict

**PASS_AH40_QUALIFIED**

- Frozen acceptance checks: **27/27**
- Unit tests: **15/15 PASS**
- Frozen hashes unchanged: **True**
- Replay exact: **True**

## Quorum comparison

- verifier principals: **3**
- verifier coalitions exhaustively enumerated: **8**
- `VERIFY_ONLY` authorized coalitions: **4/8**
- `DECLASSIFY_EPOCH0` authorized coalitions: **1/8**

Minimal verification coalitions:
- `{VERIFIER_A, VERIFIER_B}`
- `{VERIFIER_A, VERIFIER_C}`
- `{VERIFIER_B, VERIFIER_C}`

Minimal declassification coalition:

- `{VERIFIER_A, VERIFIER_B, VERIFIER_C}`

## Public observer

- fresh Epoch-1 residual privacy: **0.400000000000000 bits**
- every authorized `VERIFY_ONLY` coalition: **0.4 bits**
- full 3-of-3 coalition using `VERIFY_ONLY`: **0.4 bits**
- full 3-of-3 coalition using `DECLASSIFY_EPOCH0`: **0 bits**
- forbidden debug verification with public old authenticator: **0.000000000000000 bits**

## Main result

`verification quorum != public evidence-release quorum`

`coalition capability != action exercised != output disclosed`

`mediated verification preserves the forward boundary only if the public output schema remains coarsened`

AH40 is a finite authorization/output-schema result, not threshold cryptography, secret sharing, or MPC.
