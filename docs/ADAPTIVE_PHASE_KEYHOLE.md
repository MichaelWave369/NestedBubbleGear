# NBG Adaptive Phase Keyhole · PR #101 experiment note

This is a deterministic educational model built on the matched elliptical pitch curves of the existing Spiral Gear and Phase & Closure laboratories. The UI does **not** claim novel experimental validation.

## Frozen declared hypothesis catalog

Possible eccentricities: 0, 0.08, 0.16, 0.24, 0.32, 0.40, 0.48, 0.55. The user selects one as the **simulated oracle**. Only catalog identification is supported. The procedure does not estimate an arbitrary real eccentricity or draw conclusions about hardware.

Observation at a chosen driver angle α in degrees uses the ideal focus-mounted elliptical phase formula

    β_e(α) = -2 atan2(((1-e)/(1+e))*sin(α/2), cos(α/2))

and a deterministic rounded reading:

    bucket = round(β_e(α) in degrees / resolutionDegrees)

Available resolution values (degrees): 4, 8, 12, 16, 20, 24, 30. This models digital rounding and does **not** model calibrated physical sensor errors or stochastic noise.

## Adaptive selection vs the fixed baseline

For every allowed unused probe angle, partition surviving hypothesis IDs by predicted bucket. Score each angle lexicographically by:

1. Minimize largest resulting bucket (worst-case candidate count).
2. Minimize sum of squared bucket sizes (lower expected remaining count under an *unasserted* uniform prior).
3. Prefer angle nearer 90°, then smaller angle for deterministic tie-breaking.

The choice depends exclusively on the *current candidate set*, independent of which candidate is the oracle. After selecting an angle, the simulated oracle produces the bucket and the candidates inconsistent with it are eliminated. Thus **one-step greedy minimax** is provable from enumeration, but no claim of globally minimum probe count is made.

The explicitly labeled fixed baseline starts at 180° (known blind probe), then 90°, 45°, etc. Comparing against this deliberately weak baseline is useful for exposing wasted measurements; it does not establish universal superiority over every fixed policy. Both methods have the same query budget and quantization.

## Controls, conditions, and epistemic boundary

- For every declared eccentricity, an input half-turn returns output -180°, so 180° cannot split the catalog.
- All declared gear pairs produce output -360° after one full input revolution. Identical endpoints do not determine the intermediate trajectory.
- Every selected reading keeps the oracle hypothesis in the posterior; the candidate set can only shrink.
- If the budget is used before singleton identification, label QUERY_BUDGET_EXHAUSTED.
- If no available adaptive angle can split the remaining candidates, label NO_SPLITTING_PROBE_AT_RESOLUTION instead of inventing a discrimination.
- Export reproducible SIMULATED / DEMONSTRATION_ONLY receipts with the catalog, quantization, exact angle selection, partitions, observed buckets, and alternative baseline. No approval or promotion of frozen AH evidence is implied.
- Revealing the oracle identity in the demo is a *user-selected simulation setting*. The selection algorithm cannot access this value until a reading is requested.

Architecture bridge: shares the explicit observer / restricted query idea with adaptiveKeyholeSynthesis.js, but does not reuse that engine's different governed history/query language or its qualified outputs.

Checks: npm run test:adaptive-phase; npm test; npm run build.
