# PHMP-1 v0.1.0 | Frozen H/S sanity witness, prospective correspondence

## Status and authority

- **Test type:** exact analytic identities approximated by floating point with absolute tolerance `1e-10`.
- **Origin:** `SIMULATED`; **authority:** `NONE`.
- **Claim allowed:** reproduction of standard finite U(2) linear algebra and documented controls.
- **Claims prohibited:** experimental confirmation of NBG, spacetime curvature, Dirac fermions, quantum hardware, gauge fields in nature, holographic memory, regenerative physical energy, or AI performance gains.
- **Scope:** additive. Existing frozen AH4–AH10 and learned-memory W1 results remain unmodified.

## Mathematical setup (column-vector convention)

Let `h = 1/sqrt(2)`, `H = [[h,h],[h,-h]]`, `S = diag(1,i)`, and `v = (1,0)^T`. Both H and S are unitary.

Histories:

```text
X  = H S v = (1, 1)^T / sqrt(2)
X' = S H v = (1, i)^T / sqrt(2)
P(z) = (|z[0]|², |z[1]|²)
P(X) = P(X') = (1/2, 1/2)
P(H X)  = (1, 0)
P(H X') = (1/2, 1/2)
```

This is **delayed observability** under a coarse projection. It does not need a closed loop to be true.

Define the abstract closed commutator word:

```text
U = H† S† H S
trace(U) = 1
det(U) = 1
trace(U²) = -1
spec(U) = { exp(i*pi/3), exp(-i*pi/3) }
U†U = I and U != I
```

An earlier conversational analytic prediction `trace(U)=0` was **wrong** and contradicted by direct calculation. The corrected exact result is `trace(U)=1`. For this U(2) example, trace 1 versus identity trace 2 already detects the nontrivial conjugacy class. Eigenvalues follow from `lambda² - lambda + 1 = 0`.

A loop operator transforms as `U -> Q† U Q` under a single unitary change of basepoint; its trace and determinant are invariant. Genuine local gauge covariance on a network additionally requires explicitly defined vertices, edges, and local gauges, which PHMP-1 does **not** implement.

## Acceptance gates

1. Verify H and S are unitary.
2. Verify the common coarse observation and differing delayed probe outcomes.
3. Verify loop unitarity, nonidentity, trace/determinant/trace-square, and spectral characteristic polynomial.
4. Verify conjugation invariance and exact inverse cancellation up to tolerance.
5. Verify a commuting control gives identity and trace two.
6. Verify a real-orthogonal, noncommuting control can produce central loop `-I` while magnitude measurement remains blind to global sign.

All gates are mathematical sanity checks, not predictive validation. A failing identity is a code or algebra failure.

## Counterexamples and non-equivalences to preserve

- `P(X)=P(X')` but `P(wX) != P(wX')` is a **general observability condition**, not the definition of holonomy.
- Nontrivial holonomy need not be detectable by an arbitrary Keyhole. Conversely delayed observability can occur with trivial loop holonomy.
- Complex-valued/classical unitary calculation does not instantiate a Dirac spinor, a quantum experiment, nor a physically energy-recovering process.
- A causal partial order is not a metric or general relativity.
- Ledger governance (revocation, provenance, authorization) is not equivalent to gauge symmetry. Gauge-equivalent descriptions must preserve appropriately transformed predictions, not forcibly erase observable residue.
- A global U(1) phase can change a complex vector without changing the magnitude-only observation.

## Honest progression to PHMP-2

Do **not** rename or retrofit the frozen AH loops. Compare their actual typed state spaces, operators, composition conventions, and allowed observations. A reported link to discrete-connection mathematics is a **candidate formal correspondence** until a map is given that preserves the relevant compositions and controls.

See [PHMP2_AUDIT.md](PHMP2_AUDIT.md) for source-specific constraints and go/no-go criteria.
