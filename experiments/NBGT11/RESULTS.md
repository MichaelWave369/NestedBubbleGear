# NBG-T11 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT11**

- Python invariant checks: **28/28 PASS**
- Python unit tests: **30/30 PASS**
- browser Governance Keyhole acceptance: **PASS_NBGT11_GOVERNANCE_KEYHOLES**
- Vite production build: **PASS**
- bitemporal policy visibility: **PASS**
- no-hindsight governance replay: **PASS**
- supersession replay: **PASS**
- emergency activation/deactivation: **PASS**
- historical emergency replay: **PASS**
- policy-version pinning: **PASS**
- earlier receipt immutability: **PASS**
- governance-bundle validation: **PASS**
- receipt replay exact: **PASS**
- deterministic Keyhole replay: **PASS**

## Frozen witness

```text
known k5 / valid t5    NORMAL@1.0     -> REJECTED
known k7 / valid t7    EMERGENCY@1.0  -> REJECTED
known k8 / valid t7    EMERGENCY@1.0  -> REJECTED
known k10 / valid t10  NORMAL@2.0     -> ABSTAIN_CONFLICT
known k10 / valid t7   EMERGENCY@1.0  -> REJECTED
```

The frozen evidence/reviewer input is held at:

```text
evidence_known_cutoff = 10
```

so the experiment isolates policy-history changes from evidence-visibility changes.

## Frozen semantic hashes

```text
SPEC.md                          540b4a9f4d1863830a458428fb6f777466d72ca3a38f2086531e403e71e82f21
src/nbgt11.py                    b45fdb75a3dc4ee8f1d299de3f65208f118ced0a6abb3fc582924912cd6959b6
tests/test_nbgt11.py             b05fb31961af2f9878c7cef0ca8fc6bd9deef12b8bbaf2e9f5b751e8cad2b654
src/governanceKeyholes.js        2fc72813e716c11e202a55a449ef2e89739dcf2e29cab81657a21ce922e2f24d
test_governance_keyholes.mjs     29f950f17b5bd42344b75c21d989c74568a61165e30cc43fb11794f40e7a8d7c
```

## Generated artifact hashes

```text
result.json                 123f1e9ac620908f61e9f8debfacc88ef7773f19c1f715c36f65959d0048498d
policy_records.json         277e3fe6f803dba4b303d5d4a664782bd1ae6aed00e7b7f93eddd4899152332d
policy_ledger.json          62e0118590b40e26c07dcb9f64dc1930f5716281b5456ee16b83e45f5a05d170
governance_bundle.json      44a89719471f63de60a704150d1fa745a2abb48d0e4b9b29974c10bcd51e4ef7
keyhole_comparison.json     f9686fe3647b7296ec8f718ae1fa78b12285dfe8c10891a0305b3857d2c1adc9
k10_resolution_receipt.json 9d708007b8f2a5a3bf505a73eb43379c63138acfcb4cb1bfc5a9ad996d1e443c
```

## Claim boundary

These are synthetic governance histories. A selected policy and its outcome are replayable governance facts about the fixture, not objective truth about any external claim.
