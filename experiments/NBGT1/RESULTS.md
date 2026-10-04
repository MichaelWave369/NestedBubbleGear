# NBG-T1 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT1**

- Frozen invariant checks: **10/10 PASS**
- Unit tests: **10/10 PASS**
- Replay exact: **True**
- Counterfactual replay explicit and deterministic: **True**

## Temporal-lineage witness

At the frozen witness cutoff, History A and History B expose the same coarse Keyhole:

```json
{"macro":{"status":"READY"}}
```

but retain different latent lineage:

```text
History A -> route NORTH
History B -> route SOUTH
```

The same later admissible `PROBE_LATENT(route)` reveals the difference:

```text
A -> NORTH
B -> SOUTH
```

This is a temporal form of hidden causal residue: equality through the present coarse Keyhole does not imply equivalence of retained history under the allowed future interaction.

## Bitemporal evidence witness

History A contains a synthetic claim with:

```text
valid_time = 2
known_time = 4
```

The claim is absent from the replay at knowledge cutoff 2 and present at knowledge cutoff 4. Adding the later-known record does not mutate the earlier knowledge-cutoff replay.

## Counterfactual witness

Removing `A1_ROUTE` is permitted only through an explicit counterfactual receipt:

```text
mode = COUNTERFACTUAL
excluded_event_ids = ["A1_ROUTE"]
```

The later route probe then returns `UNKNOWN`. Counterfactual output remains separate from the observed ledger.

## Frozen artifact hashes

```text
result.json    0129cd7743b438b73559d469580a9fe241f5840ee6d37223b8ed44a3aea39d80
history_a.json 0c942955cc0232d8fa08c02aa52cdaa5610e16fdb4fb13530a31728a093fb54d
history_b.json 1f5c01d7d670d86eba6153970d9b6ed566dac6fcb5c7c406bae30bf676492a3c
```

## Claim boundary

NBG-T1 is a finite synthetic experiment. It demonstrates executable temporal/provenance semantics for the frozen toy histories only. It does **not** establish that a real historical claim is true, that temporal order proves causation, or that a counterfactual replay describes what actually would have happened.

## Next phase

NBG-T2 should freeze typed temporal-relation semantics before ingesting any dense real-world timeline graph.
