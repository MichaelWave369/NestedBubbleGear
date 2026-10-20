# NBG-IS1 / E0 | Interpersonal Synchrony Keyhole: proposed falsification protocol

**Version:** IS1-E0-draft-0.1.0
**Status:** IDEA / PROTOCOL DESIGN ONLY; not preregistered, approved, funded, implemented, or run.
**Origin:** INFERRED (research design built from VERIFIED bibliographic metadata and SOURCE-ATTRIBUTED literature).
**Authority:** NONE. **Empirical NBG findings:** NONE. **Study data:** NONE.
**Design date:** 2026-10-20.

Read [the accompanying evidence note](../../docs/INTERPERSONAL_SYNCHRONY.md) for sources, evidence tiers and the NBG Keyhole mapping.

## Exact scientific question

Given two time-stamped biological measurements A(t) and B(t), how much apparent interpersonal dependence survives:
(a) robust estimation of their autocorrelation,
(b) measured shared external drivers and ordinary audiovisual contact,
(c) controls for common instrumentation and preprocessing,
(d) shuffled/time-shifted pair baselines,
and, only then, (e) a physical-field mediation test?

**Conjecture, not an assumption:** a richer evidence Keyhole distinguishes ordinary shared-input effects from any residual phenomenon. Additional correlation alone cannot identify a causal communication route.

## Staged gate plan

| Gate | Input | Deliverable | Promotion boundary |
| --- | --- | --- | --- |
| E0: literature + risk audit (this document) | Verified sources, study metadata, measurement limitations, plausible causal diagrams | source lineage register; preregistration candidate | Can only promote to **approved protocol design** after external review. |
| E1: simulation sanity controls (not executed) | explicitly generated independent, common-driven, coupled and contaminated time series with declared seeds | baseline and negative-control test code, synthetic receipts | Passing only verifies method behavior under known toy assumptions; origin SIMULATED. |
| E2: existing openly licensed datasets (not selected) | consent-compatible, legally reusable, adequately timestamped dyadic data | frozen preprocessing, dyad/session held-out evaluation | May establish association conditional on observed covariates; cannot by itself isolate a biomagnetic channel. |
| E3: independently reviewed human/physical study (not authorized) | ethical approvals, informed consent, calibrated equipment, trained supervisors and preregistered interventions | independent replication and error/uncertainty analysis | Only a decisive channel-specific physical effect could support limited field-mediation language. |

Do not leap from E0/E1 to E3. No DIY exposure, shielding, intentional RF/ELF stimulation, diagnosis, or treatment protocol is provided.

## Candidate causal diagram

- U(t): common task, sound, lighting, speech, motion, arousal-provoking events, clocks and ambient field environment.
- S_A(t), S_B(t): each person's latent state, respiration/autonomic history and observable behavior.
- O_A(t), O_B(t): consented physiology measurements with individual acquisition noise.
- X_A(t), X_B(t): recorded behavior/sensory streams and ordinary person-to-person communication.
- F_A(t), F_B(t): any **physically measured**, calibrated field at a declared location with a noise floor.
- Z(t): instrumentation coupling/cross-talk, motion and synchronization errors.

The null allows U and X to affect both S_A and S_B. An incremental prediction from O_A to O_B may still be caused by U, X, latent variables or Z. Mediation via F is a separate hypothesis requiring identified transmission and a physically plausible reception mechanism.

## Required design before touching human data

1. Define population and exclusion/privacy criteria, voluntary informed consent, independent ethics review and data-retention limits. Never secretly measure or characterize people or infer private emotions from passive biosignals.
2. Preregister task conditions, randomized order, partner/session identity separation, distance/geometry, observation window, clock synchrony tolerance, declared sensors and a data dictionary. Distinguish *simultaneous* from *causal*.
3. Choose a primary endpoint (for example dyad-held-out incremental predictive log score for B after adding A history) and a conventional baseline: own past B, common external covariates U, behavioral/sensory X, and artifact terms Z. Report absolute and incremental performance, calibration and uncertainty; no number is preclaimed here.
4. Declare secondary synchrony measures such as cross-correlation or coherence, their frequency bands, lag search, multiple-comparison correction and filter choices **before** evaluation. Do not equate peak correlation, Granger-type prediction, phase locking or coherence with actual physical causation.
5. Hold out entire dyads/sessions and source lineages where possible. Autocorrelated windows from one dyad are **not independent replicates**. Use uncertainty accounting appropriate for clustered sessions (for instance dyad bootstrap or cluster-aware permutation).
6. Log acquisition chains separately and run physically disconnected/phantom sensor controls for cross-talk. If a magnetic field is claimed, use independent calibrated magnetometry and ambient-noise characterization under qualified supervision; detectability is not biological decoding.
7. Predeclare blinding, analysis freeze, excluded segments, missing-data policy, minimum test power and what constitutes inconclusive data. No optional stopping or post hoc threshold fishing.

## Candidate comparison arms / controls

- **Null N0: unpaired recordings.** Real unrelated or independently generated streams with similar marginal autocorrelation, respiration structure and task timing.
- **Null N1: common stimulus without live communication.** Individuals receive matched prerecorded material. A shared response may create synchrony without cross-person transfer.
- **Null N2: shuffled partners and shifted time.** Preserve within-record temporal structure while breaking true pair/time alignment; enforce valid shift sizes for autocorrelation.
- **Null N3: ordinary sensory mediation.** Compare conditions with explicitly controlled and lawful audiovisual interaction. No sensory-isolation assumption is accepted merely because people are in different rooms.
- **Null N4: device cross-talk.** Dummy/phantom or isolated sensors, swapped acquisition channels, clocks and cable-routed controls. Reject shared reference/ground and processing leakage.
- **Positive P0: known shared-driver injection (software only).** Confirm methods detect a synthetic common cause **without** labeling it interpersonal transfer.
- **Positive P1: known directed coupling (software only).** Confirm detection of a synthetic lagged dependency in an otherwise adequately specified model. Successful detection does not certify causation in humans.
- **Specific EM hypothesis E3-only:** compare field measurements and permitted intervention conditions against the conventional-sensory/common-input model; require amplitudes, spatial falloff, time-lag/transport consistency, calibration, artifacts and credible receptor transduction. Intervention safety and feasibility require independent specialists and ethics approval.

## Predeclare falsification / refusal conditions

- Conventional autoregressive + shared-stimulus + behavioral baselines explain the candidate residual; **no novel mechanism** is promoted.
- The cross-person effect matches shuffled, time-shifted, unrelated, or common-stimulus-only controls; refuse a genuine-partner transfer claim.
- Effect vanishes after independent-channel artifact controls, respiration/movement adjustment, or correction for multiple tests; refuse promotion.
- Effect only appears after unregistered filter, band, lag, subgroup or threshold selection; treat as exploratory and run a fresh holdout.
- Apparent group significance is driven by a few sessions or window-level pseudoreplication; refuse individual-level inference.
- A measured field cannot be distinguished from noise floor, ambient fields or cross-talk; refuse *field-mediated* interpretation even if behavioral synchrony exists.
- A field-associated residual lacks causal mechanism isolation; **association only**, not proof that a heart senses another person's emotions.
- Failure to find an effect with sufficient design does not establish that people have no social or emotional connection. It limits only a specified operational hypothesis.

## Evidence receipt (schema sketch, not an actual observation)

For any later independently authorized rung, record:

- protocol_id, preregistration URI, code commit, source_dataset_id and dataset reuse rights;
- origin (SIMULATED / OBSERVED), authority (NONE until independently reviewed);
- sample_unit (dyad/session), n_dyads, clocks, sensor IDs and calibration records;
- modality, task, contact condition, distance, ambient noise and observed covariates;
- split/holdout manifests, baselines, null generation, excluded rows and tuning budget;
- prespecified effect/uncertainty, failure gates, code/environment hashes and independent reviewer conclusion;
- explicit *unmeasured confounders*, missing fields and abstention labels.

No artifact is a verified observation simply because it has a checksum, signature, two signers, or a coherent story. Preserve the distinction between provenance, approval and truth established elsewhere in NBG.

## Hard boundaries

- This protocol does **not** claim telepathy, shared consciousness, universal biological resonance, heart-to-heart emotional decoding, privileged healing frequencies or a new NBG law.
- Human-subject experimentation requires consent, trained researchers, privacy protections and appropriate review. A public repository is not an ethics board.
- A theory article, institute statement, or positive software simulation cannot be relabeled empirical evidence.
- Existing frozen AH, BR, RB, PHMP and other evaluation datasets, commits and gates are untouched.
- NBG-specific superiority requires out-of-sample, capacity-matched comparisons to established time-series/statistical methods, not just novel terminology.

**Gate state: E0 DOCUMENTED; E1/E2/E3 NOT RUN; PROMOTION BLOCKED. Ledger Above Ego.**
