# Quantum Boundary Q3 | Finite-shot Bell inference and observer budgets

**Status:** REPRODUCIBLE_SYNTHETIC_FINITE_SHOT_SANITY_GATE. **Origin:** `SIMULATED`. **Authority:** `NONE`. No physical photon, spin, or Bell-test apparatus was used. No PHMP-3 reserved memory evaluation is generated or scored.

## Question

[Quantum Q2](QUANTUM_BOUNDARY_Q2.md) showed that in a known Bell-dephasing family with coherence `gamma`, a fixed CHSH setting can miss violations predicted by a gamma-aware setting. **Q3 asks how many finite, noisy, independent trials are needed even to meet a conservative predeclared inference threshold.**

A positive ideal CHSH gap `S_true-2` is NOT a guarantee that a short finite experiment can establish a violation.

The source [Q3 script](../../scripts/test_phmp_quantum_q3.mjs) is an additive audit. Frozen Q1 and Q2 formulas are cited but not modified.

## State and noise model

Use the Q2 density matrix

```text
rho_gamma = 1/2 [ |00><00| + |11><11|
                 + gamma (|00><11| + |11><00|) ]
```

and a **fully specified white-noise visibility model**:

```text
rho_obs = v rho_gamma + (1-v) I4/4
0 <= gamma <= 1, 0 <= v <= 1
E_v,gamma(a,b) = v [cos(2a) cos(2b) + gamma sin(2a) sin(2b)]
```

The minimum partial-transpose eigenvalue of the declared state is

```text
lambda_min(PT(rho_obs)) = (1-v)/4 - v gamma/2
```

A negative eigenvalue certifies entanglement **within this known two-qubit density-matrix model**. It does not necessarily imply a Bell-CHSH violation, and certainly not experimental device-independent certification.

**Important change from unnoised Q2:** with `v<1`, the Z/Z correlation is `v`, not 1; even a Z-only observer can detect degraded matching frequency with enough data, though it still cannot identify `gamma` at a fixed `v`. Do not silently carry over Q2's exact 00/11-only distribution into the depolarized case.

## Frozen setting designs

- `fixed`: `a=0`, `a'=pi/4`, `b=pi/8`, `b'=-pi/8`; `S_fixed=v sqrt(2)(1+gamma)`.
- `gamma-predeclared`: `a=0`, `a'=pi/4`, `b=atan(gamma)/2`, `b'=-atan(gamma)/2`; `S_target=v*2sqrt(1+gamma²)`.

The second design assumes `gamma` is a **known scenario parameter at experimental-design time**. It is not an unknown gamma inferred by tuning angles on the evaluation outcomes. A future blind experiment must independently estimate/choose measurement angles and account for those choices.

For `gamma=.25` and `v=1`, the ideal targeted prediction is `S≈2.061553`. Adding 5% white noise gives `S≈1.958475`, still below 2 even though the modeled state has a negative partial transpose.

## Finite-shot sampling and conservative threshold

For each of four predeclared CHSH measurement settings, sample `n` independent parity observations `Y = a*b in {+1,-1}` with `Pr(Y=+1)=(1+E)/2`. This samples the correlation statistic implied by the declared Born distribution with unbiased one-party marginals.

Let `S_hat = Ehat(a,b)+Ehat(a,b')+Ehat(a',b)-Ehat(a',b')`.

Under a bounded, independent, identically distributed, stable-source **local-model null** with `S_true <= 2`, the union bound and one-sided Hoeffding inequality imply the conservative tail:

```text
Pr[S_hat > 2+t] <= 4 exp(-n t²/32)
threshold(n, alpha) = 2 + sqrt(32 ln(4/alpha) / n)
```

This is deliberately loose. It is not a sharp or optimal Bell-test p-value, nor a device-independent loophole-free statistical test. It does **not** handle adversarial memory, settings-selection bias, drift, detection inefficiency, signaling, or time-correlated trials.

**Frozen multiplicity correction:** the study runs 5 scenarios × 2 settings × 4 shot budgets × 8 replications = **320 planned comparisons**. Primary flags use Bonferroni `alpha_test=0.05/320`; 5% per-comparison flags are displayed only as descriptive secondary results. Comparing many settings and repetitions under an uncorrected 5% threshold and reporting the luckiest one would not be responsible inference.

**Shot budgets:** `n = 256, 2048, 16384, 65536` **per CHSH setting** (total four times n simulated parity events per comparison). The 8 deterministic replicates use distinct declared LCG seeds. The pseudo-random generator provides reproducibility, **not true randomness or independent physical observations**.

## Simulated observations from the frozen first pass

Numbers below are **counts out of eight simulated replications** for the selected scenario and setting. The rows use the same predetermined thresholds, without retuning based on outcomes.

| Scenario | Setting | Shots per setting | Nominal 5% flags | Family-adjusted flags |
| --- | --- | ---: | ---: | ---: |
| No coherence, `gamma=0,v=1` | gamma-predeclared | 65,536 | 0/8 | 0/8 |
| Weak, `gamma=.25,v=1` | gamma-predeclared | 65,536 | 8/8 | **0/8** |
| Weak noisy, `gamma=.25,v=.95` | gamma-predeclared | 65,536 | 0/8 | 0/8 |
| Medium, `gamma=.5,v=1` | gamma-predeclared | 16,384 | 8/8 | **8/8** |
| Pure Bell, `gamma=1,v=1` | gamma-predeclared | 2,048 | 8/8 | **8/8** |

Because this is a finite synthetic run, zero flags does not mean a genuinely zero false-positive probability, and eight flags does not guarantee future detection power.

In this design, the Bonferroni-adjusted threshold at 65,536 shots per setting is **approximately 2.0704**, exceeding the gamma=.25 ideal mean of **2.06155**. The weak-coherence scenario fails that conservative threshold despite a mathematically positive CHSH gap. The threshold at 16,384 shots per setting is approximately **2.1408**, which is below the gamma=.5 targeted mean **2.23607**.

A theoretical comparison between the expected CHSH value and the threshold can estimate a **mean-over-threshold crossover**; it is *not* a calibrated guarantee of statistical power. A proper power study requires additional independent runs and uncertainty estimates.

## Reproduce

```sh
npm run test:phmp-quantum-q3
node scripts/test_phmp_quantum_q3.mjs --out quantum-q3-local-receipt.json
```

The ordinary test does not write files; `--out` writes to a **new** path only (exclusive create) and retains the full 40 scenario/design/budget rows. Code uses built-in Node.js modules, deterministic integer-LCG sampling, source-defined settings, and an SHA-256 receipt. It records all failures and successes, without truncating to interesting-only cases.

An independent in-process JavaScript replay of the source passed **1,085 hard mathematical and deterministic-replay assertions** across 320 finite-shot comparisons. GitHub Actions CI must separately verify the committed code.

## Exclusions and next questions

1. **No physical experiment:** no randomized spacelike-separated measurement choices, no loophole closure, no quantum hardware, no actual radiation or spin measurements.
2. **No NBG-specific prediction:** every formula and outcome is grounded in established quantum density matrices and classical concentration bounds.
3. **No photon or thermodynamic claim:** simulated shot counts are not hardware power measurements, quantum memory capacity, or physical energy recovery.
4. **No after-the-fact settings optimization:** the known scenario parameters determine the analytic settings before any draws.
5. **PHMP-3 E2 untouched:** no calls to that reserved memory generator, no model adjustments, no scoring and no changes to its pins.
6. **Future study:** if pursuing an empirical Bell experiment, prespecify actual measurement design, randomized settings, calibration, noise, stopping rules, statistical corrections, and independent replication. If pursuing NBG engineering, frame a new comparator task with a genuinely new prediction versus these established baselines.

**Ledger Above Ego.**
