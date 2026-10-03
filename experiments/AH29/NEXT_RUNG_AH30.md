# AH30 Candidate — Derivation Closure and Authority-Safe Release Synthesis

AH29 finds an important negative result:

A role can be denied `Q_MULTI` at the interface while still reconstructing the multi-horizon answer from authorized single-horizon releases.

AH30 should make derivability part of the authority model.

## Candidate definitions

Let:

\[
\mathcal R(role)
\]

be the set of directly authorized releases.

Define derivation closure:

\[
\operatorname{Cl}(\mathcal R)
\]

as every frozen query answer deterministically recoverable from those releases.

Then define effective authority:

\[
\mathcal A_{\rm eff}(role)
=
\operatorname{Cl}(\mathcal R(role)).
\]

Questions:

1. When does direct authority differ from effective authority?
2. Can a desired deny set be made information-theoretically enforceable by removing the smallest authorized release?
3. For `TRI_HORIZON_ANALYST`, which single horizon must be withheld to make `Q_MULTI` non-derivable?
4. Can the least damaging authority reduction be synthesized under a declared task requirement?
5. Can receipts report both direct grants and derived effective grants?

Core principle:

\[
\text{authority must be closed under derivation}.
\]

That would turn AH29's negative result into a finite authority-hardening problem.
