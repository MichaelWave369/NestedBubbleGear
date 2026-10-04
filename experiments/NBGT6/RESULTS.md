# NBG-T6 v0.1.0 Qualification Results

## Verdict

**PASS_NBGT6**

- Temporal browser-model acceptance: **PASS_NBGT6_MODEL**
- Vite production build: **PASS**
- no-hindsight replay: **PASS**
- source/review status separation: **PASS**
- pure filter projection: **PASS**
- analyst overlay separation: **PASS**
- ambiguity queue: **PASS**
- provenance bundle: **PASS**
- side-by-side change detection: **PASS**
- governed export receipt: **PASS**

## Frozen UI witness

```text
left cutoff 1:
  A1 = UNKNOWN
  C1 = source ALLEGED / review ALLEGED

right cutoff 4:
  A1 = NODE_X
  C1 = source ALLEGED / review CORROBORATED
```

The frozen browser model preserves the NBG-T5 base digest and review-event hashes exactly.

## Frozen file hashes

```text
src/temporalKeyhole.js            4a7f81e22345ede5a997f47509d3eecc2580aa7678ef88c3dd10053f2cadf6d3
src/App.jsx                       787136c5367e95eac46dea77a383a565a500f278b41bca09c74409c3fa37cada
src/styles.css                    6a3264831312273021f65992779e5dc0e36baa6510144f3d10a16a084083d468
scripts/test_temporal_keyhole.mjs 6fb1b480760c1e16637d3a964f779d1e24cb84cf136408dc9b8037f640e58995
experiments/NBGT6/SPEC.md         9d2a131f757c54b00f9cca5f2e0bad720be25e1f106a3f84fc418902bac6f857
```

## Note on display fingerprints

The explorer uses a deterministic FNV-1a browser fingerprint for view/export display. It is not a cryptographic replacement for the frozen SHA-256 qualification receipts.

## Claim boundary

This is a UI/model qualification over synthetic temporal data, not a fact-check result and not evidence for any real historical claim.
