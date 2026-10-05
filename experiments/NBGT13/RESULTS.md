# NBG-T13 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT13**

- Python invariant checks: **36/36 PASS**
- Python unit tests: **38/38 PASS**
- browser acceptance: **PASS_NBGT13_GOVERNANCE_SENSITIVITY_ATLAS**
- Vite production build: **PASS**
- observed-ledger immutability: **PASS**
- intervention receipt validation: **PASS**
- target/temporal classification separation: **PASS**
- temporal outcome-leverage witness: **PASS**
- temporal policy-only leverage witness: **PASS**
- ledger-only negative controls: **PASS**
- minimal intervention-set enumeration: **PASS**
- deterministic atlas replay: **PASS**
- deterministic minimal-set replay: **PASS**

## Frozen target witness

```text
target query       known k10 / valid t10
observed policy    NORMAL@2.0
observed outcome   ABSTAIN_CONFLICT
atlas rows         9
```

Four singleton interventions change the target outcome to `REJECTED`:

```text
I_DELAY_DEACTIVATE_11
I_DELAY_REGISTER_NORMAL2_11
I_REMOVE_DEACTIVATE
I_REMOVE_REGISTER_NORMAL2
```

Therefore:

```text
minimal cardinality = 1
minimal set count   = 4
```

## Temporal controls

```text
I_ALTER_DEACTIVATE_VALID10
  target class   TARGET_INERT
  temporal class TEMPORAL_OUTCOME_LEVERAGE
  first outcome divergence k9/t9

I_DELAY_ACTIVATE_EMERGENCY_7
  target class   TARGET_INERT
  temporal class TEMPORAL_POLICY_LEVERAGE
  no outcome divergence in frozen window

I_ALTER_DEACTIVATE_PAYLOAD_ONLY
  target class   TARGET_INERT
  temporal class LEDGER_ONLY_INERT
  branch ledger hash changes
  governance behavior unchanged

I_REMOVE_SUPERSEDE_NORMAL1
  target class   TARGET_INERT
  temporal class LEDGER_ONLY_INERT
```

## Frozen semantic hashes

```text
SPEC.md                            98d55908f796307e74cab58c65981c06ca11f215170a2f628bc8674d04648732
src/nbgt13.py                      eac12ea279049ebb9f6053094c4ed44c68a8d0d67ee4bf10977f13b1c00950da
tests/test_nbgt13.py               3099fb7e888beecbcfc7600b9079ff6bba7ac5df8653bf40c8b664c5bba75b19
src/governanceSensitivity.js       ab3d6c290d939a764d29bf8e91227b2cbef22310e4b70a72a1f95120ff8a1a8a
test_governance_sensitivity.mjs    c35ee408d28a5500736758c8997a9f2109dcd3964d4a2795b39c486f2ecc034e
```

## Generated artifact hashes

```text
result.json                     9471db3949e4b9e477418f8b1fc1eb79dfc282231d1648ac213e9221badc62b3
sensitivity_atlas.json          505075bab3f11c2f4fc4811df59c8d4fe75fc26bb37cd8b7af0a6cddcb08e4a1
intervention_receipts.json      fbdc477de37ba37d9649ccb0000dcd5e238641b967899c85870679c42102deab
minimal_intervention_sets.json  490bb1d662dd9b9ad4fb6a7211822af3dc1d57d386e18a280871ea4d5c17c8fe
payload_negative_control.json   dda17e80b8b88c24f41d69f2b7d7881ead69aa88aef93a2bd8d6ccc46229726f
alter_valid10_row.json          3fa82690f297ac4e11bf761845a6e892873ea9de8cb3bb072ad3fcb68c805bf3
```

## Claim boundary

NBG-T13 measures sensitivity inside the frozen model and explicit mutation grammar.

An outcome-changing intervention is not promoted into a claim that the intervention is "the true cause" of any historical or external outcome.
