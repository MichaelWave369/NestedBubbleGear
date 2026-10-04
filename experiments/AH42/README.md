# NBG-AH42 v0.1.0 — Independence Certification and Hidden Common Control

AH41 showed that logical verifier seats can overstate the number of independent physical principals when roles are fused.

AH42 makes **independence itself an evidence-bearing claim**.

The frozen model distinguishes:

- logical verifier seats;
- named principals;
- actual root control domains;
- declared control domains;
- observed control-domain evidence.

Four scenarios are evaluated:

1. `CERTIFIED_INDEPENDENT` — three named principals map to three verified distinct roots;
2. `SHARED_AB_OBSERVED` — A and B are separately named but evidence shows one shared root;
3. `INDEPENDENT_BUT_UNVERIFIED` — the roots are actually independent but evidence is incomplete;
4. `HIDDEN_SHARED_UNVERIFIED` — A and B secretly share a root while evidence is incomplete.

The certification layer is allowed to claim `3 independent control domains` only in the first case. It must report observed sharing when evidence proves sharing, and must refuse an independence claim when root-control evidence is incomplete.

Main result:

\[
\text{logical seat count}
\neq
\text{named-principal count}
\neq
\text{verified independent control-domain count}.
\]

This is a finite control-domain/evidence toy model. It does not establish real-world organizational or hardware independence.
