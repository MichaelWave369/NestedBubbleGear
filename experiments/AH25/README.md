# NBG-AH25 v0.1.0 — Failure-Domain Discovery and Redundancy Auditing

AH24 declared hidden common-cause structure. AH25 asks whether observed binary failure traces contain enough evidence to discover it.

The frozen auditor compares marginal failure rates with the joint co-failure structure of E1 and E3, reports mutual information and a Pearson chi-square statistic, and returns one of four evidence states:

- INDEPENDENCE_COMPATIBLE
- COMMON_MODE_EVIDENCE
- DEPENDENCE_OTHER_DIRECTION
- INSUFFICIENT_EVIDENCE

Three large matched-marginal controls all have p(E1)=p(E3)=0.24, yet their joint failure domains and redundancy values differ sharply. A small ambiguous sample is required to refuse rather than overclaim.

The same joint trace estimates dual-path reliability and reproduces AH24's 0.84816 independent versus 0.71820 common-cause result.

This is a synthetic finite audit model. It does not prove independence, causal direction, or deployed-system reliability.
