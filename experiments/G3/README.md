# G3 · Noisy Keyhole

Independent third rung after merged G1 #117 and G2 #118.

The experiment freezes two alternative noise mechanisms for a G2 parity-15 sensor: independent bit errors and a shared/common-cause error. It analytically scores a correctly informed observer against an observer that wrongly presumes independent readings, using exact posterior confidence, abstention, coverage and calibration gap.

All outcomes are SIMULATED. No physical observations, Saturnian claims, or historical interpretations.

Protocol: [docs/NOISY_KEYHOLE.md](../../docs/NOISY_KEYHOLE.md)

Reproduce:

    npm run test:g3
    npm run dev
