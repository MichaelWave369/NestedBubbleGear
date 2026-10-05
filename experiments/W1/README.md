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
