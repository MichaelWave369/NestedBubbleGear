# NBG-W1R v0.1.0 — Forced-Keyhole Residue Necessity

**Status:** reviewed first execution: `FAIL_W1R_NO_RESIDUE`.

W1R is the experiment named by the reviewed W1 result.

W1 passed its preregistered criterion, but the residue gate remained closed and the learned Keyhole carried the required distinctions while retaining substantial unnecessary structure.

W1R closes that loophole structurally.

## Core change

The Keyhole is no longer learned in this rung.

Panel A:

[
z=operatorname{pad}_{32}(operatorname{rowmajor}(P_2)).
]

Panel B:

[
z=operatorname{pad}_{32}([mathrm{READY}]).
]

Therefore coarse-equivalent states have byte-identical Keyholes by construction.

The only trainable memory path for hidden distinctions is:

[
X^{auth}ightarrow E_	hetaightarrow hightarrow R_phi(h,q,a)ightarrow r,g.
]

## What W1R tests

- whether bounded pre-collapse residue separates AH11 histories that share (P_2) but differ in (G_partial);
- whether learned residue generalizes to the frozen held-out route split and reserved `NORTH`/`SOUTH` witness;
- whether residue is actually used rather than bypassed;
- whether the same revocation contract still produces zero unauthorized readouts;
- whether Keyhole-only and coarse-blind residue controls remain unable to separate the hidden distinctions.

## What W1R does not test

W1R does not test compression, probe learning, online governed updates, machine unlearning, biological memory, consciousness, or fundamental physics.

See [SPEC.md](SPEC.md) for the complete frozen scientific contract.

No result sentence is authorized by this directory until a separately frozen execution contract is merged and the first execution is reviewed.


## Execution freeze

The implementation-level contract is frozen in [EXECUTION.md](EXECUTION.md).

It fixes:

- canonical AH11 and lineage row order;
- exact deterministic Keyhole bytes;
- exact residue-source serialization;
- query/authority enum order;
- the 4,456-parameter trainable layout and serialization order;
- Xavier/PCG64 initialization;
- gate threshold and int8 commit;
- Panel-A and Panel-B pair ordering;
- exact W1R loss averaging;
- K0 and RB control semantics;
- committed-residue metrics;
- median-seed selection;
- revocation execution;
- VOID / FAIL / PASS precedence;
- artifact provenance;
- the no-rerun rule;
- separation from the live epistemic provenance wrapper.

No optimizer step is authorized by this repository until the execution freeze and a separate implementation PR are both merged to `main`.


## Implementation candidate

The W1R harness is implemented in `src/w1r.py`.

Pull-request CI is intentionally **no-training**. It verifies:

- Python syntax;
- exact 4,456 trainable parameters;
- absence of learned `K.*` parameters;
- AH11 row/order and hard-pair construction;
- byte-identical Keyholes for coarse-equivalent states;
- fixed route splits and READY Keyhole;
- K0 structural failure to separate hidden pairs;
- RB source identity on frozen hard pairs;
- int8/metadata contracts;
- stale-authority read refusal;
- exclusion of epistemic provenance fields from learner inputs;
- refusal to execute training before post-merge authorization.

The first optimizer step is exposed only through the manual `W1R Execute Frozen Protocol` workflow. That workflow is `workflow_dispatch` only, refuses non-`main` refs, pins NumPy, fixes BLAS thread counts, reruns static checks, executes all five W1R and RB seed runs, and uploads an **unreviewed** JSON artifact.

No result sentence is committed by the implementation PR or execution workflow.


## Reviewed first execution

The first valid frozen execution is reviewed in [RESULTS.md](RESULTS.md).

Verdict:

`FAIL_W1R_NO_RESIDUE`

Important facts retained:

- the structurally coarse Keyhole passed its no-leak checks;
- K0 and RB controls failed to separate hidden distinctions as required;
- every Panel-A committed residue gate was closed;
- committed residue separated 0/18 AH11 hard pairs;
- every seed failed the reserved `NORTH`/`SOUTH` residue criterion;
- every seed had `L_revoke = 0`;
- some continuous training residues showed separation before the frozen gate/commit stage discarded them;
- no compression claim is authorized;
- W1R is not rerun to repair the failure.

The reviewed result is wrapped for live NBG memory in [results/live_memory_wrapper.json](results/live_memory_wrapper.json) with:

`origin=SIMULATED`

`reasoningUsable=true`

`actionAuthorized=false`

The wrapper references the reviewed receipts and artifact digests without rewriting the raw execution artifact.
