# PHMP-2 Stage 1 | Native AH9/AH10 exact transport audit

**Status:** computed finite mathematical correspondence / partial PHMP-2 audit. **Origin:** `SIMULATED`. **Authority:** `NONE`.

## Why this stage matters

PHMP-1 tested a separately constructed complex `U(2)` H/S example. The native frozen NBG experiments **do not use those matrices**.

This stage instead reads and independently reimplements the exact mathematical edge-path rules from:

- [AH9 native specification](../AH9/SPEC.md), [Python source](../AH9/src/ah9.py), and [qualification receipt](../AH9/results/qualification_receipt.json)
- [AH10 native specification](../AH10/SPEC.md), [Python source](../AH10/src/ah10.py), and [qualification receipt](../AH10/results/qualification_receipt.json)
- [Existing immutable AH dossiers](../AH2-AH10_DOSSIERS.md)

AH9/AH10 use **row vectors** and `SL(2,Z)` integer edge transports multiplied in traversal order. They constitute ordinary finite **group-valued discrete-connection / loop-transport calculations** (no assumption of a Hermitian or unitary metric).

This description follows directly from their explicit invertible edge operators, local loops, connector conjugations, and basepoint-invariant traces/determinants. It **does not** imply any newly discovered physical gauge field or NBG-specific statistical/AI improvement.

## Reproduction

```sh
npm run test:phmp2
node scripts/test_phmp2.mjs --out phmp2-local-receipt.json
```

`--out` creates a JSON file only at the expressly provided **new** path, without overwriting anything. Output contains a SHA-256 digest of deterministic canonical receipt content. Local artifacts should not be committed as authoritative external measurements.

The implementation in [scripts/test_phmp2.mjs](../../scripts/test_phmp2.mjs) is **independent JavaScript with exact BigInt integer arithmetic**; it imports no native Python functions and never writes to frozen AH paths.

## Exact checked results

| Frozen group | Cases | Full transported reconstruction | Naive equality | Other negative controls |
| --- | ---: | ---: | ---: | --- |
| AH9 | 12 connectors | 12/12 | 4/12 | Noncommuting 8/12, exact defect identity |
| AH10 | 16 connector pairs | 16/16 | 1/16 | Omit connector 1: 4/16; omit connector 2: 4/16 |

Additionally:

- AH9 at `T=BA`: direct outer `[[3,2],[4,3]]`, naive `[[1,1],[1,2]]`; respective traces `6` and `3`.
- AH9 at `T=S`: full transported outer boundary is exactly `I` while naive product is not.
- AH10 at `T1=A,T2=B`: outer `[[5,3],[3,2]]`, naive `[[3,4],[2,3]]`; respective traces `7` and `6`.
- AH10 at `T1=B,T2=S`: outer is exactly `I`, all three naive/omission controls are nonidentity.
- Basepoint conjugation preserves trace and determinant in every native case; reverse/forward loop products cancel exactly.
- For every AH10 case, both correctly transported association orders reproduce the direct boundary.
- Native `A=[[1,1],[0,1]]` satisfies `A!=I`, `(A-I)^2=0`, and `A^n=[[1,n],[0,1]]`. Its nontrivial Jordan block prevents a 2×2 similarity transform to a unitary matrix over a positive-definite Hermitian inner product. **This does not rule out other embeddings or nonfaithful representations.**

**Local independent run:** the JavaScript script passed all assertions and produced deterministic canonical receipt SHA-256 `760f915777b4ef4ad0b8cd0bf3ecdc8b1588383dc05617624e5b7c6b2f4eb701`. This is a hash of the new audit's canonical output, not a frozen AH package hash.

## Interpretation and next gates

**Supported now:** The explicitly documented AH9/AH10 constructions already instantiate native group-valued discrete transport and basepoint conjugacy. This is a *mathematical classification of their frozen finite operators*.

**Not supported yet:**

- An operator-level correspondence of AH4–AH8: inspect/hash-verify the original archives before asserting one.
- A faithful map from native `SL(2,Z)` operators to Grok's `U(2)` or to Clifford / Dirac spinor transport.
- A new NBG-specific predictive law, robust learned phase memory, holographic storage, causal geometry, quantum effects, energy savings, or external physics validation.
- Complete gauge covariance under arbitrary independently chosen local frame changes (the current audit checks basepoint conjugacy only).

**Next proposed step:** a separate PHMP-2 Stage 2 edge-gauge covariance test with explicit vertices, typed arrows, local basis changes and an obstruction log, followed by a baseline-discriminating PHMP-3 design only if it adds a genuinely new question.

No frozen AH content or original receipts were changed. Do not conflate this audit's reproduction with empirical validation.
