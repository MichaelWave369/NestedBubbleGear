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
| AH35 | Upgrade access structures / privacy-critical distinctions | QUALIFIED v0.1.1 · 29/29 checks · 15/15 tests · v0.1.0 failed 28/29 |\n| AH36 | Dynamic upgrade grants / revocation / privacy restoration | QUALIFIED · 31/31 checks · 15/15 tests |

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
