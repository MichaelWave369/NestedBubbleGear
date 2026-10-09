# NBG-RB1 — Frequency-Only Closure Stress Test

**Status:** protocol freeze candidate. No execution result is claimed.

RB1 opens the Resonant Bubbles line by attacking the simplest claim first:

> Can frequency by itself predict biological EMF response classes across heterogeneous published experiments?

The default expectation is **not** that it can.

RB1 compares a frequency-only model against a preregistered multiparameter model while preserving held-out evaluation and source provenance.

## Scientific scope

RB1 uses only published study metadata and reported outcomes, synthetic positive controls, and synthetic / permutation negative controls.

RB1 does **not** authorize human exposure, treatment, clinical recommendations, or any claim of complete regeneration.

## Frozen comparison

Primary model families:

1. FREQ_ONLY
2. MULTIPARAMETER
3. SHUFFLED_BOUNDARY
4. LABEL_PERMUTATION
5. SYNTHETIC_WINDOW_POSITIVE

The multiparameter feature family may include frequency, amplitude/flux density, waveform, duty cycle, exposure duration, geometry/orientation when reported, biological system, cell/tissue class, and endpoint class.

Missing values remain explicit missing values. They are not silently guessed.

## Primary question

Does MULTIPARAMETER improve held-out predictive / closure performance over FREQ_ONLY without leaking study identity, outcome labels, or post-result choices?

## Secondary question

Do biologically motivated bubble partitions preserve more response structure than capacity-matched shuffled partitions?

## Direct-DNA branch

The DNA fractal-antenna proposal is treated as a separate competing mechanism branch.

RB1 may record whether a source asserts direct DNA coupling, but it must not infer direct coupling from downstream transcriptional change alone.

See [SPEC.md](SPEC.md), [SOURCE_LEDGER.md](SOURCE_LEDGER.md), [protocol.json](protocol.json), and [../../docs/RESONANT_BUBBLES.md](../../docs/RESONANT_BUBBLES.md).
