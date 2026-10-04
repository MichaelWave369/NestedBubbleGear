# AH Experiment Ladder

The AH line is designed as a sequence of increasingly strict frozen toy-model tests.

| Rung | Focus | Frozen outcome |
|---|---|---|
| AH2 | Latent causal residue | PASS · 29/29 checks · 6/6 tests |
| AH3 | Boundary-transferred latent residue | PASS · 89/89 checks · 7/7 tests |
| AH4 | Two-interface Altermath holonomy | PASS · 44/44 checks · 8/8 tests |
| AH5 | Noncommuting interface order | PASS · 36/36 checks · 8/8 tests |
| AH6 | Closed commutator loop | PASS · 41/41 checks · 9/9 tests |
| AH7 | Oriented holonomy cancellation | PASS · 65/65 checks · 9/9 tests |
| AH8 | Plaquette transport / curvature proxy | PASS · 63/63 checks · 10/10 tests |
| AH9 | Basepoint transport / local-to-global composition | PASS · 106/106 checks · 10/10 tests |
| AH10 | Three-plaquette transport / composition order | PASS · 158/158 checks · 11/11 tests |
| AH11 | Path compression / minimal connector memory | PASS · 34/34 checks · 12/12 tests |
| AH12 | Task-dependent memory / query-indexed residue | PASS · 35/35 checks · 13/13 tests |
| AH13 | Authorized query memory / retention minimization | PASS · 41/41 checks · 15/15 tests |
| AH14 | Revocation / memory downgrade / receipt leakage | PASS · 43/43 checks · 15/15 tests |
| AH15 | Revocation chains / path independence / reauthorization barrier | PASS · 21/21 checks · 15/15 tests |
| AH16 | External authority reauthorization / selective handoff | PASS · 43/43 checks · 15/15 tests |
| AH17 | Split authority / Keyhole parallax reauthorization | QUALIFIED · 28/28 checks · 13/13 tests |
| AH18 | Quorum topology / coalition-dependent authority | QUALIFIED · 51/51 checks · 14/14 tests |
| AH19 | Authority access structures / minimal coalition lattices | QUALIFIED · 65/65 checks · 15/15 tests |
| AH20 | Keyhole criticality / failure sets / policy resilience | QUALIFIED · 68/68 checks · 15/15 tests |
| AH21 | Policy hardening / redundancy synthesis | QUALIFIED · 64/64 checks · 16/16 tests |
| AH22 | Costed policy synthesis / Pareto frontiers | QUALIFIED · 44/44 checks · 15/15 tests |
| AH23 | Robust Pareto frontiers / failure-rate uncertainty | QUALIFIED · 41/41 checks · 15/15 tests |
| AH24 | Heterogeneous / correlated failure regimes | QUALIFIED · 36/36 checks · 15/15 tests |
| AH25 | Failure-domain discovery / redundancy auditing | QUALIFIED · 30/30 checks · 15/15 tests |
| AH26 | Sequential failure auditing / evidence persistence | QUALIFIED · 24/24 checks · 15/15 tests |
| AH27 | Windowed evidence / horizon-indexed memory | QUALIFIED · 25/25 checks · 15/15 tests |
| AH28 | Multi-horizon governance / evidence arbitration | QUALIFIED v0.1.1 · 23/23 checks · 15/15 tests · v0.1.0 failed 22/23 |
| AH29 | Horizon authorization / evidence least privilege | QUALIFIED · 23/23 checks · 15/15 tests |
| AH30 | Derivation closure / authority-safe release synthesis | QUALIFIED · 31/31 checks · 15/15 tests |
| AH31 | Collusion closure / coalition effective authority | QUALIFIED · 26/26 checks · 15/15 tests |
| AH32 | Coalition-safe release design / task-sufficient coarsening | QUALIFIED · 30/30 checks · 15/15 tests |
| AH33 | Task richness / coalition privacy frontier | QUALIFIED · 39/39 checks · 15/15 tests |
| AH34 | Mixed task profiles / authority-aware privacy budgets | QUALIFIED · 49/49 checks · 15/15 tests |
| AH35 | Upgrade access structures / privacy-critical distinctions | QUALIFIED v0.1.1 · 29/29 checks · 15/15 tests · v0.1.0 failed 28/29 |
| AH36 | Dynamic upgrade grants / revocation / privacy restoration | QUALIFIED · 31/31 checks · 15/15 tests |
| AH37 | Epoch-scoped disclosure / forward privacy boundaries | QUALIFIED · 18/18 checks · 15/15 tests |
| AH38 | Hiding commitments / key scope / disclosure-safe epoch receipts | QUALIFIED · 24/24 checks · 15/15 tests |
| AH39 | Delayed key disclosure / authenticator history | QUALIFIED · 26/26 checks · 15/15 tests |\n| AH40 | Split verification authority / threshold declassification | QUALIFIED · 27/27 checks · 15/15 tests |\n| AH41 | Verifier compromise / role fusion / quorum resilience | QUALIFIED · 29/29 checks · 15/15 tests |

## Research progression

```text
hidden residue
  -> boundary transfer
  -> observable return without full return
  -> noncommuting order
  -> closed-loop residue
  -> orientation + inverse cancellation
  -> neighboring plaquettes / local-to-global cancellation
  -> basepoint-aware local-to-global composition
  -> three-plaquette transported associativity
  -> path compression / task memory
  -> authorized memory
  -> revocation + downgrade + receipt semantics
  -> revocation chains + reauthorization barriers
  -> external authority selective handoff
  -> split-authority Keyhole parallax
  -> quorum topology / coalition-dependent authority
  -> task-relative authority access structures
  -> failure topology / capability-vs-policy resilience
  -> constrained policy hardening synthesis
  -> costed policy synthesis / Pareto frontiers
  -> robust Pareto frontiers / failure-rate uncertainty
  -> heterogeneous / correlated failure regimes
  -> failure-domain discovery / redundancy auditing
  -> sequential failure auditing / evidence persistence
  -> windowed evidence / horizon-indexed memory
  -> multi-horizon governance / evidence arbitration
  -> horizon authorization / derivability-aware least privilege
  -> derivation closure / authority-safe release synthesis
  -> collusion closure / coalition effective authority
  -> coalition-safe task-sufficient release design
  -> task richness / coalition privacy frontier
  -> mixed task profiles / authority-aware privacy budgets
  -> upgrade access structures / privacy-critical distinctions
  -> dynamic upgrade revocation / privacy restoration
  -> epoch-scoped disclosure / forward privacy boundaries
  -> hiding commitments / key scope / mediated verification
  -> delayed key disclosure / authenticator history
```

Every rung keeps an explicit claim firewall. "Holonomy" and "curvature proxy" are operational names for finite constructions, not claims of physical gravitational holonomy or curvature.


## AH36 — Dynamic upgrade grants / revocation / privacy restoration

AH36 makes one AH35 minimal distinction-collapse path temporal and separately tracks:

```text
authorized-next-release
current materialized disclosure
append-only historical ledger
```

Frozen privacy sequences:

```text
authority: 1.160964 -> 0.675489 -> 0.4 -> 0 -> 0.4 -> 0.4
current:   1.160964 -> 0.675489 -> 0.4 -> 0 -> 0   -> 0.4
ledger:    1.160964 -> 0.675489 -> 0.4 -> 0 -> 0   -> 0
```

The collapse path is:

```text
H_L:T
A_A:T
A_A:F
```

At E4, revoking `H_L:T` restores the prospective authority view to **0.4 bits**, but the already-materialized lifetime TRIAGE value remains present:

```text
REVOKED_BUT_STALE_DISCLOSURE_PRESENT
```

so current and historical views remain at **0 bits**.

At E5, explicit rematerialization at `COMMON_ONLY` restores current-view residual privacy to:

```text
0.4 bits
```

while the historical append-only ledger remains exactly reconstructive:

```text
0 bits
```

Fresh observer versus historical observer:

```text
fresh E5 current view = 0.4 bits
full historical view = 0 bits
```

Supported operational statements:

```text
permission revoked != current disclosure coarsened != historical disclosure erased
current-view privacy can recover while historical-view privacy cannot
privacy restoration is observer-history relative
```

Package SHA-256:

`6beec0a30dbcf30599f0b40acfa5069de60cbef9d2674b55ff6892698a1c2efd`

Claim boundary: AH36 is a finite disclosure-history model. It does not establish secure deletion, cryptographic forward secrecy, cache invalidation, deletion of third-party copies, or retroactive secrecy.


## AH37 — Epoch-scoped disclosure / forward privacy boundaries

AH37 rotates from a rich Epoch-0 release to a downgraded Epoch-1 release and compares observer histories.

Frozen result:

```text
fresh E1 observer                 = 0.4 bits
legacy E0+E1 observer             = 0 bits
public SHA256(E0)+E1 observer     = 0 bits
metadata-only seal + E1 observer  = 0.4 bits
```

The deterministic public SHA-256 digest exposes the old target in this frozen ten-panel domain because all candidate old-epoch releases are known and enumerable: 9 distinct rich snapshots produce 9 distinct digests, and every digest maps to exactly one frozen target class.

Supported operational statements:

```text
forward privacy boundary != historical erasure
public deterministic commitment != non-disclosure in a tiny enumerable domain
```

Package SHA-256:

`4d86623914433a211f0c58de0d619207ba302c260c961b3944efde6baf0487a7`

Claim boundary: AH37 does not claim SHA-256 is reversible, does not establish cryptographic forward secrecy or hiding commitments, and does not generalize the tiny-domain enumeration result to large unknown domains.


## AH38 — Hiding commitments / key scope / disclosure-safe epoch receipts

AH38 compares public and mediated Epoch-0 verification artifacts against the AH37 forward privacy boundary.

Frozen observer outcomes:

```text
fresh E1 only                         = 0.4 bits
public SHA256(E0) + E1               = 0 bits
public-salt SHA256(E0) + E1          = 0 bits
8-key HMAC public tag + E1           = 0 bits
8-salt hidden-salt digest + E1       = 0 bits
mediated VERIFIED receipt + E1       = 0.4 bits
key-authorized verifier              = 0 bits
```

Finite attacker controls exhaustively enumerate 8 candidate keys × 9 distinct old disclosures and 8 candidate salts × 9 distinct old disclosures. Both produce 72 distinct candidate verifier artifacts, and every observed artifact identifies exactly one frozen target class.

AH38 deliberately emits:

```text
NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE
```

rather than converting a computational hiding assumption about a high-entropy secret HMAC key into a fabricated information-theoretic entropy result.

Supported operational statements:

```text
verification authority != evidence disclosure authority
public verifier artifact design is part of the privacy boundary
tiny enumerable secret spaces are not hiding mechanisms
```

Package SHA-256:

`642f6314feeabb88e5de561fa079dbf3b53de4fc979b321bc7e158f496e3858c`

Claim boundary: AH38 is a finite observer/key-scope experiment. It does not establish hiding commitments, cryptographic forward secrecy, high-entropy HMAC leakage or hiding, deployed key-management security, or side-channel resistance.


## AH39 — Delayed key disclosure / authenticator history

AH39 makes verification-key authority temporal and tracks which panel-dependent authenticator artifacts actually crossed the epoch boundary.

Frozen observer outcomes:

```text
fresh E1 only                              = 0.4 bits
public toy-HMAC tag before key             = 0 bits
public tag + later key                     = 0 bits
mediated VERIFIED, tag withheld            = 0.4 bits
later key, tag still withheld              = 0.4 bits
tag released after key                     = 0 bits
key revoked after historical disclosure    = 0 bits
```

The public-tag branch is already declassified before key release in the frozen eight-key attacker model, so AH39 does not falsely attribute that disclosure to the later key event.

Supported operational statements:

```text
key disclosure does not recreate an authenticator that never crossed the boundary
already-public authenticators remain part of disclosure history across later key-policy changes
effective disclosure must account for artifact history + key-authority history
```

Package SHA-256:

`201995fa332e80b7c4f9aa9a17721ed24a1b028217809185ac20905ea40d4340`

Claim boundary: AH39 is a finite observer-history and eight-key toy-model result. It does not establish cryptographic forward secrecy, secure key deletion, high-entropy HMAC hiding or leakage, deployed key-rotation correctness, or side-channel resistance.

## AH40 — Split verification authority / threshold declassification

AH40 separates a **2-of-3 verification quorum** from a **3-of-3 public evidence-release quorum** across three toy verifier principals.

Frozen coalition/action outcomes:

```text
VERIFY_ONLY             = 4/8 coalitions ALLOW
DECLASSIFY_EPOCH0       = 1/8 coalitions ALLOW
authorized VERIFY_ONLY  = 0.4 bits residual privacy
3-of-3 VERIFY_ONLY      = 0.4 bits
3-of-3 DECLASSIFY       = 0 bits
debug public-tag output = 0 bits
```

Minimal verification coalitions are `{A,B}`, `{A,C}`, and `{B,C}`; only `{A,B,C}` may declassify Epoch 0. The full coalition can possess declassification capability while still preserving the forward boundary when it exercises `VERIFY_ONLY` and emits only the panel-independent mediated receipt.

Supported operational statements:

```text
verification quorum != public evidence-release quorum
coalition capability != action exercised != output disclosed
mediated verification preserves the boundary only while the public output schema stays coarsened
```

Package SHA-256:

`64d327e566d4f9dcf5df7a3d4c81da6cd944b99a40a20eedd533cc721cb5d16b`

Claim boundary: AH40 is a finite authorization/output-schema experiment. It does not implement threshold cryptography, secret sharing, MPC, cryptographic quorum signatures, malicious-verifier resistance, deployed key custody, or secure hardware behavior.


## AH41 — Verifier compromise / role fusion / quorum resilience

AH41 maps AH40 logical verifier seats onto physical principals and compares independent ownership with a fused A+B ownership negative control.

Frozen physical thresholds:

```text
verification:           independent 2 -> fused 1
strict declassification independent 3 -> fused 2
weak 2-of-3 control:    independent 2 -> fused 1
```

At independent physical failure rate `p=0.1`:

```text
verification reliability:        0.972 -> 0.900
strict declassification reliability: 0.729 -> 0.810
```

Fusion therefore creates a verification single point of failure while making strict declassification more available and easier to compromise physically. Under strict independent ownership, a two-principal malicious declassification request is refused and the ordinary observer remains at **0.4 bits** residual privacy.

Supported operational statements:

```text
logical quorum size != independent principal threshold
role fusion can change compromise threshold and availability in opposite directions
availability quorum != declassification compromise threshold
```

Package SHA-256:

`99625d4003a6d7c98ac1a57aee4a3f5857e4fb348d819967bba08128ed1d3133`

Claim boundary: AH41 is a finite seat-ownership, coalition, failure-cut, reliability, and mediated-output model. It does not establish threshold cryptography, BFT, MPC, production custody, secure hardware independence, or real-world correlated failure rates.
