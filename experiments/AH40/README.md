# NBG-AH40 v0.1.0 — Split Verification Authority and Threshold Declassification

AH39 showed that effective disclosure depends on both artifact history and key-authority history.

AH40 separates **verification quorum** from **public evidence-release quorum**.

Frozen verifier principals:

- `VERIFIER_A`
- `VERIFIER_B`
- `VERIFIER_C`

Frozen policies:

- any **2 of 3** verifiers may authorize an internal Epoch-0 verification;
- only **3 of 3** may authorize public Epoch-0 declassification.

A successful verification emits only a panel-independent `VERIFIED` receipt. Therefore every verification-capable coalition, including the full three-verifier coalition when it exercises `VERIFY_ONLY`, leaves the ordinary observer at **0.4 bits** residual privacy.

A successful `DECLASSIFY_EPOCH0` action emits the rich old-epoch disclosure and collapses privacy to **0 bits**.

A frozen debug-transcript negative control shows that if verification emitted the old public authenticator instead of the mediated receipt, privacy would also collapse to **0 bits** in the toy finite-key model.

This is a finite authority/output-schema experiment. It is not threshold cryptography or secret sharing.
