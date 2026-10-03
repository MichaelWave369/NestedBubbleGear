# Core Concepts

## Bubble

A bounded domain carrying state. A bubble is not assumed to be a physical sphere; it is an abstract domain in the formalism.

## Interface

A constrained relation between domains. Interfaces may transform, encode, transport, or restrict state.

## Conveyor

The between-step state associated with transport across an interface. A conveyor can carry payload, frame, polarity, hidden residue, flux, timing, and provenance.

## Gear

Two complementary operational views are under development:

1. **Cycle-space current:** a nonzero circulation satisfying a conservation/null condition such as `BJ = 0` while `J != 0`.
2. **Ordered cycle transformation:** the path operator accumulated around an ordered sequence of interfaces.

## Keyhole

An observer map `P` that exposes only part of the full state. Different keyholes can induce different observational equivalence classes.

## Altermath

A working definition:

```text
P(X) = P(X')
but
there exists an allowed future word w
such that
P(rho(w) X) != P(rho(w) X')
```

So the states are indistinguishable now but not behaviorally equivalent.

## Ledger

A replayable provenance record for transformations, receipts, hashes, and claims.

## Φ-System

A control layer for typed convergence. It is kept conceptually separate from NBG itself: NBG models substrate/transport; Φ-System evaluates and regulates convergence.
