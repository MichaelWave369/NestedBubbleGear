# NBG-QM2 · Repeated Trial Hash Search Benchmark (proposed)

QM2 extends the public QM1 teaching laboratory with controlled repeated
**software** measurements of three nonce-order permutations using exactly
the same double-SHA-256 hash implementation and synthetic 80-byte headers.

No wallet, miner, pool, Bitcoin consensus target or quantum processor is used.

## Frozen protocol

- Repetitions: 3, 6, 9; each divisible by the three scheduler variants.
- Full nonce domain: 32, 64, 128, 256, 512 (identical for all arms).
- Scheduling: SEQUENTIAL, SEEDED_SHUFFLE, NBG_GEAR.
- A seeded Fisher-Yates shuffle determines the first block's treatment
  arrangement; within each block of three rounds, the three schedules
  rotate cyclically through first, second and third execution positions.
  This is *balanced block-randomized order*, not blinded hardware testing.
- Each round has a new deterministic synthetic-header seed, shared by all
  three strategies. Each strategy hashes the **entire nonce universe**
  exactly once. Workload is not reduced on first success.
- Each block receives optional (0 or 16 hashes per strategy) **untimed**
  preconditioning. No warmup values enter throughput distributions.
- The per-run timing window contains candidate generation and two
  SHA-256 calls per nonce. Throughput is local, runtime-dependent
  SHA256d candidate evaluations per second, not single SHA-256
  compression throughput or ASIC equivalent.
- Outside timing, QM2 recomputes the expected digest of **every nonce**
  for the round, compares every accepted recorded proof and the claimed
  first success, and verifies that each strategy's total hit set agrees.
  This uses the same injected SHA-256 implementation, not a completely
  independent cryptography implementation.
- Descriptive outcomes: median, mean, population standard deviation,
  coefficient of variation, min, max, interpolated Q1, Q3; paired
  round-by-round NBG/SEQUENTIAL and SHUFFLE/SEQUENTIAL rate ratios.
  These are **not** p-values, confidence intervals or claims of significance.

## Interpreting the results

When all three nonce permutations cover the entire domain, they
necessarily discover identical accepted hashes. An early first-hit
result for a strategy is a property of ordering, not a reduced expected
hash-preimage search complexity.

Browser WebCrypto timing may be affected by asynchronous scheduling,
JIT warmup, background tabs, throttling, CPU frequency, power and other
workload interference. Balance across the execution positions helps
quantify some confounding, but does not isolate hardware efficiency.
Node built-in crypto timing is a distinct backend and must not be
pooled into the same experimental population.

No energy instrumentation is present. J/hash and economic viability
remain **unmeasured**.

## Relation to quantum / AQLEN

QM2 does not run Grover on quantum hardware or suggest that the
classical scheduler is a quantum algorithm. The QM1 toy Grover
simulator stays separate.

QM2 JSON receipts retain the ordered execution plan, exact seed for
each round, raw trial timings, derived statistics, complete reference
recomputation counts, audits, and provenance flags. The AQLEN React
console's **separately reviewed QM2 v1 receipt importer** (AQLEN PR #24)
accepts this full JSON document directly, using its existing
**Import JSON** file chooser. It converts the receipt into a read-only
software evidence graph in browser memory.

The importer validates frozen `nbg.qm2.receipt.v1` provenance, trial
balance, same-work/same-seed controls, reference-audit reporting, and
the arithmetic of descriptive and paired statistics. It does
**not** recompute SHA-256 hashes from the imported report, verify
actual hardware timing or energy, certify causal performance effects,
or promote the results into the AQLEN quantum ledger. A valid
self-consistent receipt is not proof of authentic benchmark execution.

Use the exported `nbg-qm2-repeated-trial-receipt.json` file for
handoff. Never import the QM1 graph in place of a QM2 receipt.

## Accepted protocol checks

\`npm run test:qm2\` tests full-domain uniqueness, balanced rotating
order, maliciously altered proof rejection, rehash completeness,
descriptive statistics, proper query budgets and explicit no-promotion
status. Run alongside the full \`npm test\` and \`npm run build\`.
