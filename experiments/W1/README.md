# NBG-W1 v0.1.0 — Bounded Learned Causal Memory

**Status:** frozen run protocol. **Not a result. No training has been run.**

W1 opens the NBG-W learned-memory line with three separated layers:

\[
L = \text{what happened},
\qquad
\Theta = \text{how to remember},
\qquad
M_t = \text{what is allowed to matter now}.
\]

The frozen protocol tests whether learned maps \(E_\theta, K_\theta, R_\phi\) can write a bounded 64-byte active memory that preserves declared causal distinctions better than both the AH11 wrong-distinction control and two capacity-matched learned baselines, while enforcing zero unauthorized answers after revocation.

## Frozen contracts

- int8[32] Keyhole + int8[32] residue;
- 64-byte active payload capacity;
- 67-byte fixed metadata total;
- \(g=0 \Rightarrow r=0\);
- ledger prefix immutability;
- authorized-source-only rematerialization;
- AH11, lineage, revocation, and injected-stale panels;
- two mandatory learned baselines;
- 5512-parameter architecture;
- AdamW, 500 full-batch steps, seeds 0–4;
- \(L_{\text{revoke}}=0\) for every seed.

See [SPEC.md](SPEC.md) for the complete frozen run contract.

## Claim firewall

W1 has not been trained or evaluated. This directory contains no authorized result sentence.

A later pass would establish only a finite learned-memory result on the frozen ensembles. It would not establish parameter unlearning, secure deletion, biological memory, consciousness, or a physical law of nature.

## Execution freeze

The implementation-level semantics are frozen separately in [EXECUTION.md](EXECUTION.md) before the first optimizer step. It fixes canonical inputs, quantization, gate threshold, pair sets, losses, baseline objectives, direct committed-memory metrics, revocation read gating, seed aggregation, and the rule that pull-request CI must not train W1.

The execution freeze does not authorize a result sentence.


## Implementation candidate

The frozen W1 harness lives in `src/w1.py`.

Pull-request CI is intentionally no-training. It checks syntax, parameter arithmetic, AH11 hard-pair construction, lineage splits, int8 commit rules, metadata size and authority gating.

The first optimizer step is exposed only through the manual `W1 Execute Frozen Protocol` workflow. That workflow is guarded to `main`, pins NumPy, fixes BLAS thread counts, reruns static checks, executes all five W1/baseline seed runs, and uploads an **unreviewed** JSON artifact. The workflow does not commit a result sentence.
