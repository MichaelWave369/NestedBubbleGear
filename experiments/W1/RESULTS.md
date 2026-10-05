# NBG-W1 v0.1.0 — Reviewed Result

## Status

**Reviewed frozen execution. Verdict: `PASS_W1` under the preregistered W1 acceptance rule.**

This result applies only to the frozen finite toy ensembles and the exact execution described by `SPEC.md` and `EXECUTION.md`.

No W1 rerun was used to select this result.

## Execution provenance

- workflow: `W1 Execute Frozen Protocol`
- workflow run: `37383861670`
- run number: `1`
- event: `workflow_dispatch`
- branch: `main`
- implementation commit: `4dadd60e7fecc61e1c7513c6526dbbcd61b858bd`
- workflow conclusion: `success`
- artifact name: `nbg-w1-unreviewed-execution-37383861670`
- artifact ZIP digest: `sha256:51bdad490c9d256329ca8d076fa6e96834ce7dd82a6a486fa2204c38ca9a3319`
- inner result JSON SHA-256: `f764f5c48aedbaf564feb54e657edb794014e60312ca9e0deba4ad3416250b5e`
- frozen `SPEC.md` SHA-256 recorded by the execution: `35dd8bb5fe30db5192210c6db581c4d70883ca9dd7f37cfc97042fb7ddc1ddf6`
- frozen `EXECUTION.md` SHA-256 recorded by the execution: `71b8dcdb67f56a51970d82574238b6ee4f65c26b585d6baff4a23b338ce6d7e3`
- implementation source SHA-256 recorded by the execution: `697072752d93892d2b0f563ffc1402be32c2c11d28570aa8f0eae0654b28a395`
- Python: `3.13.15`
- NumPy: `2.2.6`
- BLAS thread caps: 1

The artifact ZIP digest and the inner JSON digest are hashes of different objects. They are intentionally recorded separately.

## Frozen acceptance outcome

The execution reported:

[
operatorname{median}(D_s)=0.06666666666666671 > 0.
]

The median-performance seed was seed 3.

For that seed:

[
S_{m sep}=1,
]

and:

[
A_{m route,test}=1.
]

For **every** seed:

[
L_{m revoke}=0,
]

and:

[
A_{m route,reserved}=1.
]

Every seed also satisfied the frozen structural revocation checks:

- stale active memory refused after authority change;
- stale-injection control returned `STALE_RESIDUE_REFUSED`;
- authorized rematerialization aligned the current view;
- prior ledger bytes remained an exact prefix.

Therefore the preregistered acceptance rule evaluates to:

[
oxed{	ext{PASS_W1}}
]

## Seed table

| Seed | W1 task error | Stronger baseline error | (D_s) | (C_{m eq}) | (C_{m hard}) | (S_{m sep}) | test routes | reserved pair | (L_{m revoke}) |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0.360000 | 0.433333 | +0.073333 | 0.720000 | 0 | 1 | 1 | 1 | 0 |
| 1 | 0.406667 | 0.486667 | +0.080000 | 0.813333 | 0 | 1 | 1 | 1 | 0 |
| 2 | 0.473333 | 0.448889 | **-0.024444** | 0.946667 | 0 | 1 | 1 | 1 | 0 |
| 3 | 0.420000 | 0.486667 | +0.066667 | 0.840000 | 0 | 1 | 1 | 1 | 0 |
| 4 | 0.426667 | 0.460000 | +0.033333 | 0.853333 | 0 | 1 | 1 | 1 | 0 |

Seed 2 remains in the record. W1 did not beat the stronger learned baseline on that seed. The frozen criterion was median (D_s>0), not five seed-wise wins.

## Residue outcome

The residue gate did **not** open.

Across W1 Panel A and all reported Panel B splits for every seed:

[
g=0,
]

therefore:

[
r=mathbf 0.
]

Mean used active payload was:

[
B_{m used}=32	ext{ bytes},
]

not 64 bytes.

Thus W1 does **not** establish learned causal residue. The learned Keyhole (z) carried the distinctions required by the frozen pass rule.

This is a result, not a defect to edit away.

## Keyhole nonminimality

The W1 Keyhole separated every frozen hard pair:

[
C_{m hard}=0
]

for all five seeds.

But same-target collapse remained poor:

[
C_{m eq}in[0.72, 0.946666ldots].
]

So the learned Keyhole retained many distinctions that were unnecessary for the frozen (G_partial) task.

W1 therefore does **not** establish a minimal sufficient representation. It establishes only that the learned Keyhole met the frozen distinction and baseline criteria.

## Held-out lineage outcome

All five seeds achieved:

[
A_{m route,test}=1
]

and:

[
A_{m route,reserved}=1.
]

Training-route pair separation was lower, between 0.6 and approximately 0.8667, so the reported held-out gap was negative because test performance exceeded train performance.

The supported claim is that the frozen held-out route and reserved-pair criteria were met. W1 does not establish broad real-world generalization.

## Compression firewall

Compression was forbidden before execution because:

[
B_X^A=8	ext{ bytes},
qquad
B_X^B=5	ext{ bytes},
]

while:

[
B_{m capacity}=64	ext{ bytes}
]

and actual W1 use was 32 bytes.

Therefore:

[
oxed{	ext{NO COMPRESSION CLAIM}}
]

W1 is a bounded learned-representation result, not a storage-compression result.

## Authorized result sentence

> On the frozen W1 toy ensembles, a learned 32-byte Keyhole met the preregistered median-seed separation and held-out route criteria and produced zero unauthorized readouts in the frozen revocation harness; the residue gate remained closed on all reported seeds, one seed lost to the stronger baseline, the representation remained nonminimal, and no compression claim is made.

## What W1 does not establish

W1 does not establish:

- learned causal residue;
- globally minimal sufficient memory;
- five-seed superiority over the learned baselines;
- storage compression;
- parameter unlearning;
- secure deletion;
- real-world privacy guarantees;
- biological memory;
- consciousness;
- a physical law of nature.

## Next question named by the result

W1 shows that a soft collapse objective is insufficient to force the residue channel to earn its role.

A later protocol may test **forced-Keyhole residue necessity**, for example by structurally restricting the Keyhole to the declared coarse observer so that hard-pair separation cannot be carried by (z) alone.

That is a new experiment. W1 itself is not rerun or retroactively changed.
