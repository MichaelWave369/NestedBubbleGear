# BSR-5: Independent Signal Validation (Frozen Benchmark)

**Protocol:** BSR-5.0.0  
**Status:** implementation-ready *reference-based engineering benchmark*, pending actual real-record browser execution and independent method review. Neither synthetic test successes nor a CI build substantiate detector sensitivity on patients.

## Why this stage exists

BSR-4 uses an original, deliberately **unvalidated** ECG candidate detector. Its generated synthetic waveforms can verify internal computations but **cannot** measure false positives and false negatives on real clinical ECG.

MIT-BIH Arrhythmia Database (PhysioNet, version 1.0.0) offers ECG recordings with **cardiologist-reviewed expert beat annotations**. Its individual records provide a frozen independent comparison baseline. Reference labels are independent of our code, not of the dataset's original annotation process.

- Dataset: https://physionet.org/content/mitdb/1.0.0/
- DOI: https://doi.org/10.13026/C2F305
- Official SHA256SUMS: https://physionet.org/files/mitdb/1.0.0/SHA256SUMS.txt
- Data license: Open Data Commons Attribution 1.0
- Required credit: Moody, G.B. and Mark, R.G. (2001), *The impact of the MIT-BIH Arrhythmia Database*, IEEE Engineering in Medicine and Biology Magazine 20(3):45–50.
- Original technical specifications: https://wfdb.io/spec/annotation-files.html and https://github.com/wfdb/wfdb-spec/blob/main/spec/HEADERS.md

## Frozen partitions (do not choose by performance)

- Pilot record **100**: 2 channels, 360 Hz, 650,000 samples. First signal MLII. Evaluate first.
- Held-out record **101**: 2 channels, 360 Hz, 650,000 samples. First signal MLII. Only evaluate after the pilot. Do NOT adjust detector, reference labels, exclusions, matching tolerance, or target based on pilot results.

The three original source files per record (.hea, .dat, .atr) must separately match SHA-256 hashes frozen in src/independentSignalValidation.js, extracted from PhysioNet's official SHA256SUMS. No raw ECG or annotation files are repackaged in NBG. The HTML page can try a direct source fetch, but if the source blocks cross-origin requests, download the three original files and select them locally. Source content is held only within the page session.

The local code supports the original WFDB **two-channel packed format 212** and standard compact **MIT binary ATR annotations**, including interval, large SKIP, AUX and annotation metadata. The first ECG channel alone is used (MLII); other leads are excluded by protocol, not opportunistic selection. Header identity, sample count, gain, format and baseline must be exactly as frozen.

## Fixed independent beat reference

Reference types are standard WFDB annotation codes:

    1 2 3 4 5 6 7 8 9 10 11 12 13 34 35 38 41

These describe actual or provisionally classed heartbeat events. Keep paced, ectopic, unusual and unknown beat codes in the denominator, rather than only evaluating normal beats. Exclude all nonbeat annotation types (such as rhythm changes, comments and signal-quality marks) from the reference-event count, while separately acknowledging that quality changes can invalidate performance.

No arrhythmia *classification* is attempted; we score only event timing.

## Frozen detector and scoring

Use BSR-4's existing detectECGCandidates(signal, 360) unchanged. DO NOT tune its threshold, refractory period or filter after viewing labels. Dataset-specific adaptation is limited to passing the correct published 360 Hz sample rate.

Each candidate is compared to expert events with a frozen **±150 ms** tolerance (54 samples at 360 Hz), one-to-one, chronological earliest feasible matching. All detected candidates and all expert heartbeat markers enter the whole-record confusion counts:

- True positive (TP): detected event paired uniquely with an expert beat within tolerance.
- False positive (FP): detected event left unmatched.
- False negative (FN): expert beat left unmatched.
- Precision = TP/(TP+FP).
- Recall/sensitivity = TP/(TP+FN).
- F1 = harmonic mean of precision and recall.
- Report median absolute timing error among matched events (ms).

These are engineering evaluation metrics, not clinical sensitivity/specificity claims; **specificity** is not meaningful without a definition of nonbeat time windows.

Also report:

- Descriptive quality/accuracy slices in fixed 300-second windows, including the final shorter tail. The final tail (only about 5.6 seconds) remains scored but is exempt from the 60-second minimum reference-count and candidate-rate plausibility rules.
- Detector-derived candidate average BPM for each sufficiently long window, missing values, very-low-variance initial segment flag. The reserved 12-bit -2048 code is preserved as missing rather than treated as a true ECG voltage.
- A deliberately misaligned +1-second event-control as a sanity check. This is **not a statistical p-value** and may coincidentally align with a different beat.
- Count zero excluded windows and events. No failing window may be removed to make results look better.

A threshold of **precision ≥95% and recall ≥95%** is a predeclared *engineering target*. If either falls below this target, the status must be NOT_QUALIFIED. Quality flags and too few reference events in a window also generate refusal. If all targets happen to be met, the result is BENCHMARK_TARGET_MET_ONLY. Even two successful records would not be sufficient for clinical validation, cross-dataset generalization, or certification.

**Crucial:** BSR-4's peak detector was not trained or tuned against MIT-BIH here, but MIT-BIH is a widely known benchmark with dataset-selection bias. Two records do not give valid population-level accuracy.

## Privacy and provenance ledger

The score receipt includes dataset DOI, immutable source digests, source record, evaluation partition, annotation label-type counts, algorithm ID, fixed tolerance, all accuracy summaries, window flags and hard-stop status.

Receipts exclude **raw signal arrays and all individual expert/detected beat timestamps**. All raw bytes are browser-local. Users should not import private health records without permission or distribute patient-level data irresponsibly.

## Preconditions for research promotion

1. Run the real original 100 files, validate header/ATR decoded event counts against an independent trusted WFDB reader, and inspect the timing alignment manually.
2. Freeze the implementation *before* revealing 101 results; document independent adjudication of any false-positive patterns.
3. Evaluate significantly more patient-independent subjects, including ectopics, paced rhythms, low quality and known noisy data; assign 201 and 202 to the same subject-level split if they are ever added.
4. Confirm performance transfer from 360 Hz MIT-BIH to **125 Hz BIDMC**, with expert beat annotation there or a rigorously independent adjudication process. A high score on MIT-BIH does not validate BSR-4 phase relationships in BIDMC.
5. Add calibrated artifact masks, preregistered policy for flagged segments, independent evaluator and repeatable aggregate uncertainty bounds.
6. Keep BSR-4's phase-coupling experiments separate from beat detection accuracy. No claim of biological resonance is authorized by a detection benchmark.

## Reproduce

    npm run test:independent-validation
    npm test
    npm run build

Open #independent-validation on the GitHub Page. Download 100.hea, 100.dat, 100.atr from PhysioNet if necessary. Verify all 3 hashes, run the pilot, export the immutable JSON receipt. Without adjusting parameters, repeat with 101 as holdout and export that receipt. Never call an unrun experiment “validated.”
