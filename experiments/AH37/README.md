# NBG-AH37 v0.1.0 — Epoch-Scoped Disclosure and Forward Privacy Boundaries

AH36 showed that revocation and explicit downgrade can restore privacy for a fresh observer while an append-only historical observer remains fully informed.

AH37 formalizes that asymmetry with disclosure epochs.

Epoch 0 contains a rich disclosure that exactly reconstructs the frozen `Q_MULTI` target.

After revocation/downgrade, Epoch 1 exposes only the coarser current release.

Three observer classes are compared:

1. **fresh E1 observer** — receives only Epoch 1;
2. **legacy observer** — retains Epoch 0 plus Epoch 1;
3. **public-commitment observer** — does not receive Epoch 0 content, but receives a deterministic public SHA-256 digest of the Epoch 0 rich snapshot.

A fourth control receives only panel-independent epoch-close metadata.

Main result:

- fresh E1 observer: **0.4 bits** residual privacy;
- legacy observer: **0 bits**;
- public-commitment observer: **0 bits**, because the tiny frozen domain permits exact digest enumeration;
- metadata-only seal observer: **0.4 bits**.

Therefore:

\[
\text{forward privacy boundary}
\neq
\text{historical erasure}
\]

and:

\[
\text{public commitment}
\neq
\text{non-disclosure}
\]

in this finite enumerable domain.

This is not a cryptographic hiding theorem.
