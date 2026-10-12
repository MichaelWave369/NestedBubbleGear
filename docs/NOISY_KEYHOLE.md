# NBG-G3 · Noisy Keyhole and Confidence Calibration
Version **0.1.0** · Origin **SIMULATED** · Authority **NONE**

## Core question

When repeated observations share an unrecognized error source, can an observer become confident without becoming more accurate? And can a properly calibrated observer refuse an unsupported claim?

This experiment extends merged G2 #118, which required exact noiseless GF(2) queries. G3 is a **new** finite, analytical, synthetic model. No changes are made to frozen G1, G2, AH or BR protocols.

## Frozen synthetic world

- Sixteen equally likely four-bit vertices, inherited from G2.
- Exact K3 baseline: first three coordinates X,Y,Z are known. The hidden W bit has uniform conditional prior, P(W=0)=P(W=1)=0.5.
- Sensor mask 15: an observation of X XOR Y XOR Z XOR W, as in G2's cost-one recovery witness. XORing with known XYZ produces a noisy observation of W.
- Fixed error probability p in {0, 0.05, 0.10, 0.20, 0.30, 0.50}. This is a **specified simulation parameter** rather than an estimate from reality.
- Number of measurements n in {1,3,5,9}, all odd for simple majority behavior. A decision is made only if posterior confidence meets a fixed threshold in {0.60,0.80,0.95,0.99}. An exactly tied posterior always abstains.
- Report both decision coverage (probability of emitting an answer) and error conditional on emitted answers. If no decisions are possible, conditional accuracy and calibration gap must be null, never misleading zeros.

## Two true error mechanisms

1. **IID**: each measurement flips W independently with probability p. For k decoded one-bits out of n, the exact count likelihood is a binomial distribution with success parameter (1-p) if W=1, otherwise p.
2. **COMMON_CAUSE**: one Bernoulli(p) noise event flips all n measurements together. Only k=0 and k=n have positive probability. Repeating a sensor read does not produce new independent evidence about W.

## Observer assumptions

- **MATCHED**: uses the true error mechanism to compute P(W | k), with uniform prior.
- **NAIVE_IID**: always uses the IID likelihood, even when the true regime is COMMON_CAUSE.

The observed data are counts k. Each likelihood is calculated under BOTH possible W states. Posterior confidence is the larger posterior probability. A requested query is marked RESOLVED only if confidence clears the declared threshold and the posterior is not tied. A count impossible under an assumed mechanism is refused with IMPOSSIBLE_UNDER_ASSUMED_MODEL, not guessed. A refusal is a valid experiment outcome.

## Exact scoring, not Monte Carlo

The scorer exhaustively enumerates all n+1 possible count values, both equally likely hidden W values, and the declared true noise mechanism. It computes:

- **coverage** = probability the observer emits a decision;
- **conditional error** = wrong accepted probability mass / accepted probability mass;
- **actual accuracy** = one minus conditional error;
- **mean claimed confidence** = probability-weighted confidence among accepted decisions;
- **confidence gap** = mean claimed confidence minus actual accuracy.

No generated random samples, noise recordings, external data, empirical confidence intervals, measured sensor reliability or experimental subjects are involved. Any witness is a manually **constructed example sequence**, with an explicit likelihood, not a collected sample.

## Frozen positive and negative controls

- At p=0, one reading determines W exactly and passes any allowed threshold; posterior confidence=1.
- At p=0.5, observations are statistically uninformative; all requested thresholds (at least 0.6) result in NO_DECISIONS.
- With true IID p=0.1 and n=5 at threshold 0.95, coverage=0.919, error among accepted decisions approximately 0.00050054407, and mean stated confidence matches expected actual accuracy to floating-point tolerance.
- With true COMMON_CAUSE p=0.1, n=5 and threshold 0.95, a correctly informed MATCHED observer must abstain: 0.9 confidence is not enough.
- Under the **same true COMMON_CAUSE** but with an observer incorrectly assuming IID, every sample is accepted, actual accuracy is exactly 0.9, and mean confidence is approximately 0.9999830652. Overstatement is approximately **9.9983 percentage points**.
- Under COMMON_CAUSE p=0.1, a MATCHED observer at threshold 0.8 has coverage 1 and conditional error 0.1 for every n. More copies do not help.
- A witness with mixed flipped and unflipped samples is disallowed when COMMON_CAUSE is the declared true mechanism; an observer modeling COMMON_CAUSE must refuse mixed readings as impossible.
- Under true IID, accepted error declines over n=3,5,9 for p=0.1 at threshold 0.95.
- Exact normalization, bounded mass, and calibration properties are tested for every combination of the four n values, six p values, four confidence thresholds, two true regimes, and two observer models: 4x6x4x2x2=384 settings.
- G2 parity-15 conversion to W must hold for all sixteen hidden state words.

## Acceptance and falsification gates

A failure of any normalization, posterior calibration for the MATCHED observer, frozen numerical benchmark, refusal control, deterministic receipt, or input validation is a FAIL_G3. This experiment has no adjustable target fitted to observed results, and cannot upgrade symbolic interpretations to proven effects.

## Run

    npm run test:g3
    npm run dev

Then open the #noisy-keyhole panel, inspect exact analytical outcomes, compare the three reference scenarios, and optionally construct a synthetic witness sequence. Export a provenance-marked JSON receipt. The G3 qualification workflow runs both the dedicated test and the production React build.

## Boundaries and claim firewall

Proving that copying a noisy reading does not add independent evidence is not evidence for actual hidden spatial dimensions, cosmic prisons, claims about Saturn, consciousness, occult history or physics beyond this model. The artificial noise distributions and observer likelihoods are modeling assumptions, not field observations. Conditional uncertainty does not imply metaphysical uncertainty. All results are **SIMULATED**, **authority NONE**.

Related protocols: [G1](GEOMETRY_KEYHOLE.md) and [G2](DIMENSIONAL_RECOVERY.md). 
