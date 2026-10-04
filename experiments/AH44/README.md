# NBG-AH44 v0.1.0 — Event-Driven Independence Revocation and Change Detection

AH43 showed that certificate freshness bounds evidence age but cannot detect a hidden control-topology change instantly.

AH44 compares TTL-only polling against event-driven revocation.

Frozen controls:

- `TTL_ONLY`
- `TRUSTED_IMMEDIATE`
- `TRUSTED_DELAYED_1`
- `MISSING_EVENT`
- `FALSE_POSITIVE_TRUSTED`
- `UNTRUSTED_IMMEDIATE`

A trusted change event does not certify the new topology. It revokes the old independence advertisement and moves the system to:

```text
INDEPENDENCE_REVOKED_PENDING_REVALIDATION
```

until fresh root evidence arrives.

Qualified result:

- 35/35 acceptance checks
- 15/15 unit tests
- frozen hashes unchanged
- replay exact

Main result:

```text
certificate freshness != continuous change detection
trusted event-driven revocation can reduce the hidden-change window without pretending to know the new topology
event provenance is part of revocation authority
```

AH44 closes the planned temporal-certification arc. The next phase is meta-qualification and independent reproduction, not AH45.
