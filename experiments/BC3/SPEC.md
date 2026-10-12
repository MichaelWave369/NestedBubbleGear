# NBG-BC3 · Evidence Custody vs. Truth (v0.1.0)

**Protocol candidate:** frozen input space and evaluation criteria. Origin **SIMULATED**; authority **NONE**; empirical claim **NONE**.

## Question

Can an observer distinguish insufficient, duplicated, tampered, contradictory, and apparently multi-source evidence? Can a valid two-signer record still carry a false statement when the signer keys and content are aligned?

BC2's strongest negative control accepted an internally consistent coordinated false provenance claim. BC3 explicitly separates **algebraic signature validity**, **distinct credential identities**, **a two-credential acceptance policy**, and **factual correctness**. Neither a signature nor a quorum is treated as evidence that a measurement actually occurred.

## Exact toy world

Exhaust all source and edit symbols in `{0,1,2,3}`, giving 16 worlds. Destination payload `payload = source XOR edit`. The experimenter knows `source` and `edit`; the observer does **not**. The observer input is exactly `{payload, records}`, where a record is `{issuer,claim,signature}`, and `claim` represents an asserted edit mask.

Two fixed, publicly disclosed teaching-key pairs instantiate toy RSA modular exponentiation:

| Signer | p | q | n | e | d |
|---|---:|---:|---:|---:|---:|
| A | 61 | 53 | 3233 | 17 | 2753 |
| B | 47 | 59 | 2773 | 17 | 157 |

These toy keys **are not secret or secure**, and the system makes no practical cryptographic-security claims. The verifier checks `signature^e modulo n == claim`. For tiny messages `0..3`, finite brute force is trivial, so even valid verification establishes no defensible security margin. There is no hashing, real certificate infrastructure, robust key management, time-stamp authority, sensor authentication or external truth oracle in BC3.

## Deterministic observer rules

1. Reject unexpected input fields, malformed record shapes, non-binary-range payloads or invalid record claims.
2. `REFUSE_NO_EVIDENCE` if no records.
3. `REFUSE_UNKNOWN_ISSUER` if an issuer is outside A/B.
4. `REFUSE_UNSIGNED` on a missing signature; `REFUSE_INVALID_SIGNATURE` on a signature that fails the toy equation.
5. Deduplicate byte-matched copies with the **same issuer**. Same-issuer contradictory records are `REFUSE_CONFLICT`; copied records cannot meet a two-issuer threshold.
6. If distinct, valid signer claims conflict: `REFUSE_CONFLICT`.
7. One authenticated claim algebraically identifies a candidate `payload XOR claim`, but cannot pass the policy: `REFUSE_QUORUM`.
8. Two matching, valid, distinct issuer records pass `ACCEPT_TOY_QUORUM`, and yield the claimed origin. This is **policy admission**, not a scientific truth claim.

The scoring truth stays outside the observer function; the receipt includes it in an explicitly experimenter-only field for post-hoc audit.

## Frozen factorial (16 worlds x 9 modes = 144 exact evaluations)

| Regime | Expected accepted | Expected correct | Expected false accepted | Expected refusals |
|---|---:|---:|---:|---:|
| NO_EVIDENCE | 0 | 0 | 0 | 16 |
| UNSIGNED_CLAIM | 0 | 0 | 0 | 16 |
| SIGNED_SINGLE | 0 | 0 | 0 | 16 |
| DUPLICATED_SINGLE | 0 | 0 | 0 | 16 |
| TAMPERED_SINGLE | 0 | 0 | 0 | 16 |
| DUAL_HONEST | 16 | 16 | 0 | 0 |
| DUAL_CONFLICT | 0 | 0 | 0 | 16 |
| DUAL_COORDINATED_FALSE | 16 | 0 | 16 | 0 |
| UNKNOWN_ISSUER | 0 | 0 | 0 | 16 |

The forged claim is `edit XOR 1` (a different valid two-bit edit). In `DUAL_CONFLICT`, A signs that false edit while B signs the true edit, producing a refused contradiction. In `DUAL_COORDINATED_FALSE`, both sign the same false edit, so two distinct keys pass the verifier and the policy **while the resulting source attribution is wrong in every case**. This is a deliberate disproof of the naive equation "two signers + verified signatures = observed truth."

## Falsification / fail gates

- Wrong 16-world census, nine-mode census or predicted outcome counts.
- Any unauthorized one-signer acceptance, or duplicate issuer meeting a two-signer quorum.
- Passing unsigned, tampered or unknown-signer records.
- Admitting contradictory genuine toy-signed claims.
- Failure to recover correct source under dual-honest toy reports.
- Failure to expose **all 16 false acceptances** under coordinated false reports.
- Ground truth leaking into the adjudicator, or unexpected fields being accepted.
- Nondeterministic receipts, missing origin/authority labels or false claims of secure cryptography.

The toy world's input already defines the eventual outcomes. Passing these tests proves only implementation fidelity and the information-theoretic limitation of authenticating claims without establishing their factual correctness. BC3 does **not** derive empirical results about viruses, retrotransposition, BC200, evolutionary selection, living systems, gene therapies or any new physical law.

## Reproduction and provenance

The source is `src/boundaryCustody.js`; tests `scripts/test_boundary_custody.mjs`; live lab `src/BoundaryCustodyLab.jsx`; receipt emitter `scripts/run_boundary_custody.mjs`. The optional SHA-256 receipt digest identifies a serialized toy artifact only, not a secured attestation or a real molecular sample.

Motivating source: Gao et al. (2026), *Science*, DOI [10.1126/science.aeh3441](https://doi.org/10.1126/science.aeh3441).

BC1, BC2 and all frozen AH experiments are unchanged. Future non-toy empirical tracks would need real source data, lawful access, independently reviewed custody, preregistered baselines and source-verified claims.
