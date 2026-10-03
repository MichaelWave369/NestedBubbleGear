# AH35 Candidate — Upgrade Access Structures and Privacy-Critical Distinctions

AH34 shows that privacy collapse is driven by specific combinations of task upgrades rather than by total richness alone.

AH35 should treat task upgrades themselves as an access structure.

Candidate construction:

- start from all `COMMON_ONLY`;
- define atomic upgrade events such as:
  - historian lifetime -> TRIAGE;
  - adaptive -> FULL_STATUS;
  - operator recent -> FULL_STATUS;
- define a coalition of upgrades as privacy-collapsing when:
  [
  H(Mmid Z)=0;
  ]
- enumerate minimal collapsing upgrade sets;
- compute mandatory upgrade cores and minimal cut sets;
- compare score-based budgets against structure-aware deny rules.

Key question:

> Which extra distinctions are jointly sufficient to reconstruct the denied target?

This would reconnect mixed task allocation directly to AH19/AH20 access structures, but over **distinction upgrades** instead of actors or Keyholes.
