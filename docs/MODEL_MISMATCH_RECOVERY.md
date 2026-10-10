# NBG Model Mismatch & Recovery · protocol proposal (PR #103)

This extension is a **simulation** of how a cautious observer might recover
from a declared hypothesis catalog that does not fit its observations.

## Explicit approval boundary

The recovery process is never authorized to add a hypothesis to the frozen NBG
experimental record, to change the existing closed-world catalog, to approve a
model as physical truth, or to use held-out samples for fitting.

It only runs after Unknown Gear Lab returns
NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS with intact bounded-noise assumptions.
Known profiles, unresolved sets, and malformed error bounds do not authorize
a "recovery" attempt. Every proposed recovery candidate is QUARANTINED.

## Phase 1 · Rejected parent and sealed training

Keep a frozen copy of the original Unknown Gear Lab's ordered probe angles,
quantized observations, and candidate-elimination receipts. Use its existing
bounded-error assumption:

    |predicted phase - observed phase| <= declaredNoiseBound + resolution/2

The original observation system uses seeded, synthetic, bounded jitter and
deterministic angle quantization. There is NO empirical sensor calibration.

## Phase 2 · Quarantined hypothesis generation

Use only a **predeclared grid**, not knowledge of the synthetic oracle, to propose
new ellipse eccentricities. Three demo grids are FINE (0.56..0.90, step 0.02),
COARSE (0.56, 0.64, 0.72, 0.80, 0.88), and EXCLUDES_TRUTH
(0.56, 0.58, 0.60, 0.62).

Reject any candidate inconsistent with even one training observation.
Among compatible candidates choose the minimum total absolute residual,
tie-breaking by lowest eccentricity. Freeze this choice and its training
predictions *before* any reserved measurement is generated.

If no grid hypothesis is admissible, report NO_TRAINING_COMPATIBLE_PROPOSAL.
Do not silently expand the grid after learning the outcome.

## Phase 3 · Untouched holdout

Reserve 2-5 new angles distinct from all training angles. Select those angles
by sensitivity of the **frozen** candidate to eccentricity perturbations.
These angles are not used to rank, select, or adjust proposals.

Produce a fresh deterministic synthetic reading at each reserved angle,
using separate noise ordinals. Test against the **same declared error bound**.
If any holdout contradicts the candidate, label HOLDOUT_REFUTED.
If all agree, label HOLDOUT_COMPATIBLE_UNVERIFIED. The latter is not
verification of the model in nature, even for a perfect simulated fit.

An optional holdout-only +0.14 eccentricity intervention stress-tests
stationarity. It does not retroactively prove the original training model
incorrect, but it should refute its generalization to the shifted regime.

## Replay and negative controls

- Default unknown e=0.72 is rejected by the original catalog and can be
  recovered by the FINE grid under the bounded simulation.
- Known e=0.32 is refused at the recovery gate. The near-catalog e=0.29
control may be rejected by the original observer at the selected quantization,
but the fixed new proposal family starts at e=0.56. It therefore yields
NO_TRAINING_COMPATIBLE_PROPOSAL rather than authorizing a forced fit.
- Invalid noise assumptions are refused before proposal generation.
- A deliberately inadequate proposal grid reports NO_TRAINING_COMPATIBLE_PROPOSAL.
- Changing only the holdout regime must not alter the frozen training candidate.
- Export receipts record the original rejection, catalog, fixed proposal grid,
  ranked survivors, quarantined candidate, holdout angles/results, refusal gates,
  assumptions and immutable simulated provenance. No signature/endorsement
  or post-hoc scientific promotion is provided.

To qualify the demo: run npm run test:model-recovery, npm test, npm run build.
