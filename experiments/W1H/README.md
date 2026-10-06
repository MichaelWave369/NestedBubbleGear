# NBG-W1H v0.1.0 — Gate Retention Without Keep Pressure

**Status:** protocol freeze candidate. **Not a result. No W1H training has been run.**

Parent reviewed result:

~~~text
NBG-W1G v0.1.0 = FAIL_W1G_GATE_ALIGNMENT
~~~

W1G established two facts inside its frozen toy setup:

1. the FORCED_OPEN residue + actual int8 commit path could preserve the preregistered hidden distinctions;
2. the learned COMMIT_STE gate closed on every evaluated row across all five seeds.

W1H isolates the next question with one scientific change:

~~~text
remove L_keep
~~~

Everything else remains fixed at the protocol level.

## Arms

### FORCED_OPEN

Same positive-control role as W1G.

Purpose: verify representation + actual int8 commit still works in the new frozen execution.

### NO_KEEP_STE

Same W1G commit-aligned hard gate, quantizer, architecture, task losses, optimizer and seeds.

Only difference:

~~~text
L_keep is absent
~~~

Purpose: test whether the hard learned gate can retain useful residue without explicit keep pressure pushing gates closed.

### RB_NO_KEEP_STE

Same no-keep learned architecture, but receives only coarse-blind inputs.

It must not recover the hidden hard/reserved distinctions.

### K0

Zero-residue structural negative control.

## What a pass would mean

A pass would support only:

> Removing W1G's keep-cost term was sufficient, under the frozen W1H toy setup, for the commit-aligned learned hard gate to retain the preregistered hidden distinctions.

That would **not** be a sparsity result.

It would not show efficient memory, compression, optimal gating, or general architectural superiority.

## What a failure would mean

If FORCED_OPEN still passes but NO_KEEP_STE fails, the failure can no longer be attributed solely to W1G's explicit keep-cost pressure.

That would point toward a deeper issue in the frozen hard-gate credit path or task/gate interaction and would name a new experiment rather than justify tuning W1H after the fact.

## Execution boundary

No optimizer step is authorized by this protocol PR.

W1H requires, in order:

1. protocol merge;
2. separate execution freeze;
3. separate implementation PR merged green;
4. one manual main-only frozen execution.

The first valid execution is retained even if the hypothesis fails.

See [SPEC.md](SPEC.md) for the complete frozen scientific contract.


## Execution freeze

The implementation-level contract is frozen in [EXECUTION.md](EXECUTION.md).

It fixes:

- Python/NumPy/CPU determinism;
- canonical row and pair order;
- exact Keyhole and source bytes;
- exact E/R/G parameter layouts;
- fresh seed initialization identity across arms;
- actual int8 quantizer forward and strict STE backward;
- inclusive hard gate threshold and sigmoid gate STE;
- exact residue/gate gradient decomposition;
- **absence of any keep-loss or replacement gate regularizer**;
- exact AdamW settings and 500-step timing;
- post-step-500 no-gradient scientific evaluation;
- byte-level forward/commit identity audits;
- K0 and RB_NO_KEEP_STE control semantics;
- revocation and ledger-prefix semantics;
- structural/scientific result precedence;
- artifact provenance and no-rerun rule.

No optimizer step is authorized until this execution freeze and a separate implementation PR are merged to `main`.
