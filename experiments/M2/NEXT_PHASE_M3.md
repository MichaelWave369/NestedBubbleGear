# M3 Candidate — Mutation Testing the Governance Harnesses

M2 subjects structural claims to 1500 deterministic generated finite universes.

M3 should deliberately break the implementations and confirm the tests notice.

Candidate mutations:

1. change hitting-set intersection to subset logic;
2. allow incomplete evidence to certify independence;
3. let untrusted change events revoke authority;
4. let trusted change events directly certify `SHARED_CONTROL_OBSERVED`;
5. reverse the entropy monotonicity comparison;
6. accidentally treat a coarsening map as an injective refinement;
7. lower/raise quorum thresholds;
8. leak a panel-dependent field in a refusal or mediated receipt.

For each mutant:

- run the relevant targeted property/test subset;
- require at least one test/property failure;
- record killed/survived status;
- treat any surviving mutant as a weakness in the qualification harness.

Core metric:

[
mutation\ score
=
\frac{killed\ mutants}{total\ non-equivalent\ mutants}.
]
