# Resonant Bubbles — NBG-RB

**Status:** hypothesis and protocol design only. No empirical NBG-RB result is claimed here.

NBG-RB asks whether a nested system can exhibit scale-dependent response spectra: each bubble may respond differently to an imposed perturbation, and those responses may compose, interfere, retune, or fail to compose across scales.

The motivating application is bioelectric / electromagnetic regeneration research, but the formal object is intentionally broader than biology.

## Core object

For bubble B_i, define a state-conditioned response operator:

\[
H_i(\theta;\gamma_i)
\]

where theta is the externally specified perturbation vector and gamma_i is the bubble's internal/context state.

For electromagnetic studies, theta may include frequency, amplitude or flux density, phase, waveform, duty cycle, exposure duration, geometry, orientation, and medium.

A transfer-function interpretation is permitted only as a local approximation. Biological systems are nonlinear, history-dependent, and state-dependent; NBG-RB does not assume globally linear dynamics.

## Why frequency alone is not the model

NBG-RB explicitly rejects the default form response = F(f) unless evidence earns it.

The primary model family is response = F(theta, gamma_i, C_ij), where C_ij captures coupling between bubbles.

The first rung is therefore designed as a **frequency-only closure stress test**, not a search for a privileged or "healing" frequency.

Numbers such as 7.83 Hz, 10.5 Hz, or 14.1 Hz receive **no privileged status** in NBG-RB. If they appear in a future dataset they are treated as ordinary candidate values unless a preregistered comparison shows otherwise.

## Nested composition question

For nested bubbles B_0 subset B_1 subset ... subset B_n, the program asks whether lower-scale perturbation response predicts higher-scale state transitions under frozen admissible operators.

A simple local model may be written as:

\[
x_{i+1} = C_{i,i+1} H_i(\theta;\gamma_i) x_i
\]

but acceptance never depends on this specific algebraic form.

The operational question is:

> Does a response at one bubble provide reproducible, future-relevant information about the next bubble that simpler coarse descriptions discard?

That keeps NBG-RB aligned with the ordinary NBG Keyhole / hidden-structure question.

## Candidate biological bubble stack

The initial biological mapping is deliberately coarse:

1. **B0 — imposed field / physical stimulus**
2. **B1 — membrane voltage, ion channels, gap-junction state**
3. **B2 — intracellular signaling such as Ca2+ and downstream pathways**
4. **B3 — transcriptional / cell-state response**
5. **B4 — proliferation, migration, differentiation, neurite / patterning response**
6. **B5 — tissue architecture and functional outcome**

This is a research partition, not a claim that nature uses these exact boundaries.

## Hypotheses

### RB-H0 — frequency-only null

Frequency alone does not provide stable held-out closure across heterogeneous biological EMF studies.

### RB-H1 — multiparameter response

A frozen multiparameter perturbation vector explains held-out response classes better than frequency alone.

### RB-H2 — meaningful bubble boundaries

Biologically motivated bubble boundaries preserve more future-relevant response information than capacity-matched shuffled boundaries.

### RB-H3 — state-dependent retuning

A perturbation can change the later response surface of the same bubble:

\[
H_i^{(t+1)}(\theta) \neq H_i^{(t)}(\theta)
\]

under a reproducible state transition.

### RB-H4 — direct DNA coupling is a competing hypothesis

A direct-DNA EMF pathway must be tested separately from membrane/channel-mediated pathways.

Observed gene-expression change after EMF exposure is **not** sufficient to infer direct DNA antenna coupling because an indirect chain such as EMF -> ion channel -> Ca2+ -> signaling -> transcription can produce the same downstream observation.

## Initial evidence anchors

These sources motivate the test design; they do not constitute an NBG-RB result.

- **Adult mouse spinal neural stem cells / ELF-EMF:** a 2025 Scientific Reports paper reported effects of 50 Hz ELF-EMF exposure on proliferation, neuronal differentiation, neurite outgrowth, T-type calcium-channel activity, and NeuroG1/NeuroD1 expression. DOI: 10.1038/s41598-025-14738-x.
- **Planarian bioelectric polarity:** transient membrane-potential manipulation during early regeneration can alter later gene expression and regenerated anatomy. PMID: 30799071.
- **Persistent planarian pattern-state effects:** brief perturbation of endogenous bioelectric networks has been reported to alter later regenerative outcomes across subsequent amputations. PMID: 28538159.
- **DNA fractal-antenna proposal:** Blank & Goodman (2011) proposed a fractal-antenna interpretation for DNA/EMF interactions. PMID: 21457072; DOI: 10.3109/09553002.2011.538130.
- **Published criticism of that interpretation:** Foster (2011) argued that the fractal-antenna proposal lacked a sufficiently quantitative antenna/energy-transfer treatment. DOI: 10.3109/09553002.2011.626490.

Bibliographic existence may be VERIFIED while the reported scientific finding remains source-attributed rather than independently replicated by this repository.

## Safety and claim boundary

NBG-RB is not a medical protocol.

This line must not publish human exposure instructions, treatment frequencies, dose recommendations, claims of complete human regeneration, claims that a frequency cures injury or disease, or claims that NBG establishes DNA as a literal radio antenna.

Initial work is restricted to literature-derived metadata, synthetic controls, mathematical / computational models, held-out prediction, falsification, and negative controls.

Any future wet-lab or clinical work would require independent domain expertise, ethics review, and safety governance outside this repository.

## Promotion rule

A visually appealing spectrum, resonance peak, or biological analogy is not enough.

Promotion requires frozen source and preprocessing rules, explicit positive and negative controls, held-out evaluation, capacity-matched baselines, shuffled-boundary controls, provenance-preserving receipts, no post-result parameter tuning inside the same frozen rung, and a result sentence narrower than the evidence.

The first executable rung is [RB1](../experiments/RB1/).
