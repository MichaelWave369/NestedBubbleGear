# AH17 Preregistration Lineage

AH17 reached qualification only after two frozen candidates failed their stated gates.

## v0.1.0 — frozen harness failure

- result: **27/28 checks**
- failed check: `DOWNSTREAM_TO_ROUTE:share2_insufficient`
- preregistered expectation: `H(P2 | H3,E2)=0.125 bits`
- observed value: `0.25 bits`

The threshold architecture itself held: E1 alone was insufficient, E2 alone was insufficient, and E1+E2 was sufficient.

The frozen v0.1.0 core was not edited after execution.

## v0.1.1 — qualification failure

The corrected harness passed **28/28**, but the independent unit suite passed **12/13** because the ROUTE→GLOBAL E2 test was accidentally changed to expect 0.25 bits instead of its correct frozen value of 0.125 bits.

v0.1.1 was therefore **not qualified**.

## v0.1.2 — promoted qualified version

Only the mistaken bookkeeping expectations/version identifiers were corrected.

The split-authority construction itself was unchanged.

- harness: **28/28 PASS**
- unit tests: **13/13 PASS**
- replay exact
- frozen hashes unchanged

This lineage is retained intentionally. Failed preregistrations are evidence about the testing process and are not silently overwritten.
