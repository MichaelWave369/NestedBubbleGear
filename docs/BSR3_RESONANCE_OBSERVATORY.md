# BSR-3: Resonance Observatory, first public-data qualification rung

**Version:** BSR-3.0.0  
**Dataset:** BIDMC PPG and Respiration Dataset, PhysioNet v1.0.0, DOI 10.13026/C2208R  
**Dataset contributors:** Pimentel, Johnson, Charlton and Clifton. Cite the original research: Pimentel et al., *Towards a Robust Estimation of Respiratory Rate from Pulse Oximeters*, IEEE TBME (2016), DOI 10.1109/TBME.2016.2613124.  
**Data license:** Open Data Commons Attribution License 1.0. Source: https://physionet.org/content/bidmc/1.0.0/  
**Official digest manifest:** https://physionet.org/files/bidmc/1.0.0/SHA256SUMS.txt

## Research question

Are recorded bedside monitor **heart-rate (HR)** and **respiratory-rate (RESP)** time-series related descriptively within a recording? Is the pattern similar in two halves and after rate differences? Does the relationship remain recognizable after deliberately shifting one sequence in time?

This is **not** a scientific claim about synchronization. It cannot establish a common source, mechanism, causation, consciousness or medical benefit.

## Frozen input: 1 Hz numerics, not raw ECG or EEG

The BIDMC collection contains 53 roughly eight-minute recordings from critically ill hospital patients. Physiological ECG, PPG and impedance respiratory waveforms were recorded at 125 Hz; bedside monitor-derived HR, RESP, PULSE and SpO2 are sampled at 1 Hz. **BSR-3 currently reads only the 1 Hz Numerics CSV**, not waveforms, breaths, ECG R-peaks, individual pulse timings or neural signals.

Supported official record files:

- bidmc_01_Numerics.csv
- bidmc_02_Numerics.csv
- bidmc_03_Numerics.csv

The exact file hashes are copied from PhysioNet's version-pinned SHA256SUMS.txt and frozen in the application source. Using the **Load and verify** control fetches only the cataloged URL, computes the browser SHA-256 digest from the original downloaded bytes and compares to the official digest. No mismatch is permitted to earn verified status.

To avoid dependency on third-party browser CORS, every record provides a direct official **Download original CSV** link; the user can import the local copy instead. The browser computes the same hash on the local bytes. Matching bytes are PUBLIC_SHA256_VERIFIED; others remain USER_SUPPLIED_UNVERIFIED. No third-party proxy, download mirror, or embedded patient data is used. Hash verification requires the browser's secure-context SubtleCrypto API.

All future analyses must disclose if verification fails, was blocked, or data are unverified. Never accept a filename as a substitute for digest verification.

## Frozen analysis

Parser: exact columns Time [s], HR, PULSE, RESP, SpO2, accepting spaces after commas. 1 Hz integer-second complete grid, 240–1000 samples. Finite nonnegative numeric readings are kept. NaN/NA/blank are **null**, not zeros or interpolated; missingness and paired coverage are reported.

Primary: pairwise-complete Pearson correlation r between monitor HR (beats/min) and RESP (breaths/min), original time alignment.

Independent sensitivity views:

- First differences: r between delta(HR) and delta(RESP) only if both adjacent time points exist.
- First/second half: calculate each r separately; no selection of best-performing half.
- Frozen diagnostic offsets: rotate the RESP series circularly by **60, 90, 120, 150, 180 seconds** and recompute pairwise-complete r, keeping missing values associated with their channel.
- Frozen exploratory lags: -30, -20, -10, 0, +10, +20, +30 seconds. Compare paired values at available positions only; do not pick a lag for confirmatory inference.
- HR versus PULSE similarity is secondary context, not an independent biological replication (both describe related cardiovascular dynamics).

No shuffled/shifted result is a statistical p-value. In particular, rate-series autocorrelation, time drift, common clinical interventions, and nonstationarity undermine naive permutation exchangeability.

## Refusal gates

Mark REFUSE_INTERPRETATION if:

1. fewer than 180 complete HR/RESP pairs or paired coverage below 75%;
2. fewer than 60 paired points in either half;
3. zero variance in either rate series;
4. fewer than 90 consecutive paired rate-differences or undefined rate-difference r;
5. any circular-shift diagnostic has fewer than 90 pairs or undefined r.

If these checks pass, the status is DESCRIPTIVE_ONLY. This is **not** a biological discovery or a measure of clinical quality.

There is no inferential statistical significance test and no claim-promotion rule at BSR-3.

## Privacy and reproducibility

The app loads external source data only on user click. All manual import data remains in the current browser page session; it is not uploaded to an NBG backend. Exports contain the recorded source URL if verified, SHA-256 value, provenance, frozen protocol, limitations, quality summary and statistics. **Raw patient rows are excluded from the receipt.** The official dataset is openly distributed; other individual medical recordings require suitable consent and authorization.

## Scope of BSR-4, not yet authorized or implemented

A serious physiologic coupling study would need complete high-rate waveforms, calibrated channel metadata, consent and dataset ethics, preprocessing and artifact handling, independent beat and breath annotation validation, appropriate phase-extraction methods with surrogate nulls that preserve autocorrelation and spectrum, preregistration, held-out multi-record analysis, corrected statistics, and expert review.

Do not equate r, a matching silhouette, or an apparent oscillation with physiological phase-locking, energy transfer, or a fundamental theory.

## Reproduce

1. Run npm run test:observatory, then npm test and npm run build.
2. Open the React GitHub Page at #resonance-observatory.
3. Load and verify an official CSV or download it from PhysioNet and import locally.
4. Inspect missingness, first-difference, both halves, and all frozen shift diagnostics.
5. Export the JSON receipt, recording the provenance and source checksum.
