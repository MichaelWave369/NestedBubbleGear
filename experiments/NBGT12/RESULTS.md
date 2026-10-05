# NBG-T12 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT12**

- Python invariant checks: **32/32 PASS**
- Python unit tests: **34/34 PASS**
- browser acceptance: **PASS_NBGT12_COUNTERFACTUAL_GOVERNANCE**
- Vite production build: **PASS**
- observed-ledger immutability: **PASS**
- fork receipt tamper detection: **PASS**
- remove / delay / alter branch controls: **PASS**
- branch hash validation: **PASS**
- branch-specific receipt replay: **PASS**
- first-divergence identification: **PASS**
- counterfactual bundle validation: **PASS**
- portable round trip exact: **PASS**
- deterministic branch replay: **PASS**
- deterministic divergence replay: **PASS**

## Frozen witness

```text
OBSERVED @ k10/t10
  NORMAL@2.0 -> ABSTAIN_CONFLICT

REMOVE DEACTIVATION @ k10/t10
  EMERGENCY@1.0 -> REJECTED

DELAY DEACTIVATION @ k10/t10
  EMERGENCY@1.0 -> REJECTED

ALTER DEACTIVATION @ k9/t9
  EMERGENCY@1.0 -> REJECTED

altered event        EV_DEACTIVATE_EMERGENCY
first divergence     k9/t9
observed events      6
remove-branch events 5
```

All branches retain the explicit marker:

```text
COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY
```

## Frozen semantic hashes

```text
SPEC.md                                7cd92f20f7d33e8ac6b72caa39edbe15a4fa606de42cd08747f8dc4a4bdc7cc5
src/nbgt12.py                          72f9fe46004f6f2f56da2a44aa6f47e8e00ff95a7969331a171e94284e720450
tests/test_nbgt12.py                   db012ed5f16589773ebc8c07c60f6d2bf22f2b3bd7276c3dabc6d43624b67f6d
src/counterfactualGovernance.js        84a7184f6615a570deb9efa2c9166041bfd7e77a39035e35b02175d29bcf449b
test_counterfactual_governance.mjs     c317395b1dcd8e02ed885bd71c5c82eb15bb8cf3177680d93dd6f0ae2bdd0a10
```

## Generated artifact hashes

```text
result.json                  74d8125a277a0db6b040d0811f39996512ce168b6d86ec601f6cb44fc02402a8
observed_policy_ledger.json  62e0118590b40e26c07dcb9f64dc1930f5716281b5456ee16b83e45f5a05d170
remove_fork_receipt.json     ac7e01236063f7e89c9ae0c5ad03e51a80c3b0a38c759a92b305b48d15cade7e
remove_branch.json           0646d9fb753dd85d9bae7124e52012f94bf0a607bda76a2697294dd055b1afe9
remove_divergence.json       7ee351e5e78a57ea851563213bfa381291d160656b3660e9b9099f03d71a00e1
counterfactual_bundle.json   16735447f6aef61aac92d927661dca22dc011a4e5a65dc99e8a4ca48879c2b58
observed_k10_receipt.json    9d708007b8f2a5a3bf505a73eb43379c63138acfcb4cb1bfc5a9ad996d1e443c
remove_k10_receipt.json      a875cde5cd3de6f03131a24c00404a6b931a1bf20111c56844fed1ae38a9a882
```

## Claim boundary

The counterfactual branch demonstrates model sensitivity to an explicit governance intervention. It is not an assertion about what external history would actually have done.
