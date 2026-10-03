# NBG-AH24 v0.1.0 — Heterogeneous and Correlated Failure Regimes

AH23 found no frontier membership reversal under a common identical Keyhole failure probability.

AH24 relaxes that symmetry.

It compares three full-task policies:

- `P12 = {E1,E2}`
- `P23 = {E2,E3}`
- `P_BOTH = {P12,P23}`

The frozen regimes include independent heterogeneous failures and a matched-marginal correlated control.

Main targets:

1. show a genuine ranking reversal between `P12` and `P23` when the fragile Keyhole moves from E1 to E3;
2. show regime-dependent Pareto-frontier membership;
3. show that correlation can destroy most of the redundancy gain of `P_BOTH` even when all three one-Keyhole failure marginals are unchanged.

This is a finite reliability/access-structure toy model, not a deployed-system failure forecast.
