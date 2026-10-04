# AH37 Candidate — Epoch-Scoped Disclosure and Forward Privacy Boundaries

AH36 shows that explicit downgrade can restore privacy for a fresh observer while an append-only historical observer remains fully informed.

AH37 should formalize **epochs** rather than pretending revocation can retroactively erase disclosure.

Candidate design:

1. epoch 0 permits the richer collapse-path releases;
2. revoke/downgrade and close epoch 0;
3. start epoch 1 with coarsened releases only;
4. compare:
   - legacy observer with epoch-0 history;
   - fresh epoch-1 observer;
   - observer receiving only a commitment/hash to the sealed prior epoch;
5. test whether post-rotation releases preserve positive residual privacy for new observers without claiming retroactive secrecy for old observers.

Core distinction:

\[
\text{forward privacy boundary}
\neq
\text{historical erasure}.
\]

This would give the Reality Ledger an explicit non-retroactive revocation model and reconnect AH36 to the commitment-leakage results from AH14/AH15.