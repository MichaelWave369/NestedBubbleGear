# NBG-AH14 v0.1.0 — Revocation and Memory Downgrade

AH13 showed that actors with narrower query authority can retain coarser sufficient memory than the substrate's full-capability representation.

AH14 makes authority change over time:

```text
full-capability memory
        ↓ revoke
role-specific downgraded memory
```

Frozen result:

- **PASS_AH14**
- **43/43** acceptance checks
- **15/15** unit tests
- replay exact
- frozen core hashes unchanged

The experiment separates three claims that must not be conflated:

```text
permission revoked
!= memory representation downgraded
!= secure physical erasure
```

It also includes a receipt negative control: in this tiny enumerable domain, a SHA-256 commitment to the *discarded old memory* uniquely identifies the old 15-class action state and therefore restores the supposedly revoked distinctions by enumeration. This is not a SHA-256 break.

See [RESULTS.md](RESULTS.md) and [SPEC.md](SPEC.md).
