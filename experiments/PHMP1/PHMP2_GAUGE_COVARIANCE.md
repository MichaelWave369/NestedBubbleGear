# PHMP-2 Stage 2 | Local frame covariance of native AH9 / AH10

**Status:** reproducible exact finite audit. **Origin:** SIMULATED. **Authority:** NONE. No frozen AH files changed.

## Question

Do the native AH9 and AH10 edge-path constructions retain the correct conjugacy invariants and basepoint-aware local-to-global reconstruction under **independently chosen** invertible frames at each graph vertex?

Native NBG sources: [AH9](../AH9/SPEC.md) and [AH10](../AH10/SPEC.md). These specify row-vector states and traversal-order multiplication of matrices in `SL(2,Z)`; this is **not** a U(2) or Dirac spinor embedding.

For a directed edge `e: u -> v` with matrix `E_e`, a new row-vector basis `Q_v` at each vertex transforms the edge as

```text
E'_e = Q_u^-1 E_e Q_v
E'_{v->u} = (E'_e)^-1
```

For a path `p:u->v`, telescoping requires `P'_p = Q_u^-1 P_p Q_v`. In particular, for a closed path based at vertex `u`, the loop changes by conjugation. Trace and determinant are therefore preserved.

## Explicit native networks

**AH9**: six vertices arranged as two adjacent plaquettes: top `0,1,2`, bottom `3,4,5`. Top edges `a=T` and `b=B`; vertical edges `c=A^-1 T`, `d=e=I`; bottom edges `f=g=I`. Original local loops are `a d f^-1 c^-1=A` at vertex 0 and `b e g^-1 d^-1=B` at vertex 1. The direct outer path is `a b e g^-1 f^-1 c^-1`. Reconstruction transports the second loop through the transformed top edge `a'` before composing at vertex 0.

**AH10**: eight vertices in a three-plaquette strip: top `0,1,2,3`, bottom `4,5,6,7`. Top edges `t1=T1`, `t2=T2`, `t3=I`; bottom edges `b1=A^-1 T1`, `b2=B^-1 T2`, `b3=C^-1`, `C=AB`; four vertical edges all `I` initially. The three local loops are `A, B, C` at vertices 0, 1, 2. Their correctly transported product matches the eight-edge outer boundary and both association orders.

The audit uses **six deterministic, fully disclosed gauge assignments** for each of the **12 native AH9 connector cases** and **16 native AH10 connector-pair cases**. A gauge assignment includes independently varied frames across vertices; the all-identity assignment is a control.

## Verification and exact results

```sh
npm run test:phmp2-gauge
node scripts/test_phmp2_gauge.mjs --out phmp2-stage2-local-receipt.json
```

The script uses dependency-free Node.js, exact BigInt integers, explicitly checked path continuity, and canonical SHA-256 receipts. The `--out` form creates **only a new file** (refuses overwrite). It does not import, update, or regenerate frozen AH artifacts.

| Audit | Native cases | Gauge assignments | Valid covariance checks | Deliberately broken one-edge controls detected |
| --- | ---: | ---: | ---: | ---: |
| AH9 | 12 | 6 | 72/72 | 60/60 nonidentity assignments |
| AH10 | 16 | 6 | 96/96 | 80/80 nonidentity assignments |

Every valid assignment must additionally reconstruct the outer loop by basepoint-aware composition, preserve trace/determinant, and satisfy loop-inverse cancellation. AH10 checks both transported association orders.

The fault controls intentionally omit the destination-frame factor at a bottom edge and must violate the predicted basepoint-conjugacy equation. This tests the harness's sensitivity to an inconsistent edge transform; it does not show that arbitrary real-world gauge errors would be detected.

## Interpretation

**Supported:** The native finite group-valued AH9/AH10 edge systems exhibit the expected *local* frame covariance of an ordinary classical discrete connection. This strengthens the mathematical classification of the existing AH constructions.

**Not supported:** New physics, Einsteinian metric geometry, physical gauge fields, quantum/Dirac effects, U(2) unitary equivalence, NBG-specific mathematical novelty, physically regenerative energy, phase memory advantage, or learned AI performance.

### Next experimental question

PHMP-2's deeper phase-mapping claim remains **NOT EVALUATED**. Preserve the `SL(2,Z)` native operators. Examine candidate non-unitary complex representations or explicit information-losing unitary quotients and prove which algebraic properties survive the map. Compare against classical connection baselines. Verify AH4–AH8 original archive identities before asserting source-level maps.

Ledger Above Ego.
