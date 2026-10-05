# NBG-CW1 Protocol — Cosmic-Web Keyhole Closure

**Protocol status:** candidate, pre-result  
**Track:** NBG-CW  
**Primary purpose:** define a falsifiable test before inspecting outcome labels.

## 1. Research question

Let (X_t) be a latent cosmic-web state and (F_{Delta t}) an admissible evolution operator.

For observer (O_i), define present observational equivalence between two states (X_t^A) and (X_t^B) by

[
D_i(O_i(X_t^A), O_i(X_t^B)) le epsilon_i.
]

A closure failure occurs when the pair is equivalent now but separates after evolution:

[
D_i(O_i(F_{Delta t}(X_t^A)), O_i(F_{Delta t}(X_t^B))) > 	au_i.
]

CW1 asks which observer level is the minimum refinement that makes such failures sufficiently rare or predictable under frozen evaluation rules.

## 2. What CW1 does not claim

CW1 does not claim that:

- cosmic filaments are literal NBG gears;
- dark matter has been directly imaged in Ly-alpha emission;
- one observed redshift slice is the temporal descendant of another unrelated observed system;
- NBG explains cosmic-web formation;
- visual similarity is evidence of a physical theory.

## 3. Temporal lineage rule

Observed systems at different redshifts are population samples, not automatically the same evolving object.

For a temporal closure test, lineage must come from an explicit simulation mapping or equivalent provenance:

[
X_t ightarrow X_{t+Delta t}.
]

Pairing, feature construction and thresholds must not use descendant information.

## 4. Frozen observer family

The observer ladder is defined in [OBSERVER_LADDER.md](OBSERVER_LADDER.md).

Every run must record:

- observer identifier and version;
- feature list;
- normalization;
- distance function (D_i);
- present-match threshold (epsilon_i);
- future-separation threshold (	au_i);
- time step or snapshot interval;
- lineage provenance;
- baseline family;
- random seed where applicable.

## 5. Pair construction

Candidate pairs are formed only from states at the same evaluation epoch/snapshot family.

A valid pair must:

1. satisfy the frozen present-equivalence condition for the tested observer;
2. be drawn without access to future outcomes;
3. not duplicate the same physical lineage under trivial transforms;
4. retain both latent-state identifiers for later audit;
5. satisfy any train/validation/test partition rule before matching.

Nearest-neighbor matching may be used only after the feature space and metric are frozen.

## 6. Primary outcome

For each observer (O_i), report:

- number of eligible states;
- number of matched present-equivalent pairs;
- fraction with future divergence;
- uncertainty interval for that fraction;
- predictive performance for future divergence where modeled;
- calibration;
- complexity/cost of the observer representation.

No single pair is sufficient for promotion.

## 7. Refinement test

If (O_i) fails closure, test a predeclared richer observer (O_j).

A useful refinement must reduce unexplained future divergence without descendant leakage.

The central NBG quantity is operationally:

[
Delta C_{iightarrow j}
=
C(O_i)-C(O_j),
]

where (C) is a frozen closure-failure rate or equivalent predictive loss.

A positive (Delta C) is not automatically evidence for NBG; it must also beat the non-NBG baselines in Section 8.

## 8. Required baselines

CW1 must compare against at least:

1. coarse scalar/environment summaries;
2. ordinary graph/connectivity features;
3. image/morphology features where Ly-alpha maps are used;
4. a topology-aware baseline such as persistent-homology features when practical;
5. a capacity-matched learned baseline if machine learning is introduced.

The comparison must control, as far as practical, for parameter count, feature dimension or description length.

## 9. Promotion rule

An NBG interface-aware observer may be promoted only if all of the following hold:

- present matching was performed without future leakage;
- future divergence is reproducible on held-out lineages or volumes;
- the improvement survives a frozen negative control;
- the improvement is not explained by a simpler baseline of comparable complexity;
- the result survives reasonable perturbation of (epsilon_i) and (	au_i);
- the receipt records all transformations needed for replay.

A successful result promotes only the tested observer claim. It does not promote cosmological or fundamental-physics claims.

## 10. Negative outcomes

CW1 is considered informative, not failed as a research program, if:

- coarse observers are already closed enough;
- persistent homology or ordinary graph features equal/exceed NBG;
- interface features add no held-out predictive value;
- apparent gains vanish after leakage controls;
- results depend pathologically on threshold choice.

Those outcomes constrain NBG rather than being discarded.

## 11. Controls

CW2 should instantiate, at minimum:

- **positive control:** hidden internal state is constructed to affect future transport while remaining initially invisible;
- **negative control:** hidden internal state differs but is causally inert for the tested future;
- **observer leakage control:** a feature containing descendant information must be detected/rejected;
- **lineage shuffle control:** destroying true temporal correspondence should destroy temporal closure signal.

## 12. Receipt minimum

Every experimental receipt must include:

- protocol version;
- source dataset/simulation and version;
- snapshot identifiers;
- pair identifiers;
- observer version;
- feature hashes;
- thresholds;
- split definition;
- code commit;
- seeds;
- outputs;
- baseline outputs;
- promotion decision;
- claim-scope statement.

## 13. Stopping discipline

Do not change observers, thresholds or promotion criteria after inspecting the held-out test outcome without issuing a new protocol version.

Human beings have invented many elegant ways to call post-hoc tuning “discovery.” CW1 declines the tradition.
