# NBG-T8 v0.1.0 Candidate Results

Candidate targets:

```text
python experiments/NBGT8/src/nbgt8.py
python -m unittest discover -s experiments/NBGT8/tests -v
npm run test:evidence-queue
npm run build
```

Frozen witness:

```text
k4 ALLEGED
k5 ALLEGED
k6 CORROBORATED
k7 CORROBORATED
k8 CORROBORATED
k9 DISPUTED
```

Expected drift count:

```text
1
```

The first remote qualification run captures exact file and generated-artifact hashes before merge.

## Claim boundary

The qualification fixture is synthetic. Live network capture is optional and operator-triggered; CI never retrieves external historical evidence.
