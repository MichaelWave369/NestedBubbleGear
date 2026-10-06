# NBG-W1G v0.1.0 — Gate / Commit Alignment

**Status:** protocol freeze candidate. **Not a result. No W1G training has been run.**

W1G is the experiment named by the reviewed W1R negative result.

W1R successfully removed the learned-Keyhole bypass and preserved clean controls/revocation, but committed residue failed even when continuous training residue sometimes separated.

W1G isolates that boundary.

## Two frozen arms

### FORCED_OPEN

Purpose: test residue representation + actual int8 commit without learned gating.

- same forced coarse Keyhole as W1R;
- same E/R residue encoder;
- gate fixed open during FULL_STATUS task evaluation;
- task loss runs on the forward value of the actual int8 quantizer;
- no keep penalty.

If this arm fails, the bottleneck is not specifically the learned gate.

### COMMIT_STE

Purpose: test a learned gate whose training forward value is the committed memory.

- hard forward gate: `g = 1[p >= 0.5]`;
- gate backward surrogate: sigmoid derivative;
- quantizer forward: actual int8 commit value;
- quantizer backward: straight-through derivative inside clip range;
- task losses operate on the hard-gated quantized residue;
- keep cost charges the hard forward keep decision.

This removes the W1R soft-amplitude training path.

## Controls

- K0: zero residue, must fail.
- RB_STE: same COMMIT_STE architecture but sees only the coarse observer, must fail.

Any control leak or Keyhole leak voids the execution.

## Frozen result classes

~~~text
VOID_W1G_KEYHOLE_LEAK
VOID_W1G_CONTROL_FAILURE
VOID_W1G_CONTRACT_DRIFT

FAIL_W1G_REVOCATION
FAIL_W1G_REPRESENTATION_COMMIT
FAIL_W1G_GATE_ALIGNMENT
FAIL_W1G_GENERALIZATION
PASS_W1G_COMMIT_ALIGNED_RESIDUE
~~~

## Boundaries

No compression claim is possible.

Epistemic provenance remains outside learner inputs.

A reviewed W1G result may later be wrapped in live NBG memory as `SIMULATED`, but the execution artifact remains immutable.

See [SPEC.md](SPEC.md) for the full frozen scientific contract.


## Execution freeze

The implementation-level contract is frozen in [EXECUTION.md](EXECUTION.md).

It fixes:

- exact row and pair order;
- deterministic Keyhole bytes;
- source serialization;
- arm-by-arm parameter shapes and initialization identity;
- inclusive hard gate threshold;
- exact quantizer and gate STE derivatives;
- hard-forward keep cost;
- final post-step-500 evaluation timing;
- forward/commit byte-identity audit;
- model-hash ordering;
- metadata/revocation behavior;
- K0 and RB_STE control semantics;
- diagnostic raw/gate statistics;
- result-class precedence;
- artifact provenance;
- no-rerun rule;
- epistemic provenance separation.

No optimizer step is authorized until this execution freeze and a separate implementation PR are merged to `main`.
