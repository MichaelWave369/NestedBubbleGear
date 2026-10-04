# NBG-AH36 v0.1.0 — Dynamic Upgrade Grants, Revocation, and Privacy Restoration

AH35 treated task-refinement permissions as a static access structure.

AH36 makes one minimal collapse path temporal.

Frozen sequence:

1. begin with every grant at `COMMON_ONLY`;
2. grant `H_L:T`;
3. grant `A_A:T`;
4. grant `A_A:F`;
5. revoke `H_L:T` **without** rematerializing the already-released value;
6. explicitly downgrade/rematerialize the historian lifetime release to `COMMON_ONLY`.

The experiment tracks three different information states:

- **authorized-next-release**: what current permissions would allow on a fresh release;
- **current materialized disclosure**: what is presently held after the last release operation;
- **historical ledger disclosure**: every release value ever emitted so far.

The sequence proves in the frozen model:

\[
\text{permission revoked}
\neq
\text{current disclosure coarsened}
\neq
\text{historical disclosure erased}.
\]

After revocation plus explicit downgrade, current residual privacy returns to **0.4 bits**, but the append-only historical ledger remains at **0 bits** because the earlier richer disclosure already reconstructed `Q_MULTI`.

This is a finite disclosure-history toy model, not a secure-erasure or production revocation theorem.