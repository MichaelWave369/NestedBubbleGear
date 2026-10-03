# NBG-AH20 v0.1.0 — Keyhole Criticality, Failure Sets, and Policy Resilience

AH19 defined task-relative authority access structures.

AH20 asks what happens when one or more authority Keyholes fail.

For a coalition family \(\mathcal A_Q\) and failed Keyholes \(F\), the task remains recoverable iff at least one capable coalition avoids every failed Keyhole:

\[
\exists C\in\mathcal A_Q:
C\cap F=\varnothing.
\]

AH20 computes:

- every failure set;
- minimal capability cut sets;
- minimal policy cut sets;
- policy-induced singleton vulnerabilities;
- exact reliability polynomials under independent Keyhole failure.

The key result is that policy can make a system less resilient than its mathematical capability structure.

This is a finite reliability/access-structure toy model, not a real-world fault-tolerance guarantee.
