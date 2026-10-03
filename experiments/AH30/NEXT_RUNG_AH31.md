# AH31 Candidate — Collusion Closure and Coalition Effective Authority

AH30 closes one actor's authority under deterministic derivation.

AH31 should pool releases across actor coalitions:

[
\mathcal R(C)=\bigcup_{a\in C}\mathcal R(a)
]

and define:

[
\mathcal A_{eff}(C)=Cl(\mathcal R(C)).
]

Questions:

1. Can individually least-privileged roles jointly derive a denied `Q_MULTI`?
2. What are the minimal colluding coalitions whose pooled releases close to `Q_MULTI`?
3. Does per-actor-safe policy fail under release pooling?
4. Can the smallest changes that block coalition derivation be synthesized?
5. How does this reconnect to AH19 access structures and AH20 cut sets?

Core principle:

```text
authority must account for derivation after coalition pooling
```
