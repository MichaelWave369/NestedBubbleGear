# NBG-BD02 · Model Mismatch, Registered Recovery, and Untouched Holdout

**Version:** 0.1.0. **Evidence:** SIMULATED. **Authority:** NONE. **No empirical physics or consciousness claim.**

## Research question

Can an observer detect when its original transition catalog fails to explain new observations, retain a registered alternative without pretending it had been present in the initial catalog, and freeze its predictions *before* observing reserved validation outcomes?

This rung extends BD-01 but does not alter its frozen tests or earlier NBG/AH/Temporal experiments.

## Predeclared finite world

There are exactly 64 six-bit signed ring input states. Each model applies one deterministic synchronous transition. The only observed output is the **sum of the six resulting signs**, not the full next state.

- Initial catalog: `RIGHT_PAIR`, `LEFT_PAIR`, `SHIFT_RIGHT`.
- Predeclared broader grammar: those three plus `TRIPLE_PRODUCT`, `MAJORITY_THREE`.
- Hostile outside-grammar oracle: `ALL_NEGATIVE`, which always returns six negative signs.

`RIGHT_PAIR`: next sign at i = s_i*s_(i+1).
`LEFT_PAIR`: next sign at i = s_(i-1)*s_i.
`SHIFT_RIGHT`: next sign at i = s_(i+1).
`TRIPLE_PRODUCT`: next sign at i = s_(i-1)*s_i*s_(i+1).
`MAJORITY_THREE`: majority sign of s_(i-1),s_i,s_(i+1).

Important identifiability witness: right-pair and left-pair yield the **same next-step sum for all 64 inputs** despite differing in some full next states. No sequence of sum-only queries can uniquely identify which one generated a result. The correct status is `TASK_EQUIVALENT_MODELS_UNIDENTIFIED`, not a forced winner.

## Frozen split

`TRAIN_STATES = {s in [0,63] : s mod 4 != 0}` (48 cases).

`HOLDOUT_STATES = {s in [0,63] : s mod 4 == 0}` (16 cases).

The rule is pinned before any simulation. This is a deliberately tiny, structural held-out partition, **not an independent empirical sample**. The planner can examine registered-model predictions on training inputs only. It cannot see heldout oracle labels until a candidate is frozen. No tuning or recovery from a holdout score is permitted.

## Training and probe selection

Each query selects one train-state input and observes its next-step *sum* from a synthetic oracle. For the `ADAPTIVE` policy, the query maximizes Shannon entropy of predicted answers under a **uniform prior over the currently viable registered grammar**. When entropy ties, choose maximal Hamming novelty relative to previous queries and then lowest state ID. If only one model remains, diversity probes are still used to look for catalog mismatch. Unlike a blind open-world learner, the policy is allowed to use the predeclared grammar's predictions to decide useful questions. This is explicit.

The `FIXED` control requests increasing train-state IDs at the same budget. Each query, model update and prediction is deterministic, with no oracle-model label given to the selection function.

After each observed response, independently filter the initial catalog and the registered grammar. Record the first step where the initial catalog is contradicted. Do not declare recovery unless a registered grammar model remains consistent and all other distinguishable candidates have been eliminated.

## Decision states

- `NO_BUDGET`: no queries, no trained candidate, no holdout.
- `OUTSIDE_REGISTERED_GRAMMAR`: no registered model remains consistent; refuse predictions.
- `RECOVERED_REGISTERED_CANDIDATE`: initial catalog contradicted and exactly one broader-grammar model survives.
- `IN_INITIAL_CATALOG`: one initial-catalog model survives.
- `TASK_EQUIVALENT_MODELS_UNIDENTIFIED`: multiple models survive, but their target observable is identical on all 64 states. Freeze only the task prediction, **not the mechanism identity**.
- `UNRESOLVED_MODEL_AMBIGUITY`: surviving models disagree on the task and must not be presented as uniquely identified.

## Holdout scoring

Only a frozen task prediction may be evaluated. After freeze, run predictions across the sixteen previously untouched holdout inputs and reveal the synthetic oracle labels **for scoring only**.

Report exact accuracy, mean absolute error, and raw per-case predictions. Also score two separate conventional baselines using the same holdout inputs: fixed `RIGHT_PAIR` and the mode of *training-only observed* next sums. A separate `FIXED` planner uses the identical budget and split.

No result establishes superiority over general-purpose Bayesian experimental design or other advanced baselines. Exact zero holdout loss in this finite designed family does not establish generalization to different dynamics or real devices.

## Tests and reproduction

    npm run test:bd02
    npm test
    npm run build
    npm run dev

Open **Recovery → Model Mismatch · BD-02** on the NBG GitHub Pages site, after a successful merge/deployment. Export a JSON evidence receipt containing choices, responses, catalog contradictions, frozen decision, holdout rows, and comparison.

## Claim boundary and next experiment

This is bounded *registered hypothesis expansion*, not unconstrained invention of a new physical mechanism or a scientific discovery about the actual universe. BD-03 should investigate compositional rule synthesis with length or complexity penalties, unbiased external task families, and registered non-oracle baselines; it must preserve unidentifiable and failed-recovery cases.
