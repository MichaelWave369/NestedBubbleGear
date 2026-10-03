# AH14 Candidate — Revocation and Memory Downgrade

AH13 assigns role-specific memory from an authorized future query family.

AH14 asks what happens when authority changes **after memory has already been retained**.

Start with:

[
\mathcal Q_{\rm old}
\supset
\mathcal Q_{\rm new}.
]

An actor initially retains:

[
R_{\mathcal Q_{\rm old}}(\Gamma).
]

After revocation, require a deterministic downgrade map:

[
D:
R_{\mathcal Q_{\rm old}}(\Gamma)
\to
R_{\mathcal Q_{\rm new}}(\Gamma).
]

Candidate acceptance questions:

1. Is downgraded memory still sufficient for every newly authorized query?
2. Does it cease to preserve distinctions needed only by revoked queries?
3. Is downgrade deterministic and replayable?
4. Can a receipt verify the downgrade without retaining discarded distinctions?
5. Which revocations cannot be realized by local compression because authorized and revoked distinctions are entangled?

AH14 must distinguish permission revocation, memory minimization, and actual information erasure. It should not claim secure deletion unless the storage substrate itself is controlled and verified.
