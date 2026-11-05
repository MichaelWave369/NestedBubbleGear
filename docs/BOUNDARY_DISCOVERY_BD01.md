# BD-01 · Boundary Discovery

**Status:** exact finite simulation; uncalibrated synthetic observer. **Authority: NONE**.

## Core research question

Can an observer whose present Keyhole aliases behaviorally distinct states select a permitted diagnostic probe, use its result to refine its predictive cohort, and honestly refuse when prediction is not warranted?

BD-01 is a deliberately small extension of NBG-G1/G2, Unknown Gear, and the Scientific Discovery Loop. It does **not** edit frozen AH, G1/G2, Temporal NBG, or Altermath results. No new physical law, cosmic prison, planet-specific phenomenon, consciousness, or spiritual mechanism is asserted.

## Fixed world and observables

World: six signed binary sites arranged on a ring, 64 full states, with synchronous deterministic update

    s_i(t+1) = s_i(t) * s_{i+1}(t), with index modulo six.

The initial Keyhole exposes only `M(t) = sum_i s_i(t)`. The task is to predict `M(t+h)`, for h=1 or h=2. The cohort is **uniform** over all exact states with the same initial sum. This is a fictional model prior, not an estimated real-world distribution.

At `M(t)=0`, there are exactly 20 compatible states. Under one update, the exact outcome count is:

| Future sum | Number of compatible states |
| --- | ---: |
| -6 | 2 |
| -2 | 12 |
| +2 | 6 |

Thus the best sum-only 0–1 classifier has error 8/20 = 0.4. Counting sign changes around the ring (BOUNDARY_COUNT) provides the next sum exactly through `M(t+1)=6-2*BOUNDARY_COUNT`.

## Probe catalog, costs and permissions

- `BOUNDARY_COUNT`: entire ring's adjacent sign changes, synthetic cost 3.
- `ODD_SUM`: sites 1,3,5 summed, cost 1.
- `EDGE_i`: neighboring site product, cost 1 each.
- `SITE_i`: a single site value, cost 1 each.

Profiles are `ALL`, `LOCAL` (no full boundary count), `SITES`, and `BLIND` (none). Costs are invented abstract credits, not runtime, electricity, money, or sensor accuracy.

## Planning contract

For the current compatible cohort, the planner groups possible states by each authorized, unspent, affordable probe response. It computes the **expected 0–1 Bayes risk after that probe**, using the uniform finite cohort and the declared target horizon. It chooses the largest positive **risk reduction per cost**; ties use raw improvement, lower cost, then deterministic probe ID. It consumes the selected probe's actual response only **after** deciding which probe to ask. The true state is used only by the simulated response generator and post-run verification.

The planner is **greedy**, not an optimal multistep experiment solver. The outcome statuses are:

- `TASK_RESOLVED`: all remaining states predict the same target future sum.
- `BUDGET_EXHAUSTED`: insufficient available credits for a useful next probe, though the library can theoretically resolve the task.
- `UNOBSERVABLE_LIBRARY`: even the full remaining authorized library fails to distinguish the target outcome for some states.
- `GREEDY_STALLED`: a collection of probes might suffice, but **no individual affordable probe has a positive immediate reduction**. This is not proof of impossibility.

The original probe-planning cohort is not seeded with the true state other than through the coarse observed sum. A fully disclosed synthetic state appears in the UI as *researcher-only oracle ground truth*, not as knowledge given to the planner. Receipt exports include complete inputs, planned gains, observed probe results, feasible sets, refusal reason, and oracle verification for auditing.

## Falsification controls

1. Enumerate all 64 states and verify the exact 20-state zero-sum bucket and `2/12/6` outcome census.
2. Verify the synchronous transition rule and next-total/boundary-count identity for all 64 states.
3. For every state in the zero-sum bucket, `ALL` with budget 3 must choose BOUNDARY_COUNT *before* seeing its response and correctly predict the one-step sum.
4. `BLIND` must refuse; zero budget must refuse without pretending to observe.
5. `SITES` may stall greedily even though the full site library is sufficient. It must not claim an unobservable world.
6. Exhibit states with equal initial and first-step sums but different second-step sums; one-step sufficiency is task-relative.
7. Invalid states, probe IDs, horizons, permissions, or costs must fail closed.
8. Identical options produce an identical evidence receipt.

## How to run

    npm run test:bd01
    npm test
    npm run build
    npm run dev

In the live site, open `#boundary-discovery` in the **Geometry** menu. Export the JSON evidence receipt for a replayable result.

## Claim firewall and future work

This experiment proves only finite mathematical properties of an intentionally designed world. The planner is told the exact transition rule and finite probe catalog. Its success here is **not** open-world discovery, generalization to unseen dynamics, calibration, sensor authentication, or empirical evidence of a new physical dimension. No independent validation dataset is scored.

BD-02 should freeze a genuine train/holdout separation, inject a model mismatch with an unlisted transition rule, compare the greedy planner against exact dynamic-programming/Bayesian alternatives under matched budgets, and preserve negative or unidentifiable outcomes. A subsequent optional Altermath adapter should invoke the existing permission-aware junction contract without importing authority from route advice.
