# Next Phase — Meta-Qualification and Independent Reproduction

AH44 closes the planned temporal-certification arc.

The next work should **not** add AH45.

## M1 — Independent second implementation

Reimplement a small flagship set without importing the original experiment modules:

- AH17 split-authority reconstruction;
- AH20 resilience cuts;
- AH32 coalition-safe task coarsening;
- AH35 upgrade access structures;
- AH42/AH44 control-domain certification.

Compare only frozen inputs and final receipts.

## M2 — Property-based generated universes

Generate larger finite state universes and test whether core structural statements survive outside the hand-frozen panels.

## M3 — Mutation testing

Deliberately break:

- authorization thresholds;
- downgrade logic;
- receipt schemas;
- observer-history composition;
- independence certification;
- event provenance handling.

Verify the test harnesses actually fail.

## M4 — Metamorphic invariants

Test invariance under:

- renaming principals;
- permuting equivalent seats;
- reordering panel labels;
- duplicating observationally equivalent states;
- adding irrelevant metadata.

## M5 — Reproduction bundle

Create a compact package that an external researcher can run without the website, historical conversation, or internal interpretation.

## M6 — Falsification report

Document which flagship claims survived independent reproduction, which failed, and which remain model-relative.

The goal changes from:

> add another rung

to:

> make the strongest existing rungs difficult to fool.
