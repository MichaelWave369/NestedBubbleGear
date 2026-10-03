# AH23 Candidate — Robust Pareto Frontiers Under Uncertain Failure Models

AH22 freezes one diagnostic failure probability, `p=0.1`.

AH23 should stop assuming the decision-maker knows the correct failure model.

Candidate directions:

- evaluate each policy over a declared interval, for example `p in [0.05,0.30]`;
- compare worst-case reliability and regret;
- identify policies that are Pareto-optimal across multiple failure regimes;
- distinguish a policy that is cheap at one operating point from one that is robust across a range;
- keep governance cost and hard denies explicit rather than hiding them in a scalar utility.

This would turn AH22's static Pareto frontier into a finite robust-decision surface without claiming a real deployment failure distribution.
