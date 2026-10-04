# NBG-T6 Frozen Specification — Temporal Keyhole Explorer UI

## 1. Goal

NBG-T6 exposes the NBG-T5 evidence-review semantics through the GitHub Pages research site.

The UI is a projection layer. It must not weaken the ledger rules.

## 2. Frozen model boundary

The browser model mirrors the NBG-T5 synthetic witness:

- immutable source records;
- append-only review events;
- separate source status and review status;
- explicit analyst-hypothesis layer;
- valid knowledge cutoffs 1 through 4;
- deterministic review-ledger head at each cutoff.

The T6 interface does not perform remote fact checking.

## 3. Required controls

The explorer must expose:

1. left Temporal Keyhole cutoff;
2. right Temporal Keyhole cutoff;
3. evidence-status filters;
4. relation-type filters;
5. analyst-hypothesis overlay toggle;
6. selectable claim cards;
7. provenance bundle drawer;
8. ambiguity queue;
9. ledger-head and view-fingerprint display;
10. governed JSON export.

## 4. Pure-projection rule

Changing cutoff, filters, relation toggles, selected claim, or analyst overlay must not mutate:

- immutable source records;
- frozen review-event bytes;
- source status;
- review ledger ordering;
- review ledger hashes.

## 5. Side-by-side comparison

Two Keyholes may be rendered simultaneously.

The comparison layer marks records whose derived views differ between cutoffs, but it does not create new evidence or review events.

## 6. Source vs review status

A claim card must display source status separately from the derived review status.

The frozen witness therefore shows:

\`\`\`text
C1 @ k1: source ALLEGED / review ALLEGED
C1 @ k4: source ALLEGED / review CORROBORATED
\`\`\`

## 7. Ambiguity queue

At cutoff 1, record \`A1\` remains ambiguous.

At cutoff 3 and later, the explicit NBG-T5 review event resolves its derived subject to \`NODE_X\`, while the immutable base record remains \`UNKNOWN\`.

## 8. Export

The browser export contains:

- frozen base records;
- frozen review ledger;
- left Keyhole;
- right Keyhole;
- base digest;
- deterministic export fingerprint.

The fingerprint is a browser-local FNV-1a display fingerprint, not a cryptographic replacement for the frozen SHA-256 research receipts.

## 9. Acceptance

Qualification requires:

- browser model test PASS;
- production Vite build PASS;
- no-hindsight cutoff behavior;
- source/review status separation;
- pure filters;
- analyst overlay separation;
- ambiguity queue behavior;
- provenance bundle behavior;
- side-by-side change detection;
- governed export behavior;
- base digest and frozen review hashes preserved exactly.

## 10. Claim firewall

NBG-T6 is an interface qualification for the synthetic NBG-T5 witness.

It does not certify any real historical claim and does not turn UI labels, reviewer actions, or source-map arrows into external evidence.
