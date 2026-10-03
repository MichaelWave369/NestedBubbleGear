# NBG-AH31 v0.1.0 — Collusion Closure and Coalition Effective Authority

AH30 closed one actor's authority under deterministic derivation.

AH31 pools authorized releases across actors and then applies the same closure.

Frozen individually-safe roles:

- `HISTORIAN` → `Q_LIFETIME`
- `OPERATOR` → `Q_RECENT`
- `ADAPTIVE_CONTROLLER` → `Q_ADAPTIVE`
- `AUDITOR` → `Q_LIFETIME + Q_RECENT`

Every singleton role is individually unable to derive `Q_MULTI`.

But release pooling creates two minimal dangerous coalitions:

\[
\{\text{AUDITOR},\text{ADAPTIVE_CONTROLLER}\}
\]

and

\[
\{\text{HISTORIAN},\text{OPERATOR},\text{ADAPTIVE_CONTROLLER}\}.
\]

AH31 exhaustively enumerates all 16 actor coalitions, computes pooled direct releases, derivation closure, and conditional entropy of the multi-horizon target over the seven frozen panels.

It also proves a finite impossibility result: under unrestricted grand-coalition pooling, retaining at least one system-wide release of each of lifetime, recent, and adaptive evidence necessarily makes `Q_MULTI` derivable.

This is a finite collusion/authority toy model, not a cryptographic collusion-resistance theorem.
