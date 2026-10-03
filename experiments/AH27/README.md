# NBG-AH27 v0.1.0 — Windowed Evidence, Regime Change, and Horizon-Indexed Memory

AH27 compares lifetime cumulative evidence, a rolling two-batch recent window, and exponentially discounted evidence with `lambda=0.1`.

The frozen result shows that the same lifetime aggregate can correspond to different recent-hazard states.

Two order witnesses use the same archive and the same multiset of recent batches:

```text
H_A = [C,C,I,I]
H_B = [I,I,C,C]
```

Their final lifetime tables are identical, but their recent-window and discounted classifications differ.

Operational statement:

```text
same lifetime aggregate != same recent-hazard state
evidence memory is horizon-relative
```

This is a finite evidence-memory toy model, not a universal monitoring prescription.
