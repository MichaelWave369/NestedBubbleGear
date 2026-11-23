# COSMO-03 · Parity of Flat and Nested Information under Equal Keyholes

**Scope:** exact finite computational comparison, **SIMULATED / authority NONE**. Companion: [Altermath COSMO-03 protocol](https://github.com/MichaelWave369/Altermath/blob/main/docs/cosmo03.md) and [live R31 laboratory after deployment](https://michaelwave369.github.io/Altermath/#cosmo03).

## Scientific motivation

COSMO-01 found hidden predictive structure in a fixed synthetic binary graph, and COSMO-02 showed that a new *addressable container* could be created solely by moving existing source tokens. Neither demonstrated that adding a child container improves computation.

COSMO-03 explicitly tests the most important null hypothesis: **when flat and nested representations receive exactly the same data, neither gets to call extra information "emergence."**

## Registered model

The input is the same eight source bits (four in A, four in B), exhaustively enumerated under a uniform 256-state prior. A derived logical child C references one selected original A bit and one selected original B bit. Its target is the sum of their original values, 0, 1 or 2.

- **Flat representation:** 8-bit mask and two donor indices.
- **Nested representation:** parent state arrays plus child IDs, parent ancestry and donor references.
- **Compulsory Keyhole:** original parent counts of 1-valued bits.
- **Additional sensors:** exactly k original raw bits, k in {0,1,2}, identical for both representations.
- **Oracle:** exact conditional distribution using the exchangeability of original bits under each known parent total; no training labels.
- **Policies:** predeclared fixed A3/B0 positions, seeded random same-budget positions, privileged donor-aware positions.
- **Donor variation:** all 4×4 = 16 A/B donor geometries, including four predeclared structural challenge pairs.
- **Total:** 16 × 3 budgets × 3 sensor policies = 144 conditions; 36,864 exact input-state evaluations **per representation**.
- **Invariance:** within-parent index permutations must map state, semantic donors, and sensor identities together.

## What would count as a result?

1. **Flat/nested numerical equality:** a successful null showing that adding a nested description does not itself convey extra predictive information.
2. **Targeted sensors improve prediction:** a finding about knowing **which raw bits the target depends on**, not about superior nested representation.
3. **Nested JSON serialization uses more bytes:** descriptive metadata overhead only, not measured memory efficiency or runtime cost.
4. **A nonzero mismatch:** a bug, unfair observation, incorrectly applied permutation, or mathematically unexplained discrepancy until independently reconciled. It is not an emergent cosmic effect.

The benchmark independently cross-checks analytic posteriors against exact conditional frequency tables, preserves arbitrary input labelings through mapped permutations, and scores all conditions rather than picking only favorable examples. The four structurally reserved pairs are **not genuinely independent generalization evidence** because the generative law and posterior are pre-specified and no model is trained.

## The actual algebra

For a donor in a 4-bit parent with known count m, after observing n distinct bits with observed count s:

    p_donor = directly observed donor signal, OR (m-s)/(4-n) if unsensed.

For donor probabilities p and q in independent parents:

    P(C=0)=(1-p)(1-q)
    P(C=1)=p(1-q)+(1-p)q
    P(C=2)=pq

This is ordinary finite conditional probability, **not** thermodynamic, quantum, or gravitational entropy. More bits observed may reduce predictive uncertainty, but there is no source of physically new information.

## Mandatory promotion gates

- Exact equality with matched observation budgets across all 144 cases, with no hidden label leakage.
- Independent exact counting confirms the conditional oracle.
- k=0 sensor selection policies must coincide; donor-aware k=2 must recover the sum exactly.
- Full inclusion of zero and negative comparisons and all three registered seeds.
- Numerical invariance under properly mapped within-parent vertex relabeling.
- No insinuation of real-world learning, neural efficiency, AI intelligence, white holes, black-hole universe formation or a physical bulk.
- No PhiMemory9 write, PocketMesh routing authority or alterations to frozen prior research.

**Next rung:** COSMO-04 should move to a genuinely independent downstream task with learned candidates, true held-out evaluation, matched CPU/memory/observation budgets and a serious flat baseline. If nested structure loses or ties, publish that result.

**Separate physical P0 track:** only source-driven cosmological field equations and actual observational tests can address claims of physical branes, bounces or universe creation. COSMO-03 provides no evidence for them.
