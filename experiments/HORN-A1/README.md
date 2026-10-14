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

## Interactive visualization

On GitHub Pages open [#horn-a1](https://michaelwave369.github.io/NestedBubbleGear/#horn-a1).
The canvas renders a rotatable 3D projection of finite longitudinal sections
using **logarithmic horizontal display compression**. The volume and area numbers
are evaluated from the unchanged exact calculus module, not from canvas pixels.
The observer selector shows K0 or K1; the area-weighted probe is a deliberately
stipulated toy rule. Uniform-weight and disabled-coupling modes serve as negative
controls. The downloaded interactive view is marked as a user-selected, noncanonical
SIMULATED snapshot; the frozen protocol remains separate.

`npm run test:horn-a1-visual` checks the display-math boundary and finite geometry.
