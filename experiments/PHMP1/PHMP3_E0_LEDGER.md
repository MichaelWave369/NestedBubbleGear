# PHMP-3 E0 prospective benchmark decision ledger

**Date:** 2026-10-18  
**Origin:** SIMULATED  
**Authority:** NONE  
**Research verdict:** CONTRACT_QUALIFIED, NO_MODEL_RESULT

## What was actually checked

A dependency-free Node.js test independently generated 256 training histories and 128 validation histories using the proposed source contract and verified **1,536 deterministic modular query targets**. All four query forms per history were checked. It also tested stable regeneration, event sequence validity, invalid-event rejection, modulo-2/3 matrix inverses, empty-history AH10 baseline, preservation under cross-lane event interleaving, preservation under an adjacent inverse pair, and an explicitly order-sensitive A/B control.

The local prospective E0 receipt SHA-256 was:

`c92ad12baafdf7c6659b9946b7df4c955acbb990345fde2aaca5b17c2d0b2b03`

This hash identifies the standalone E0 contract receipt **only**, not a frozen AH source package or PHMP-3 model result. GitHub CI status must be checked independently.

## Known ceiling and anticipated null

For the exact late-query family `p in {2,3}` and `v in {e1,e2}`, standard modular group theory supplies a perfect **two-byte** sufficient statistic for the two connector products: each lane has 144 possible `SL(2,Z/6Z)` product states, so both lanes fit among 20,736 joint states. That ordinary baseline must score 100% once implemented correctly. Thus **no candidate can exceed its accuracy at two bytes** on these tasks.

A phase-aware or NBG-inspired implementation may still be interesting for codebook cost, running time, observer policy, noisy/generalized tasks or other objectives, but any corresponding claims require **new predeclared fair experiments**. An equally accurate tie is not a novel prediction.

## Work NOT done in E0

- No memory candidate trained, ranked, or tested.
- No reserved 512-history evaluation generated or scored.
- No result attributed to actual LLMs, hardware resource efficiency, quantum mechanics, or a physical NBG substrate.
- No true cryptographic blindness: reserved seed 203 is public. Independence relies on the stated freeze-and-score procedure and new seeds for future retests.

## Next gates

E1 must implement the classical exact group-state baseline and bounded-memory contenders, audit their byte and lookup-table accounting, and validate controls **only on train/validation**. Freeze E1 code and hyperparameters before E2 reserved evaluation. Any peeking at reserved results voids the clean held-out claim.

**Ledger Above Ego.**
