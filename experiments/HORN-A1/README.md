# NBG-HORN-A1 · Finite Bulk / Persistent Boundary

**v0.1.0 · SIMULATED / FORMAL · authority NONE**

Gabriel's Horn is an exact classical example: revolving y=1/x for x>=1
creates finite volume (pi) but divergent lateral surface area.
HORN-A1 uses finite longitudinal sections as a geometry benchmark and then
**adds a deliberately defined** boundary-sensitive two-label observer/probe
model to test coarse-state aliasing against a richer Keyhole.

This **does not** establish infinite causal influence or physical Altermath.
There are two negative-control probe modes (uniform weights, disabled coupling)
and strict state/input checks.

~~~sh
npm run test:horn-a1
npm run receipt:horn-a1 -- --out horn-a1-receipt.json
~~~

[Full protocol, formulas, controls, falsifiers and limitations](SPEC.md).
This is a new experimental candidate; existing frozen AH packages are unchanged.
