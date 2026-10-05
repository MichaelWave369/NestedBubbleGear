# NBG-W1R v0.1.0 — Forced-Keyhole Residue Necessity

**Status:** frozen protocol candidate. **Not a result. No W1R training has been run.**

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
