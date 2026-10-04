# M2 Frozen Specification — Property-Based Generated Universes

## 1. Goal

Test structural properties beyond the hand-frozen AH examples.

Use deterministic generation with:

```text
MASTER_SEED = 369042
CASES_PER_PROPERTY = 250
```

Total:

\[
6\times250=1500
\]

generated property cases.

## 2. Counterexample discipline

Every case records:

- property id;
- case index;
- derived deterministic case seed;
- generated finite universe.

On failure, write a counterexample record containing:

- property id;
- case id;
- master seed;
- case seed;
- generated input;
- observed output;
- expected invariant.

Qualification requires zero counterexamples.

This does not claim exhaustive proof. It makes any discovered failure replayable.

## 3. P1 — Success/failure duality

Generate:

- element count \(n\in[3,6]\);
- a random nonempty family of candidate successful coalitions;
- reduce it to an inclusion-minimal antichain.

Compute:

1. minimal hitting sets of the minimal success family;
2. failure sets directly by checking whether every success coalition intersects the failed set;
3. inclusion-minimal direct failure sets.

Require exact equality.

Also require failure monotonicity:

\[
F\text{ destroys capability},\ F\subseteq F'
\Rightarrow
F'\text{ destroys capability}.
\]

## 4. P2 — Control-domain fusion monotonicity

Generate:

- 3–7 named principals;
- initially distinct root domains;
- one or more merge operations on root domains.

Require after each fusion:

\[
\#roots_{after}\le \#roots_{before}.
\]

Also generate one logical seat per principal and threshold \(k\in[1,n]\).

Let \(t\) be the minimum number of root domains whose principals collectively control at least \(k\) seats.

Require:

\[
t_{after}\le t_{before}.
\]

Interpretation: merging authority domains cannot create *more* independent domains and cannot increase the number of root domains needed to satisfy the same seat threshold.

## 5. P3 — Incomplete evidence refusal

Generate 3–7 principals and observed root evidence where at least one observation is missing.

Certification rule:

- complete + all distinct -> `CERTIFIED_INDEPENDENT`;
- complete + duplicates -> `SHARED_CONTROL_OBSERVED`;
- incomplete -> `INDEPENDENCE_UNVERIFIED`.

Require every incomplete case to return:

```text
INDEPENDENCE_UNVERIFIED
advertise_independence = false
```

regardless of hidden actual topology.

## 6. P4 — Event revocation does not certify topology

Generate certificate/event cases with:

- TTL in [0,5];
- issue epoch 0;
- event epoch in [0,5];
- event provenance trusted;
- revalidation epoch later than event epoch;
- arbitrary hidden topology change before/on/after event.

At the trusted event epoch, require:

```text
INDEPENDENCE_REVOKED_PENDING_REVALIDATION
```

and require the state is **not**:

```text
CERTIFIED_INDEPENDENT
SHARED_CONTROL_OBSERVED
```

until a separate revalidation step.

## 7. P5 — Coarsening cannot increase exact distinguishability

Generate finite state universes:

- 4–16 hidden states;
- target labels;
- fine observer descriptors;
- a deterministic many-to-one coarsening map.

Let:

\[
N_{fine}
\]

be the number of descriptor classes and:

\[
N_{coarse}
\]

the number after coarsening.

Require:

\[
N_{coarse}\le N_{fine}.
\]

Also define exact target reconstruction as every observer class containing one target label.

If the coarse observer exactly reconstructs the target, require the fine observer does too.

Equivalently:

\[
coarse\ exact
\Rightarrow
fine\ exact.
\]

## 8. P6 — Added distinctions cannot increase residual conditional entropy

Generate finite uniform state universes with:

- target variable \(Y\);
- coarse descriptor \(C\);
- refinement descriptor \(R=(C,D)\).

Compute Shannon conditional entropy exactly from finite counts.

Require:

\[
H(Y\mid R)\le H(Y\mid C)+10^{-12}.
\]

This is the finite data-processing/refinement direction used throughout the AH information-release branch.

## 9. Frozen generation ranges

All generators are bounded finite generators.

No network access.

No external randomness.

Use Python's `random.Random` with a case seed derived from:

```text
SHA256(master_seed | property_id | case_index)
```

taking the first 64 bits as an integer.

This makes every case stable across replay.

## 10. Qualification

Freeze before first execution:

- this SPEC;
- source;
- tests.

First execution must produce:

```text
PASS_M2
counterexamples = 0
cases = 1500
```

Qualification additionally requires:

- unit tests PASS;
- frozen hashes unchanged;
- second-run result bytes exactly equal first-run bytes;
- counterexample ledger exactly equal on replay.

## 11. Claim firewall

M2 does not establish universal proof over arbitrary systems.

A PASS means:

- no counterexample was found in the frozen deterministic generated suite;
- the six properties survived 1500 finite generated cases;
- discovered failures would be replayable.

M2 is stronger than hand-picked examples, weaker than formal proof.
