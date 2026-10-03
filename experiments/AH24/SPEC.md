# AH24 Frozen Specification

## 1. Purpose

AH24 asks whether coalition identity matters once Keyholes face different or correlated hazards.

AH23 used one common independent failure probability:

\[
p_1=p_2=p_3=p.
\]

AH24 replaces that with named finite regimes.

## 2. Frozen authority topology

Reuse the full-task AH19/AH20 capability topology:

Minimal capable coalitions:

\[
P_{12}=\{E_1,E_2\},
\]

\[
P_{23}=\{E_2,E_3\}.
\]

The dual-path policy is:

\[
P_{\rm BOTH}
=
\{P_{12},P_{23}\}.
\]

For full tasks, \(E_2\) remains mandatory.

## 3. Policy coordinates

Freeze advisory policy coordinates:

| Policy | Added cost | Policy-induced singleton cuts |
|---|---:|---:|
| P12 | 0 | 1 |
| P23 | 0 | 1 |
| P_BOTH | 1 | 0 |

The single-pair policies have equal declared cost and equal fragility count, so heterogeneous reliability can directly determine which one dominates.

## 4. Independent regimes

For independent Keyhole failures, freeze:

### BALANCED

\[
(p_1,p_2,p_3)=(0.10,0.10,0.10).
\]

Expected:

\[
R(P_{12})=0.81,
\]

\[
R(P_{23})=0.81,
\]

\[
R(P_{\rm BOTH})=0.891.
\]

### E1_FRAGILE

\[
(0.30,0.10,0.05).
\]

Expected:

\[
R(P_{12})=0.63,
\]

\[
R(P_{23})=0.855,
\]

\[
R(P_{\rm BOTH})=0.8865.
\]

Therefore:

\[
P_{23}>P_{12}.
\]

### E3_FRAGILE

\[
(0.05,0.10,0.30).
\]

Expected:

\[
R(P_{12})=0.855,
\]

\[
R(P_{23})=0.63,
\]

\[
R(P_{\rm BOTH})=0.8865.
\]

Therefore:

\[
P_{12}>P_{23}.
\]

This is the frozen ranking reversal.

### E2_FRAGILE

\[
(0.05,0.30,0.05).
\]

Expected:

\[
R(P_{12})=R(P_{23})=0.665,
\]

\[
R(P_{\rm BOTH})=0.69825.
\]

Because \(E_2\) is mandatory, redundancy on the two outer Keyholes cannot remove the central hazard.

## 5. Matched-marginal correlation control

Construct two regimes with identical one-Keyhole failure marginals:

\[
(p_1,p_2,p_3)=(0.24,0.10,0.24).
\]

### EDGE_MATCHED_INDEP

Indepent failures.

Expected:

\[
R(P_{12})=R(P_{23})=0.684,
\]

\[
R(P_{\rm BOTH})=0.84816.
\]

### EDGE_COMMON_CAUSE

Generate a shared edge-failure mode:

- with probability
  \[
  c=0.20,
  \]
  both \(E_1\) and \(E_3\) fail together;
- otherwise, each edge independently fails with
  \[
  q=0.05;
  \]
- \(E_2\) independently fails with
  \[
  p_2=0.10.
  \]

This produces exactly the same marginals:

\[
P(E_1\text{ fails})=0.24,
\]

\[
P(E_2\text{ fails})=0.10,
\]

\[
P(E_3\text{ fails})=0.24.
\]

Expected:

\[
R(P_{12})=R(P_{23})=0.684,
\]

unchanged because each single path depends only on its component marginals.

But:

\[
R(P_{\rm BOTH})=0.7182.
\]

## 6. Correlation penalty

Define dual-path redundancy gain:

\[
G
=
R(P_{\rm BOTH})
-
\max(R(P_{12}),R(P_{23})).
\]

Matched independent regime:

\[
G_{\rm indep}
=
0.84816-0.684
=
0.16416.
\]

Correlated regime:

\[
G_{\rm corr}
=
0.7182-0.684
=
0.0342.
\]

Correlation penalty:

\[
\Delta G
=
0.12996.
\]

So identical component marginals do not imply identical redundancy value.

## 7. Regime-specific Pareto frontier

Use three objectives:

1. minimize declared policy cost;
2. minimize policy-induced singleton cut count;
3. maximize reliability in the named regime.

Expected frontier membership:

| Regime | Frontier |
|---|---|
| BALANCED | P12, P23, P_BOTH |
| E1_FRAGILE | P23, P_BOTH |
| E3_FRAGILE | P12, P_BOTH |
| E2_FRAGILE | P12, P23, P_BOTH |
| EDGE_MATCHED_INDEP | P12, P23, P_BOTH |
| EDGE_COMMON_CAUSE | P12, P23, P_BOTH |

Thus frontier membership reverses between E1_FRAGILE and E3_FRAGILE.

## 8. Robust cross-regime metrics

Across all six frozen regimes:

\[
R_{\min}(P_{12})=0.63,
\]

\[
R_{\min}(P_{23})=0.63,
\]

\[
R_{\min}(P_{\rm BOTH})=0.69825.
\]

Regret is measured relative to \(P_{\rm BOTH}\) within each regime.

Expected maximum regret:

\[
G_{\max}(P_{12})=0.2565,
\]

\[
G_{\max}(P_{23})=0.2565,
\]

\[
G_{\max}(P_{\rm BOTH})=0.
\]

The two single-path policies remain symmetric under the full regime set even though they exchange rank within specific regimes.

## 9. Interpretation

AH24 supports:

\[
\boxed{
\text{coalition identity matters under heterogeneous hazards}
}
\]

and:

\[
\boxed{
\text{same component marginals}
\not\Rightarrow
\text{same redundancy value}
}
\]

when failures are correlated.

## 10. Claim firewall

AH24 does not establish:

- real Keyhole failure probabilities;
- deployed-system common-cause rates;
- actual organizational reliability;
- safety-critical redundancy guarantees;
- a preferred policy.

It proves only finite reliability, ranking, Pareto-membership, and matched-marginal correlation facts for the frozen toy regimes.
