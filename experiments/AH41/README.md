# NBG-AH41 v0.1.0 — Verifier Compromise, Role Fusion, and Quorum Resilience

AH40 separated a logical 2-of-3 verification quorum from a logical 3-of-3 public declassification quorum.

AH41 asks whether those logical thresholds survive contact with **physical ownership**.

Two ownership maps are frozen:

### Independent ownership

- `PRINCIPAL_A` owns logical seat `A`
- `PRINCIPAL_B` owns logical seat `B`
- `PRINCIPAL_C` owns logical seat `C`

### Fused ownership

- `PRINCIPAL_A` owns logical seats `A + B`
- `PRINCIPAL_B` owns logical seat `C`
- `PRINCIPAL_C` owns no verifier seat

Main results:

- logical 2-of-3 verification requires **2 physical principals** under independent ownership, but only **1** under fused ownership;
- logical 3-of-3 declassification requires **3 physical principals** independently, but only **2** when A+B are fused;
- a 2-of-3 declassification negative control falls from physical compromise threshold **2** to **1** under fusion;
- verifier role fusion creates a verification single point of failure;
- strict 3-of-3 declassification availability actually improves under fusion at `p=0.1` from **0.729** to **0.81**, while its physical compromise threshold drops from 3 to 2.

So role fusion can trade independence for availability.

This is a finite authorization/reliability toy model, not threshold cryptography, malicious-party security, or a production key-custody theorem.
