# NBG-W1G v0.1.0 — Gate / Commit Alignment

**Status:** reviewed first frozen execution. **Verdict: `FAIL_W1G_GATE_ALIGNMENT`.**

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


## Implementation candidate

The W1G harness is implemented in `src/w1g.py`.

Pull-request CI is intentionally **no-training**. It verifies:

- exact 4,416 / 4,456 parameter counts;
- absence of learned `K.*` parameters;
- byte-identical shared E/R initialization across FORCED_OPEN, COMMIT_STE and RB_STE;
- byte-identical G initialization between COMMIT_STE and RB_STE;
- ties-to-even int8 quantization and strict STE clip bounds;
- inclusive hard-gate threshold at (p=0.5);
- byte-identical coarse Keyholes;
- frozen AH11 and lineage splits;
- K0 structural failure;
- RB_STE coarse-source identity;
- stale-authority refusal;
- handcrafted forward/commit identity;
- refusal to execute training before post-merge authorization.

The first optimizer step is exposed only through the manual `W1G Execute Frozen Protocol` workflow.

That workflow is `workflow_dispatch` only, refuses non-`main` refs, pins NumPy, fixes BLAS thread counts, reruns static checks, executes all five seeds for FORCED_OPEN / COMMIT_STE / RB_STE, and uploads an **unreviewed** JSON artifact.

The first valid frozen execution has now been reviewed and locked in [RESULTS.md](RESULTS.md).

The reviewed result is `FAIL_W1G_GATE_ALIGNMENT`: FORCED_OPEN preserved the preregistered hard and held-out distinctions through the actual int8 commit path, while COMMIT_STE closed every learned gate across all five seeds. Controls, revocation and forward/commit identity audits passed. No compression claim is made.
