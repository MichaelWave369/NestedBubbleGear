# NBG-G1 · Geometry Keyhole
Version: **0.1.0** · Origin: **SIMULATED / FORMAL** · Authority: **NONE**

## Question
Can an observer that sees only a coarse count make two finite connected structures appear identical even when a stricter structural query produces different outcomes?

This is a controlled extension of the NBG Keyhole program, not a claim that geometry validates spiritual, religious or historical mechanisms.

## Frozen protocol
1. Start with one square in a two-dimensional integer lattice.
2. Enumerate each connected six-square polyomino by adjoining one edge-sharing square at a time.
3. Quotient translations, 90° rotations, and reflections with a canonical form. This defines **free** polyominoes, not one-sided or fixed polyominoes.
4. Record the coarse Keyhole K0: the **number of squares**. Every specimen must have K0 = 6.
5. Apply the richer Keyhole K1: walk each planar adjacency while propagating the orthonormal face frame (right, down, outward normal) by 90° fold steps. Accept only if the walk is consistent and the six faces produce all six distinct outward normal directions. This is the standard cube-net foldability criterion on these finite connected six-square shapes.
6. Run positive and negative controls: the specified six-square cross must fold; the 2×3 rectangle must not.
7. In a **separate**, noninteracting 4D graph model, enumerate vertices and incidence counts for a tesseract and exhibit two 4D vertices that collide after projection π(x,y,z,w)=(x,y,z) but are distinguished by q4(x,y,z,w)=w.
8. Emit an explicitly SIMULATED deterministic receipt. Do not promote any symbolic reading to a demonstrated result.

## Preregistered expected outcomes
- **35** free hexominoes; **11** cube nets and **24** nonfoldable shapes.
- All **35** K0 measurements equal 6. The K1 foldability predicate partitions the corpus.
- The tesseract census is 16 vertices, 32 edges, 24 square faces, 8 cubic cells.
- The projection witness has π(A)=π(B) and q4(A)≠q4(B).

These counts are known exact mathematical benchmarks. Passing them validates this implementation of the finite exercise, not an NBG discovery about the physical universe.

## Controls, inference boundary, falsification
- Incorrect free-hexomino count, incorrect cube-net count, unexpectedly foldable rectangle, failing cross, inconsistent face orientation, or incorrect tesseract incidence **fails** G1.
- No statistically random data, confidence intervals, quantum effects, real-world environmental measurements, or human subjects exist in this exercise.
- Passing G1 shows only **coarse observational aliasing** under an intentionally weak projection. It does not show causal residue, time loops, physical entrapment, consciousness manipulation or a new force.
- A geometric pattern does **not** establish historical intent or causation. The Christian cross, Saturnian imagery, and Dalí's *Corpus Hypercubus* motivate a public-facing interpretation discussion, but are **not** parameters, evidence, endpoints or outputs of the experiment.
- The site illustrates a cube net and discusses a tesseract graph; it does **not** claim to exhaustively enumerate or verify the possible 4D tesseract **unfoldings**.

## Run it
    npm run test:g1
    npm run dev

Visit the geometry-keyhole panel in the NBG Pages build. Select shapes, inspect the richer foldability verdict, compare the fixed controls, and export a JSON receipt.

## Implementation and provenance
- Pure mathematics: src/geometryKeyhole.js
- Reproducibility tests: scripts/test_geometry_keyhole.mjs
- UI: src/GeometryKeyholeLab.jsx
- Independent frozen AH archival packages are unchanged.
- Link to NBG claim separation: [CLAIMS.md](../CLAIMS.md)

Ledger rule: observations SIMULATED; authority NONE. A result from geometry remains a result from geometry.
