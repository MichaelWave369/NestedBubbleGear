# BSR-2: Biological Oscillator Bridge

**Frozen protocol:** BSR-2.0.0. **Status:** synthetic illustration, plus optional unverified local input.

## Question and limits

Can the software detect an amplitude-modulation relationship deliberately built into synthetic signals, distinguish that construction from the uncoupled model, and preserve the distinction between visual analogies and empirical physiological results?

This pilot does **not** test medical outcomes, consciousness, Bentov's “Absolute,” or energy leaving spacetime.

## Synthetic design

The generator produces 40 s at 100 samples/sec with:
- Respiration-inspired carrier varying smoothly around 0.22 Hz.
- Cardiac-inspired sinusoidal carrier around 1.18 Hz, NOT an ECG waveform.
- Neural-inspired carrier near 9.8 Hz, NOT measured EEG.

Let R(t) = sin(phi_resp(t)). The two amplitude envelopes are defined by

    A_card(t) = 1 + 0.08 sin(2pi*0.067t+0.7)
                  + 0.04 sin(2pi*0.17t+0.2) + 0.65*k*R(t)
    A_neur(t) = 1 + 0.10 sin(2pi*0.13t+2) + 0.42*k*R(t)
    signal_card = A_card * sin(phi_card)
    signal_neur = A_neur * sin(phi_neur)
    0 <= k <= 0.9

All source phases are deterministic, and there is no random seed or hidden measurement.
The built-in correlation is deliberately constructed, so detecting it is an engineering test, NOT a discovery about human physiology.

## Predeclared metrics and controls

The full-duration metric is Pearson r between R(t) and each amplitude envelope.
It is not phase-locking, coherence, cross-frequency phase-amplitude coupling, a p-value, or proof of causation.

**Synthetic negative control:** k=0, retaining the same frequency curves and initial states. For the frozen fixture, expect |r| < 0.25 for both envelopes.

**Synthetic positive control:** k=0.55, same 40-second source. Expect r > 0.8 for both envelopes.

**Diagnostic shuffle:** deterministic 1.25 s envelope-block reordering.
Expect |r| < 0.4 for the two frozen coupled fixture channels. Crucially,
this shuffle does NOT provide a statistically valid significance test for
arbitrary physiological signals, particularly autocorrelated time series.
It is an alignment sanity check only.

A positive control passing means the code can detect the synthetic mechanism it created.
Do not generalize its results to real people or biological mechanisms.

## Local CSV bridge

This React interface reads a local file via browser File API without upload.
It accepts preprocessed envelope time-series, NOT raw ECG/EEG.
Required exact header:

    t_sec,respiration,cardiac_envelope,neural_envelope

Constraints: 2 MB and 20,000 rows maximum, >= 200 rows, >=10 seconds,
5-500 Hz, finite values, monotonically increasing evenly sampled t_sec
(within 5% per interval), nonnegative envelopes and nonconstant respiration.

Imported data always retain provenance USER_SUPPLIED_UNVERIFIED.
Source notes are self-reported and do not constitute independent verification.
Only descriptive correlations and diagnostics are shown.
The built-in k=0 baseline is NOT a matched negative control for the imported dataset.
Exported summary receipts contain no raw samples.
Avoid identifiable health data and require appropriate consent before sharing any recordings.

## Research promotion firewall

No inference about anatomical oscillators, autonomic function, EEG brain states,
treatment, phase-locking or consciousness is authorized in BSR-2.

A future physiological study would require: a licensed, source-verified dataset;
channel units and independent calibration; artifact/missing-data rules; age-independent
privacy governance and consent; frequency-aware analysis; valid surrogate nulls that
preserve appropriate temporal structure; holdout evaluation; reproducible subject-level
statistics; multiple-comparison correction; and independent scientific review.

## Replay

    npm run test:biological-bridge
    npm test
    npm run build
    npm run dev

Open #biological-bridge on the NBG React page. Compare the uncoupled and coupled
synthetic presets, view envelopes, and export a summary-only JSON ledger.
