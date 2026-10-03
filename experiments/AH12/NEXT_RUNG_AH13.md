# AH13 Candidate — Authorized Query Memory

AH12 makes memory explicitly query-family dependent.

The next rung should add **authority**.

## Core question

If a system is capable of answering many future queries, but an agent is authorized to ask only a subset, what memory must that agent retain?

Define:

[
\mathcal Q_{\rm capable}
]

as all queries the substrate could answer, and

[
\mathcal Q_{\rm authorized}
\subseteq
\mathcal Q_{\rm capable}
]

as the future query family permitted to a given actor.

Then compare:

[
R_{\mathcal Q_{\rm capable}}(\Gamma)
]

with

[
R_{\mathcal Q_{\rm authorized}}(\Gamma).
]

Candidate result:

- broader capability requires finer retained residue;
- restricted authority may justify a coarser memory;
- retaining unauthorized distinctions can itself become a governance/privacy question.

This would connect the NBG memory ladder directly to the PhiOS principle:

[
\boxed{\text{CAPABILITY} \neq \text{AUTHORITY}}
]

without changing the underlying mathematical substrate.
