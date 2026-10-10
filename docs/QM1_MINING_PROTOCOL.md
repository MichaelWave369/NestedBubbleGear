# NBG-QM1 · Quantum-Inspired Mining Research (experimental)

## Scientific boundaries

QM1 compares three classical **nonce-order strategies**, then separately
simulates a tiny Grover search circuit as a classical amplitude vector. It
neither mines cryptocurrency for payment nor exercises a quantum computer.
The NBG "gear" order is an odd-stride permutation inspired by golden-ratio
sampling. It does NOT increase the mathematical chance that a uniformly
random SHA-256 hash satisfies a target.

## Classical benchmark

Each strategy runs the same number of nonce trials against the same
synthetic 80-byte header with a little-endian 32-bit nonce at byte 76,
computing SHA256(SHA256(header)). Strategies:

- SEQUENTIAL: 0, 1, 2, ...
- SEEDED_SHUFFLE: deterministic Fisher-Yates nonce permutation.
- NBG_GEAR: odd modular stride permutation across the same bounded domain.

All candidate sets are unique and identical when run through the full
domain. A run can record which strategy *found its first hit earliest*,
but that is an ordering effect, not a cryptanalytic reduction in work.

To make the demo simple, acceptance is **raw digest leading zero bits**,
not Bitcoin's endianness/compact-target consensus comparison. So a
successful result is NOT an actual Bitcoin block header or consensus proof.

In-browser comparisons use WebCrypto, whose asynchronous overhead makes
wall-clock speed numbers environment dependent and unrelated to ASIC/GPU
performance. The Node command uses built-in crypto. Running
\`node scripts/benchmark_qm1.mjs\` prints a local software receipt.
No energy sensor exists, so J/hash and actual energy efficiency are **null**.

## Toy Grover state-vector simulation

State initialized to 1/sqrt(N). The toy oracle phase-flips exactly one
predeclared marked basis state; the diffusion operator inverts amplitudes
around their mean. The simulator returns the squared marked amplitude,
the amplitude norm, and one oracle call per Grover iteration.

This is an **idealized classical simulation of a quantum algorithm**, not
a quantum-hardware runtime, a realistic SHA-256 reversible quantum oracle,
an apples-to-apples wall-clock benchmark, or a Grover advantage claim for
actual cryptocurrency networks.

## AQLEN evidence handoff

QM1 can export a read-only AQLEN \`receipt_graph.schema.json\`-compatible
JSON graph (v0.1.0) using only valid node types \`module\` and
\`evidence_anchor\` and edge type \`derived_from\`. The embedded summaries
include measured software hash throughput (if available), simulated Grover
probability, explicit limitations and authority boundaries.

This graph is a **portable export**, not a live data sync, not a quantum
hardware experiment, and not an authorized promotion into AQLEN's
calibration, qubit provenance, or verified readiness ledgers. Inspect it
locally and import using AQLEN's established graph tooling if desired.

## Controls and testing

\`npm run test:qm1\` verifies nonce permutation uniqueness, double-SHA256
against Node's independent crypto hash, target predicate, independent
reverification of reported hits, identical full-domain hit counts,
Grover normalization, schema-compatible AQLEN graph shapes and refusal
of invalid settings. Included in \`npm test\` and \`npm run build\`.

\`node scripts/benchmark_qm1.mjs\` produces a local read-only benchmark
receipt. There are no wallet, pool, blockchain, network, or GPU interfaces.

Energy, economic viability, search-space breakthroughs, and physical
quantum advantage all remain unproven.
