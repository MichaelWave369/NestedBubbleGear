# NBG-T15 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT15**

- Python invariant checks: **42/42 PASS**
- Python unit tests: **48/48 PASS**
- browser acceptance: **PASS_NBGT15_ADAPTIVE_KEYHOLE_SYNTHESIS**
- Vite production build: **PASS**
- admissible Governance Keyholes: **144**
- static eight-history JOINT synthesis: **PASS**
- adaptive eight-history JOINT synthesis: **PASS**
- restricted POLICY witness: **PASS**
- restricted OUTCOME witness: **REFUSE_UNSEPARABLE**
- full-nine JOINT static synthesis: **REFUSE_UNSEPARABLE**
- full-nine JOINT adaptive synthesis: **REFUSE_UNSEPARABLE**
- deterministic static replay: **PASS**
- deterministic adaptive replay: **PASS**
- query-selection receipt replay: **PASS**
- observed-ledger immutability: **PASS**

## Static minimum observer

For the eight-history JOINT family, the exact minimum fixed observer has:

```text
minimum cardinality = 5
total resource cost = 85
```

Frozen Keyholes:

```text
k6/t6   cost 12
k7/t7   cost 14
k9/t9   cost 18
k9/t10  cost 19
k11/t11 cost 22
```

These five Keyholes jointly separate every one of the 28 unordered history pairs in the eight-history family.

The cost is a frozen resource proxy only:

```text
observer_cost = known_cutoff + valid_time
```

It is not epistemic value.

## Observer-language witness

For:

```text
I_DELAY_ACTIVATE_EMERGENCY_7
I_REMOVE_SUPERSEDE_NORMAL1
```

POLICY observation succeeds with one Keyhole:

```text
k6/t6
minimum cardinality = 1
cost = 12
```

OUTCOME-only observation cannot separate the pair anywhere in the full 144-Keyhole family:

```text
REFUSE_UNSEPARABLE
```

Thus separability is relative to the declared observer language.

## Full-nine refusal

The full nine-history JOINT family remains unseparable because:

```text
I_ALTER_DEACTIVATE_PAYLOAD_ONLY
I_REMOVE_SUPERSEDE_NORMAL1
```

has identical admitted behavior across every frozen Governance Keyhole.

Static synthesis therefore returns:

```text
REFUSE_UNSEPARABLE
```

rather than fabricating an extra distinction.

## Adaptive observer

The eight-history JOINT adaptive tree begins at:

```text
k9/t9
cost = 18
```

Frozen tree statistics:

```text
resolved leaves        8
unresolved leaves      0
worst-case depth       3
query nodes            6
distinct Keyholes      6
```

The six Keyholes used somewhere in the adaptive tree are:

```text
k6/t6
k7/t7
k9/t9
k9/t10
k11/t9
k11/t11
```

The full-nine adaptive tree preserves the T14 equivalence obstruction:

```text
resolved leaves        7
unresolved leaves      1
worst-case depth       3
query nodes            6
distinct Keyholes      6
```

The unresolved leaf contains the known fully equivalent intervention pair rather than forcing a false distinction.

## Frozen semantic hashes

```text
SPEC.md                               ff848dc8a5ad436e13eb14f9ea93fed3ab7941d2d0a0c4dfe74aac1ac840f269
src/nbgt15.py                         fd2b4a70bbf39e278b5584f2944316327e94fdef7ceead77a4d5d884b7349612
tests/test_nbgt15.py                  0fafe447c5d344e89898fc94ddd9214d8c5a6cf70ff56143c9d26ab32ee79b9e
src/adaptiveKeyholeSynthesis.js       395cba700acc4f8527d09c3ece46df2f8764e62f8f387463812f8d85e0f9e950
test_adaptive_keyhole_synthesis.mjs   7957890d5659c79f53657189f3d6d2b2a16fd84764e9a978e61fb3a94485f13a
```

## Generated artifact hashes

```text
result.json                        063489729846349c15002256c6b7009454285a020f8c1c54fa035e9bb4163acc
static_joint_eight.json            a3fa290433bb02c4241598047a822e4e5588e4aaee900c78040b9c61fdc7a26b
static_policy_pair.json            cca9e9ac4a5077525bcbd47715d1119895ca79233ed494e17f855013fff48f95
static_outcome_pair_refusal.json   b09dda366d83798c7ab2c62606476c43e7e3b6b5eb2d810ee1a09ee4fd0c06d9
static_full9_refusal.json          d3927913697bc770a3028e70d8007d12d96912954a4c2def3c6573a54b0806db
adaptive_joint_eight.json          4d96455bac23b002da6a12a0da39932eb546b442a4129ee7020e97f802872690
adaptive_full9.json                7cd8399ce27045a5525aa6dcf1f639990e398516a40a099635a707f7c36c43cb
observer_comparison.json           0ba57b21a7be0e9a483dc111ff62c4c28359de9af281c0800ba66c32f93446db
```

## Claim boundary

NBG-T15 synthesizes sufficient observers only relative to the frozen intervention family, channel, and Governance Keyhole language.

A minimal observer is not declared scientifically optimal, and `REFUSE_UNSEPARABLE` does not claim identity outside the declared observer language.
