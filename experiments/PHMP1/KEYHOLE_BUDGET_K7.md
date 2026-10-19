# Keyhole Budget K7 E1 | Authenticated evidence versus trustworthy claims

**Status:** deterministic cryptographic *fixture* and synthetic trust-governance control. **Origin:** `SIMULATED`. **Authority:** `NONE`.
**No production keys, live devices, signed provider data, independent clock service, or physical experiment.**

## Why this exists

[K6](KEYHOLE_BUDGET_K6.md) used SHA-256 linked receipts. Hashes detect accidental changes and some unsynchronized tampering, but an attacker able to rewrite and rehash the entire chain can fabricate a consistent history. K7 adds **Ed25519 public-key signature verification**, an explicit source-to-key trust registry, time-limited keys, delivery-order buffering, a simulated independently pinned checkpoint, and a separate **known-reference truth check**.

The central claim is a distinction, not a new physics result:

> **Authenticity of a signed observation is not evidence that the observation is true.** An authorized sensor can fail, lie, or become compromised while continuing to produce cryptographically valid signatures.

## Precise trust and test-key boundary

The Node.js script derives Ed25519 fixture private keys from **public, hard-coded deterministic seed labels** solely for reproducible cryptographic tests. **These private keys are publicly reconstructible and must NEVER be deployed or reused to protect real secrets, devices, services, messages, or trusted ledgers.**

The script creates a pinned local registry of allowed public keys and authorization periods:

| Key ID | Source | Authorized issuance ticks | Meaning |
| --- | --- | --- | --- |
| `alpha-v1` | alpha | 0–4 | Legacy signing key |
| `alpha-v2` | alpha | 5–12 | Rotated signing key |
| `beta-v1` | beta | 0–12 | Independent source key |
| `rogue` | neither | Never | Valid Ed25519 test key, **not trusted** |

A receipt includes schema, session, signed issuance sequence, source, key ID, issuance tick, delivery tick, observation type, known-reference label (or null), observed bit, and predecessor hash.

The emitter signs the canonical ordered JSON payload with Node's built-in Ed25519 implementation. A SHA-256 receipt hash covers that signed payload and signature. Verification checks trusted key identity, its source association, the authorization window **at issuance**, correct signature, payload schema, permitted observation type, known-reference value, due tick, digest, uniqueness, sequential chain predecessor, and the independent checkpoint when supplied.

**This establishes software protocol behavior under this specific set of assumptions.** There is no trusted network time server, device-identity attestation, independently audited certificate authority, certified key storage, or production certificate revocation list. The test clock is a deterministic in-memory fixture; the trust registry is preconfigured and assumed authentic.

### Delay, order, and checkpoint

- Source alpha delivers at **issuance +2 ticks**; beta at **issuance +1 tick**.
- Legally delayed delivery of an observation signed by `alpha-v1` remains valid even if its key has rotated before delivery, because issuance occurred while the key was authorized. The policy does not retroactively erase its trusted history.
- The stream can arrive out of issuance order. The verifier buffers signed events until all prior sequence numbers and chain predecessors are present. A transport reorder is **not** treated as tampering.
- The test copies receipt #4's hash into a **separate frozen checkpoint variable** before mutation attempts. An adversary with access to all the disclosed *test* signing keys can then rewrite and re-sign the complete ledger and still pass signature/chain validation **without** that checkpoint. The original pinned checkpoint rejects the rewritten history.
- This checkpoint is independently supplied to the verifier **within the test process**, not hosted on an actual outside service or public timestamp ledger. K7 does **not** demonstrate durable third-party anchoring or protection if an attacker can also rewrite the verifier's checkpoint/trust configuration.

## Adversarial controls

The executable test includes expected failures for altered signed readings, issuer timestamps, key identities, sensor-source identities, known-reference fields, original signatures, rogue signed records, revoked old-key use after rotation, duplicate deliveries, missing sequence entries, modified sequence numbers, missing history before the pinned checkpoint, and entire validly re-signed history that conflicts with the separate checkpoint.

It also contains positive controls: genuine Ed25519 fixture signatures, authorized old-key issuance after later key rotation, out-of-order network arrival followed by valid ordered commitment, and correct source-authorization windows.

### An authorized signer can still lie

The accepted ledger contains **15 cryptographically valid signed receipts**, including an `alpha-v2` calibration recording **0** for a publicly known reference bit **1**, and later `alpha-v2` target readings recorded as **0** even though the synthetic true target bit is **1**.

The signatures are **valid**. The reading is **false** according to the independently defined reference/truth in this test.

Compare the same signed ledger under three governance choices:

| Verifier / policy | Signed target readings admitted | Correct admitted readings | Meaning |
| --- | ---: | ---: | --- |
| Signature validation only | 8/8 | 5/8 | All keys were authorized, including a misleading source |
| Conventional known-reference quarantine | 5/8 | 5/5 | Block later readings signed by `alpha-v2` after its failed calibration |
| NBG-style typed provenance quarantine | 5/8 | 5/5 | **Exactly the same conventional calibration rule**, expected tie |

The `5/5` here describes **accuracy among admitted synthetic observations, at only 5/8 coverage**. It is not a fair classification accuracy comparison over all eight targets: rejected readings are abstentions, not magically corrected predictions. The logic is a deterministic demonstration, not a real-world false-positive, false-negative, security, or reliability benchmark. The test checks that the previous `alpha-v1` history remains intact and that beta's evidence remains admissible.

**Null verdict:** K7 does **not** show a unique NBG advantage. The NBG-named typed policy implements exactly the same calibration/quarantine rule as an ordinary classical signed-evidence governance policy. Its parity is mandatory.

## Run the actual cryptographic checks

```sh
npm run test:phmp-keyhole-k7
node scripts/test_phmp_keyhole_k7.mjs --out k7-e1-local-receipt.json
```

The Node.js test uses built-in `crypto`, `assert` and `fs` only. Its `--out` option creates a **new** JSON receipt and refuses overwrite; normal regression tests write no output file. The evidence receipt describes key-policy fingerprints, accepted chain/checkpoint digest, simulated attacks, conventional-versus-typed outcomes, and scientific/security nonclaims. Deterministic fixture seeds permit identical replay receipts across runs.

**Cryptographic verification must be executed with the actual Node.js Ed25519 and SHA-256 primitives in GitHub Actions.** Mocked signatures or hash functions are insufficient to certify this K7 experiment.

## Limitations and next rung

Real deployment would need secure key generation and custody, device identity enrollment, authenticated key rotation and revocation, signed or externally anchored checkpoints, independent clock/order guarantees, replay protection across restarts, compromised authorized signer response, data retention and loss-handling rules, and carefully scoped permissions.

A signature validates the origin of a message under a trust registry, not whether its contents are accurate. An independent known-reference calibration provides *some* evidence of content reliability, not general immunity to manipulation.

Future work: use **predeclared adversarial calibration evasion** and signed-but-misleading target content, evaluate selective-prediction accuracy together with abstention coverage, and compare against calibrated classical Bayesian trust/change-detection policies with an independently frozen evaluation split. Do not use K7's deterministic fixture claims as evidence of deployed AI reliability.

**Frozen cohort firewall:** No K1–K6 or PHMP-3 E2 reserved data was generated or scored. No previously frozen AH, PHMP, optical, quantum, or K1–K6 source/result was changed. K7 itself is a deterministic protocol test, **not** a new statistical dataset.

**Ledger Above Ego.**
