# AH28 v0.1.0 Frozen Run — FAILED AS PREREGISTERED

**Verdict:** FAIL_AH28

- Acceptance checks: **22/23**
- Independent unit tests: **15/15 PASS**
- Failed check: `D_LIFETIME_RISK:states_exact`

Observed Panel D states:

- lifetime: `COMMON_MODE_EVIDENCE`
- recent: `INDEPENDENCE_COMPATIBLE`
- adaptive: `COMMON_MODE_EVIDENCE`
- arbitration: `LIFETIME_RISK_ONLY`

The v0.1.0 specification incorrectly preregistered Panel D adaptive state as `INDEPENDENCE_COMPATIBLE`.

The panel construction, classifier, arbitration rule, query contracts, and all other observed results are unchanged.
