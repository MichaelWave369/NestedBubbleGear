# BSR-4: Physiological Phase Dynamics

**Frozen protocol:** BSR-4.0.0  
**Status:** descriptive waveform and manually annotated breathing-cycle *diagnostics*, not validated physiology or medical research conclusions.

## Dataset and citation

BIDMC PPG and Respiration Dataset, version 1.0.0, PhysioNet.
DOI: https://doi.org/10.13026/C2208R .
Authors: Marco Pimentel, Alistair Johnson, Peter Charlton and David Clifton.
License: Open Data Commons Attribution 1.0.
Dataset: https://physionet.org/content/bidmc/1.0.0/
Official checksums: https://physionet.org/files/bidmc/1.0.0/SHA256SUMS.txt

The dataset contains ECG, PPG and impedance-respiration recordings at **125 Hz** plus two human annotators' breath sample indexes. BSR-4 uses the ECG II lead, impedance RESP waveform and both breath annotations for the same recording; it does **not** analyze PPG, other ECG leads, EEG or consciousness. Its predecessor BSR-3 only analyzed monitor rates at 1 Hz.

The three allowed source pairs (01, 02, 03) are pinned to **two separate source SHA-256 digests per record**, copied from the original PhysioNet checksum manifest. Every browser-loaded file must match the chosen recording **and** its declared type. No nonmatching CSV is accepted as physiological evidence; provenance cannot be inferred from a filename. Source fetches are user-initiated; if browser CORS blocks downloading from PhysioNet, users may download official files manually and load them into the local page. File hashes are calculated with WebCrypto in a secure browser context. Neither original files nor the measured signals are bundled in the repository.

## Frozen procedure

1. Read the Signals CSV with the header Time [s], RESP, PLETH, V, AVR, II. Require 10,000–63,000 rows on a 125 Hz aligned time axis, bound file size to 4.5 MB, preserve NaN and empty cells as missing, reject unexpected columns or malformed values.
2. Read Breaths CSV with two *distinct* annotation columns, each representing sample numbers. Preserve each annotator's annotations separately, reject out-of-bounds and non-monotone indexes. Treat published indexes as corresponding to 125 Hz samples; sub-sample origin ambiguity is less than 8 ms and should be resolved with source authors before any higher-precision study.
3. Mark provisional ECG candidate events with a deterministic high-pass abs-envelope: subtract a 0.12 s local mean, take absolute residuals, use the 94th percentile of subsampled amplitudes, local extrema and 0.34 s refractory merging. **This is not a validated QRS detector.** Beat false positives and omissions are not quantified; polarity is not clinically characterized.
4. For each candidate event between successive manually annotated breaths, compute normalized respiratory-cycle phase φ = 2π(t_event−t_breath[j])/(t_breath[j+1]−t_breath[j]). Ignore cycles shorter than 0.8 s or longer than 15 s. Repeat for both annotators.
5. Calculate mean circular resultant length R = |N⁻¹ Σ exp(iφ)| in the interval [0,1] to **describe concentration of the provisional events** relative to each respiratory annotation timeline. R has no causal, medical or “synchronization proven” semantics.
6. Recompute phase concentration separately in two halves of the waveform; use the *frozen* circular candidate-event shifts of +17,+37,+73,+131 seconds as descriptive controls. Never change shift offsets after reading a result in the same protocol version.

**No p-values are computed.** Circularly shifted event times are NOT universally valid surrogates for nonstationary clinical physiology. A high R might reflect a beat-to-breath ratio, periodicities, detection bias, artifact or coincidental sampling. Time shifting can also produce a high R for mathematical reasons. Full independent validation requires verified R peak annotations, detailed detector QA, stationarity-aware surrogate methodology, preregistration, multiple subjects and expert review.

## Refusal gates

Set REFUSE_INTERPRETATION whenever any of the following is true:

- ECG II or impedance RESP sample completeness <95%;
- median between-annotator breath-marker disagreement exceeds 0.25 s;
- <12 breath annotations;
- <30 ECG candidate events or candidate mean rate outside 35–200 bpm;
- <25 assignable cardiac event phases with either annotator;
- <10 candidate-event phases in either time half;
- <25 event phases after any frozen shift.

When a gate passes, status is DESCRIPTIVE_ONLY_UNVALIDATED_DETECTOR, not “biology validated”. The source integrity gate verifies *bytes*, not physiological sensor quality.

## Evidence and privacy

- The download receipt includes source URLs, SHA verification status, detector metadata, event counts, diagnostic concentrations, and refusal conditions.
- It explicitly **excludes raw patient signal samples, event indexes/timestamps and manually annotated timestamp arrays**. The React component keeps signals only in memory during the current session and does not send them to any application backend.
- This version contains no raw waveform dataset nor external reused implementation, algorithm package or third-party component.
- No physiological resonance, therapeutic frequency, regeneration, consciousness, dimensional-transition or clinical inference is authorized.

## Tests and review

Run:

    npm run test:phase-dynamics
    npm test
    npm run build

Testing uses original synthetic fixtures to verify deterministic event detection behavior, annotation parsing, time axes, refusal, confidentiality and fixed controls. A passing fixture does **not** validate real-world beat detection, clinical accuracy, browser CORS behavior, or event-phase science. Before production promotion, use a real pinned source file and manually inspect both files' verification state, rendering, performance and null behavior. An independent clinical/data-science validation rung will be needed for future inferential findings.

The web lab appears at #phase-dynamics.
