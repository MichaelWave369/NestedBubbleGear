# NBG-T14 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT14**

- Python invariant checks: **34/34 PASS**
- Python unit tests: **38/38 PASS**
- browser acceptance: **PASS_NBGT14_INTERVENTION_EQUIVALENCE**
- Vite production build: **PASS**
- intervention count: **9**
- unordered pair receipts: **36**
- target-equivalent pairs: **12**
- target-equivalent pairs with hidden temporal residue: **11**
- fully temporally equivalent target-pairs: **1**
- pair tamper detection: **PASS**
- deterministic equivalence-class replay: **PASS**
- deterministic pair replay: **PASS**

## Primary Governance Residue witness

At the focal `k10/t10` Keyhole:

```text
I_REMOVE_DEACTIVATE
I_DELAY_DEACTIVATE_11

both:
EMERGENCY@1.0 -> REJECTED
```

The pair is nevertheless temporally distinct.

Its first separating Governance Keyhole is:

```text
known k11 / valid t11

I_DELAY_DEACTIVATE_11
  NORMAL@2.0 -> ABSTAIN_CONFLICT

I_REMOVE_DEACTIVATE
  EMERGENCY@1.0 -> REJECTED
```

Therefore a singleton observer family containing k11/t11 separates the pair.

## Independent Governance Residue witness

```text
I_REMOVE_REGISTER_NORMAL2
I_DELAY_REGISTER_NORMAL2_11
```

The pair is focal-equivalent at k10/t10 and temporally distinct under the wider Governance Keyhole family.

## Full-equivalence negative control

```text
I_ALTER_DEACTIVATE_PAYLOAD_ONLY
I_REMOVE_SUPERSEDE_NORMAL1
```

The pair has:

```text
different branch-ledger heads
same focal signature
same policy/outcome behavior across all 144 frozen Keyholes
Governance Residue count = 0
minimal separator cardinality = 0
```

Thus ledger inequality alone does not establish behavioral inequality.

## Frozen semantic hashes

```text
SPEC.md                              6127bf9f79223d7f655bf6bb72632c6d94c35e097ae69b3517234779628ccfff
src/nbgt14.py                        da0ca012cfd748dea8ca814cd1b0489b107bfcfab62420be8a3e89762e1f57a9
tests/test_nbgt14.py                 f8620056f735386ee6f75b9f064792b8cfe3df05bebfdcdcbf0838b038791ef7
src/interventionEquivalence.js       b5c323e354fda7bfc83bf89aefa461cb40f5135c82c55cc62d3c8c17d71ad877
test_intervention_equivalence.mjs    405350a8c4ed8074c021198645dda69ee57aeaab47e2a9ae3970a20561b7432a
```

## Generated artifact hashes

```text
result.json                  c3623dfa3b7ecfaa20213fc62fd9f986f67430e9fb9427314cf7929e71392f98
equivalence_atlas.json       b8e602882234863727bfeffae4d816764c12ba24d504a8bc8b511d7e7a202575
deactivation_pair.json       2d666d5e625936f3f5f829fb06d84fe73659dd75abb988f25481d1e658abfb98
normal2_pair.json            49229de6aee3d8b2f712a7eb6339e98012b1519432acbcedc24912d646338aaa
ledger_control_pair.json     70d80b3639d9d4ab741b93a9f39c95683ea3199e23b31fe3a40af74298c5a7e4
signature_table.json         fe158e2a7183b5515fe2c67c297d1f6901eab7f37e4957ba28e44ec68547489d
```

## Claim boundary

Equivalence is defined only relative to the frozen Governance Keyhole family.

A pair that is equal through one Keyhole is not promoted into a claim of causal, historical, or physical identity.
