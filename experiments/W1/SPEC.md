# NBG-W1 v0.1.0 — Bounded Learned Causal Memory

Status: run protocol. Not a result. No training has been run. No result language is authorized.

Parents: AH11 v0.1.0 (`PASS_AH11`, 34/34), AH36 v0.1.0 (`PASS_AH36_QUALIFIED`, 31/31), NBG-T1 canonical witness. Probe policy \(\pi_\psi\) is NBG-W2. Governed weight updates are NBG-W3.

This file freezes the blanks that were still open: serialization, metadata total, Panel B partition, architecture, optimizer, seeds, step cap, and both baselines.

## 1. Purpose

W1 tests whether learned maps can keep a declared causal distinction inside a frozen byte budget, and whether active memory can be revoked without rewriting prior ledger bytes.

> On frozen ensembles, maps \(\Theta = \{E_\theta, K_\theta, R_\phi\}\) may write a bounded active memory \(M_t\) that preserves declared future distinctions better than \(P_2\) and better than the stronger of two capacity-matched baselines, and that refuses to answer after authority changes. Rematerialization may append to \(L\). It may not rewrite prior bytes.

The word compression is allowed only on a panel where \(B_{\text{capacity}} < B_X\).

## 2. Three layers

\[
L = \text{what happened}
\]
\[
\Theta = \text{how to remember}
\]
\[
M_t = \text{what is allowed to matter now}
\]

| Layer | Contains | Property |
|---|---|---|
| Ledger \(L\) | events, hashes, authority, valid time, known time | exact, append-only |
| Weights \(\Theta = \{E_\theta, K_\theta, R_\phi\}\) | learned maps | approximate, generalizing |
| Active memory \(M_t\) | \(z_t, r_t, g_t\), metadata | bounded, replaceable |

\(\pi_\psi\) is not in \(\Theta\). The probe set is frozen. The plant executes \(\rho(w)\). The learner does not.

## 3. Data flow

```text
authorized source X_t^auth
        |
        v
   E_theta(X) = h          h is ephemeral
        |
        +---- K_theta(h) ---------------> z     int8[32]
        |
        +---- R_phi(h, q, a_semantic) --> r, g
        |
        v
   if g = 0 then r = 0
        |
        v
   M_t = (z, r, g, metadata)
        |
        +---- authority hash gate ------> answer or refuse
        |
        v
   outcome receipt --------------------> append to L
```

\(\Theta\) may influence the next write to \(M_t\). \(\Theta\) may never rewrite prior bytes of \(L\).

## 4. Budgets

Serialization is `int8[32]` for \(z\) and `int8[32]` for \(r\). Not float16. Not selectable after the run.

\[
B_z = 32 \text{ bytes}, \qquad B_r = 32 \text{ bytes}
\]
\[
B_{\text{capacity}} = 64 \text{ bytes}
\]
\[
B_{\text{used}} = 32 + 32\, g
\]
\[
g = 0 \Rightarrow r = \mathbf{0}
\]

A nonzero \(r\) with \(g = 0\) is a harness failure. Report \(\bar B_{\text{used}}\) over the evaluation set.

\[
B_X = \text{canonical serialized full-state size, in bytes}
\]
\[
CR = \frac{B_{\text{capacity}}}{B_X}
\]

\(B_X\) is little-endian, declared dtype, no pickle. Measure it on the panel's actual state. Compression may be claimed only if \(B_{\text{capacity}} < B_X\). Otherwise the panel tests bounded learned causal memory only.

### Metadata total

The metadata cap is the sum of the declared fields. There is no extra scope blob.

| Field | Bytes | Enters the net? |
|---|---:|---|
| keep gate \(g\) | 1 | no |
| semantic authority class | 1 | yes, as a 3-way enum |
| declared query-family id | 1 | yes, as a 4-way enum |
| authority receipt hash | 32 | no |
| model hash | 32 | no |
| metadata total | 67 | — |

67 bytes is the total, including every listed field. It is not 67 plus 96, and it is not a 96-byte blob that might grow. A write over 67 metadata bytes is a harness failure.

Canonical payload: little-endian `int8`, no pickle, no JSON numbers inside \(z\) or \(r\).

## 5. What the net may see

\[
a_t^{\text{semantic}} \in \{\text{COMMON\_ONLY},\ \text{TRIAGE},\ \text{FULL\_STATUS}\}
\]
\[
q_t \in \{Q_0, Q_1, Q_2, Q_3\}
\]

The receipt hash validates the read. It is not a predictive input.

Forbidden as inputs: sample id, lineage id, path id, receipt hash, event hash, raw \(k\), route name, any unique key into the 48-row table or the lineage table.

Widening either enum voids the rung.

Input vector to \(E_\theta\): the authorized source, canonically serialized, padded with zeros or truncated to 64 `int8` values. Padding is not a side channel. Truncation is declared and identical for W1 and both baselines.

## 6. Rematerialization

\[
E_\theta(X_t^{\text{auth}}) = h_t
\]

\(h_t\) is discarded after commit. It is not in \(M_t\).

\[
\text{REVOKE} \Rightarrow \text{invalidate } M_t \Rightarrow \text{re-read } X_t^{\text{auth}} \Rightarrow E_\theta \Rightarrow R_\phi(\cdot, a_{\text{new}})
\]

\(X_t^{\text{auth}}\) is the currently authorized projection, not the pre-revocation raw state.

No source:

```text
STALE_RESIDUE_DROPPED
NO_AUTHORIZED_REMATERIALIZATION_SOURCE
```

Reconstruction from \(r_{\text{old}}\) or from a dead \(h_t\) is a harness failure.

E4 is revoke without refresh: readout refuses. E5 is authorized reread: current view realigns, receipt appended, prior ledger bytes unchanged.

Interface revocation is not parameter unlearning.

## 7. Invariants

\[
\Theta \not\rightarrow \operatorname{rewrite}(L)
\]
\[
L_{\text{before}} \text{ is an exact byte-prefix of } L_{\text{after}}
\]
\[
|z_t| = 32, \qquad |r_t| = 32 \text{ as slots}
\]
\[
g = 0 \Rightarrow r = \mathbf{0}
\]
\[
h_t \text{ is ephemeral}
\]
\[
M_t^{\text{stale}} \text{ cannot answer}
\]
\[
\text{test lineage} \cap \text{train lineage} = \varnothing
\]

## 8. Controls

| Control | Match | Not |
|---|---|---|
| \(P_2\) | AH11 wrong distinction: 13 classes, 3.625 bits, \(H(G_\partial \mid P_2) = 0.25\) | not the 64-byte store |
| \(M_{\text{recon}}\) | same architecture, same 5512 parameters, same 64-byte store, reconstruction loss | not the W1 loss |
| \(M_{\text{noncausal}}\) | same architecture, same 5512 parameters, same 64-byte store, predicts \(P_2\) only | not the W1 loss |

No baseline shopping. Both run. Panel A must beat the stronger of the two on task error, and must separate the \(P_2\)-tied pairs that \(R_\Gamma\) separates.

## 9. Panels

### Panel A — AH11

48 labeled histories. 16 base pairs \((U,V)\), \(k \in \{-1,0,+1\}\). Target \(G_\partial\).

\[
H(G_\partial \mid R_\Gamma) = 0, \qquad H(G_\partial \mid P_2) = 0.25
\]

The pair \((I,A)\) and \((A,I)\) shares \(P_2 = A\) and splits \(G_\partial\).

Pass if \(M_t\) separates that pair and every other \(P_2\)-tied pair that \(R_\Gamma\) separates, and task error is below both baselines. Measure \(B_X\). Compression only if \(64 < B_X\).

### Panel B — lineages

NBG-T1 freezes one witness, not an ensemble. History A is `NORTH`, History B is `SOUTH`, both `macro.status = READY`, split by `PROBE_LATENT(route)`. That pair is reserved.

Generated ensemble, built from the T1 grammar before training, routes disjoint from the reserved pair:

\[
N = 12
\]

Latent routes `R00` through `R11`. Same macro `READY`. Same admissible probe. Train, validation, and test assigned by sorted route id, not by a shuffle after results.

| Split | Routes | Count |
|---|---|---:|
| train | `R00`–`R05` | 6 |
| validation | `R06`–`R08` | 3 |
| test | `R09`–`R11` | 3 |
| reserved | `NORTH`, `SOUTH` | 2, test only |

\[
\text{train} \cap \text{test} = \varnothing
\]

The reserved pair is not a training row and not a validation row. \(G_{\text{heldout}}\) is train-route accuracy minus test-route accuracy, reported also on the reserved pair alone.

Pass only if test routes and the reserved pair remain separable under the declared probe. One pair does not satisfy this panel.

### Panel C — revocation

| Phase | Required mark |
|---|---|
| before revoke | `AUTHORIZED_ACTIVE_RESIDUE` |
| authority changed, no refresh | `REVOKED_BUT_STALE_RESIDUE_PRESENT`, readout refuses |
| authorized rematerialization | `AUTHORITY_AND_ACTIVE_MEMORY_ALIGNED` |
| ledger | \(L_{\text{before}}\) is an exact byte-prefix of \(L_{\text{after}}\) |

Current view after alignment matches the fresh observer, not the historical observer. AH36's 0.4 against 0 is the pattern. W1 does not have to reproduce the bit value on a new ensemble.

### Panel D — injected stale control

The harness writes the old residue back after revocation and asks for an answer. Required catch: `STALE_RESIDUE_REFUSED`. A runner that skips the injection does not pass D.

## 10. Scorecard

| Symbol | Accept |
|---|---|
| \(S_{\text{sep}}\) | beats \(P_2\) and the stronger baseline on A; separates B test routes and the reserved pair |
| \(B_{\text{capacity}}\) | 64; metadata 67 |
| \(B_{\text{used}}\) | report; \(g = 0\) forces \(r = 0\) |
| \(B_X\), \(CR\) | report; compression only if \(64 < B_X\) |
| \(L_{\text{revoke}}\) | 0 |
| \(C_{\text{eq}}\) | report |
| \(G_{\text{heldout}}\) | report; not a soft pass |

One unauthorized answer fails the rung.

## 11. Loss

W1 loss is not reconstruction. The recon baseline is.

\[
\mathcal{L}
=
\lambda_{\text{equiv}}\mathcal{L}_{\text{collapse}}
+
\lambda_{\text{sep}}\mathcal{L}_{\text{distinction}}
+
\lambda_{\text{task}}\mathcal{L}_{\text{future}}
+
\lambda_{\text{gate}}\mathcal{L}_{\text{keep}}
\]

with \(\lambda_{\text{equiv}} = \lambda_{\text{sep}} = \lambda_{\text{task}} = \lambda_{\text{gate}} = 1\).

Held-out routes and the reserved pair do not appear in \(\mathcal{L}\).

\(M_{\text{recon}}\) minimizes reconstruction of the 64-byte input. \(M_{\text{noncausal}}\) minimizes prediction of \(P_2\) and does not see \(G_\partial\).

## 12. Run configuration

Frozen. The harness asserts these values. A mismatch voids the rung.

| Item | Value |
|---|---|
| input | 64 `int8`, pad or truncate |
| \(E_\theta\) | Linear \(64 \to 32\), ReLU, Linear \(32 \to 32\), ReLU |
| \(K_\theta\) | Linear \(32 \to 32\), then `int8` |
| \(R_\phi\) | Linear \(39 \to 32\), then `int8`; gate Linear \(39 \to 1\) |
| \(R\) input | \(h\) (32) + authority one-hot (3) + query one-hot (4) |
| parameter count | 5512 |
| train precision | fp32 |
| committed \(z, r\) | `int8` |
| optimizer | AdamW, lr \(10^{-3}\), weight decay 0, betas \((0.9, 0.999)\) |
| steps | 500, full batch, no early stop on test |
| seeds | 0, 1, 2, 3, 4 |
| baselines | \(M_{\text{recon}}\) and \(M_{\text{noncausal}}\), same net, same seeds |

Parameter count the harness must reproduce:

\[
E: (64 \cdot 32 + 32) + (32 \cdot 32 + 32) = 3136
\]
\[
K: 32 \cdot 32 + 32 = 1056
\]
\[
R: (39 \cdot 32 + 32) + (39 + 1) = 1320
\]
\[
\Theta = 3136 + 1056 + 1320 = 5512
\]

Gate weight is \(39\), gate bias is \(1\). Total is 5512. The harness asserts 5512. A different count voids the rung.

All five seeds must have \(L_{\text{revoke}} = 0\). Separation is reported per seed. The rung fails if any seed fails revocation, or if the median seed fails to beat the stronger baseline on Panel A, or if any seed fails the reserved pair.

## 13. Out of scope

- \(\pi_\psi\) (W2)
- governed gradient receipts (W3)
- machine unlearning of \(\Theta\)
- secure deletion, forward secrecy, cache invalidation
- biology, spacetime, or a maker

## 14. Firewall

A pass is a finite learned-memory result on these frozen ensembles. It is not evidence that nature stores residue this way, that a ledger plus a net is a mind, or that revocation erased a parameter. A panel with \(B_{\text{capacity}} \ge B_X\) is not a compression result. This document authorizes a protocol. It does not authorize a result sentence.
