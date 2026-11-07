# POLY-01 · Polyhedral Keyhole research ledger

**NBG classification:** design hypothesis + reproducible finite simulation; **authority NONE**.
**Reference implementation:** [Altermath R24 PR #26](https://github.com/MichaelWave369/Altermath/pull/26) (unmerged at creation).
**Research owner:** NestedBubbleGear; experiment UI and runnable tests: Altermath; adapter evaluation: NBGPocketMesh (not yet implemented).

## Motivation

Take the useful, testable part of a traditional 4/8/12 Platonic-solids image without importing unverifiable claims about "realms." Treat every face of a polyhedron as a **bounded face-pocket**, and treat face-to-face adjacency as an interface topology. Ask the normal NBG question: does the current Keyhole identify a state sufficiently to forecast what that Keyhole will see next?

The 3/6/9 symbolic architecture is retained as an **optional research-workflow organizing convention**, not a physical premise or a theorem. The 4/8/12 counts are chosen polyhedron face counts. Their numerical proportionality does not establish a connection to physical dimensions, cosmic geography, consciousness, E8, or higher-dimensional beings.

## Canonical experiment and observation

| Source polyhedron | Pocket count | Dual graph representing face adjacency | Vertex degree |
|---|---:|---|---:|
| Tetrahedron | 4 | K4 | 3 |
| Octahedron | 8 | cube | 3 |
| Dodecahedron | 12 | icosahedron | 5 |

The full binary state is \(X \in \{-1,+1\}^n\); the observer sees only its aggregate \(M=\sum_i X_i\).
A synchronous deterministic update at vertex \(i\) is \(X'_i=\operatorname{sign}(\sum_{j \in N(i)}X_j)\); the observed future is \(Y=\sum_i X'_i\). Every vertex degree is odd; ties cannot occur.

Under **uniform enumeration of all 2^n initial states**, compute \(H(Y\mid M)\) by exact counting. A Keyhole collision is a pair \(X_a, X_b\) with \(M(X_a)=M(X_b)\) and \(Y(X_a)\ne Y(X_b)\).

Fixed reference results are 0 bits for 4 pockets, 0.47437549538726076 bits for 8 pockets, and 1.4487438178946757 bits for 12 pockets. These are properties of the **specific graph, state prior, and update rule**, not universal polyhedral constants.

## Evidence and adversarial design

**Current evidence:** finite numerical enumeration and tests in the Altermath R24 proposed implementation. No physical experiments, no observed energy effect, no learned neural routing, no measured user benefit, and no model-inference performance result.

**Controls in first rung:** same-size, same-degree, connected random degree-preserving rewires from explicit seeds; fixed masks; falsifiable census; exportable full records. For 4-node 3-regular K4, no distinct graph of equal degree exists. Across 4/8/12 counts, node count and topology are confounded; do not report a geometry-only causal effect.

**Mandatory gates for inference:**
1. Independent auditor reproduces adjacency, counts and entropy without relying on rendered UI or copying the same calculation.
2. Equal-size / equal-degree baselines are scored with multiple predeclared update laws, priors, graph ensembles, and negative controls; report counterexamples and null outcomes.
3. Identify actual operational tasks where hidden pocket state improves a held-out forecast beyond simple aggregates and ordinary graph features. Report bytes, latency, error, calibration and compute cost.
4. Require safe, policy-preserving cross-repo interfaces before any production route decision. The experimental topology cannot grant an authorization capability, modify PhiKernel policy, or claim identity/provenance.

## Optional future NBGPocketMesh interface (not implemented)

An adapter may eventually consume a versioned **read-only research snapshot** containing:
- protocol, model/graph version, source repo commit SHA, and seed;
- graph face labels and undirected edge list, all canonicalized;
- full pocket-state hash (not raw private data), observed aggregate, declared update rule, and expected next aggregate;
- observation history and a trace receipt clearly marked \`SIMULATED / authority NONE\`.

The adapter must reject unknown graph versions, unsupported policy epochs, unauthorized capabilities, missing provenance, and budget overruns. It must **never** infer permissions or route real private tasks from this research signal. Moving from this hypothetical interface to actual inference requires a separate proposal and independent E1-style evaluation under existing PocketMesh security rules.

## Stop conditions

Halt promotion if the exact numbers fail to reproduce, graph or control invariants are violated, rewritten task outcomes do not generalize, or graph overhead exceeds practical benefit. A compelling graphic or symbolic analogy does not override failed tests.

## Links

- [POLY-01 runnable code, UI, and tests in Altermath PR #26](https://github.com/MichaelWave369/Altermath/pull/26)
- [Altermath protocol on the proposed branch](https://github.com/MichaelWave369/Altermath/blob/research/polyhedral-keyhole-r24/docs/polyhedral-keyhole-r24.md)
- [NBG Keyhole and bounded-systems research](../README.md)
