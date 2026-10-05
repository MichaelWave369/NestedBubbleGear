# NBG-T8 v0.1.0 — Live Adapter Integration + Review Queue

NBG-T8 connects the frozen NBG-T7 evidence-capture contract to two practical surfaces:

1. an **operator-triggered read-only HTTP capture CLI**;
2. an **evidence review queue** inside the Temporal Keyhole Explorer.

The adapter does not run automatically. A human/operator must explicitly invoke it with a host allow-list.

The queue preserves the core firewall:

```text
retrieved != accepted
accepted != source rewrite
```

The frozen witness includes successful capture, ambiguous and failed retrievals, persisted content SHA-256, source-version drift, explicit reviewer acceptance/rejection, contradiction preservation, and offline replay.

## Operator example

```bash
python scripts/nbgt8_capture.py \
  --url https://example.org/document \
  --allow-host example.org \
  --capture-id CAP-001 \
  --epoch 10 \
  --stance SUPPORT \
  --independence-group EXT_GROUP_1
```

The capture is stored under `.nbg/evidence/` by default.

## Qualification

- **18/18 Python invariants PASS**
- **20/20 Python unit tests PASS**
- review queue model PASS
- production site build PASS
- live network disabled during CI
