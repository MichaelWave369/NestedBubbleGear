# NBG-T14 Frozen Specification — Intervention Equivalence + Governance Residue

## 1. Goal

NBG-T14 returns the temporal-governance line to the original Nested Bubble/Gear question:

\`\`\`text
If two intervention histories look identical through one Governance Keyhole,
can another admissible Governance Keyhole reveal that they were never behaviorally equivalent?
\`\`\`

The governing rule is:

\`\`\`text
single-Keyhole equality != full temporal equivalence
ledger inequality != behavioral inequality
equivalence != causal identity
\`\`\`

## 2. Frozen intervention family

NBG-T14 inherits the nine qualified NBG-T13 interventions unchanged.

No new mutation grammar is introduced.

## 3. Focal Governance Keyhole

The frozen focal projection is:

\`\`\`text
known cutoff = k10
valid time   = t10
\`\`\`

Each intervention is assigned a target signature:

\`\`\`text
(selected policy version, governance outcome)
\`\`\`

Interventions with identical target signatures belong to the same target-equivalence class.

## 4. Full temporal query family

Behavioral equivalence is tested across the frozen family:

\`\`\`text
known cutoffs k1 ... k12
valid times   t1 ... t12
\`\`\`

For each Keyhole the signature is:

\`\`\`text
(selected policy version, governance outcome)
\`\`\`

The canonical temporal signature is the ordered sequence of all 144 Governance Keyhole signatures.

## 5. Pairwise equivalence receipt

Every unordered intervention pair receives a deterministic receipt containing:

- target signatures;
- target-equivalence flag;
- full temporal-equivalence flag;
- temporal signature hashes;
- residue count;
- first separating Governance Keyhole;
- minimal separating Keyhole family;
- governance residue hash;
- explicit no-causal-identity marker;
- receipt hash.

With nine interventions, the frozen atlas contains:

\`\`\`text
C(9,2) = 36 pair receipts
\`\`\`

## 6. Governance Residue

For a pair of interventions, the Governance Residue is the ordered sequence of Governance Keyholes where their signatures differ.

If the focal k10/t10 signature is equal but the residue is non-empty, the pair is classified:

\`\`\`text
KEYHOLE_EQUIVALENT_TEMPORALLY_DISTINCT
\`\`\`

If the focal signature is equal and the residue is empty across the full frozen family, the pair is classified:

\`\`\`text
TEMPORALLY_EQUIVALENT_IN_QUERY_FAMILY
\`\`\`

A residue hash commits to the complete difference sequence.

## 7. Primary hidden-residue witness

The pair:

\`\`\`text
I_REMOVE_DEACTIVATE
I_DELAY_DEACTIVATE_11
\`\`\`

is equal at k10/t10:

\`\`\`text
EMERGENCY@1.0 -> REJECTED
\`\`\`

but is temporally distinct because the delayed-deactivation branch eventually deactivates the emergency policy while the removal branch does not.

The first divergent Keyhole is frozen by replay rather than declared by prose.

## 8. Second hidden-residue witness

The pair:

\`\`\`text
I_REMOVE_REGISTER_NORMAL2
I_DELAY_REGISTER_NORMAL2_11
\`\`\`

is also equal at k10/t10 and temporally distinct later when the delayed registration becomes visible.

This provides an independent intervention-history witness.

## 9. Full temporal-equivalence control

The pair:

\`\`\`text
I_ALTER_DEACTIVATE_PAYLOAD_ONLY
I_REMOVE_SUPERSEDE_NORMAL1
\`\`\`

has different branch ledger heads but remains behaviorally equivalent across every Governance Keyhole in the frozen query family.

This control establishes:

\`\`\`text
different retained ledger history
does not automatically imply
different admitted governance behavior
\`\`\`

## 10. Minimal separating Keyhole family

For a temporally distinct pair, a single divergent Governance Keyhole is sufficient to distinguish it.

The deterministic earliest divergent Keyhole therefore forms a minimal separating family of cardinality 1.

For a temporally equivalent pair, no separating Keyhole exists in the frozen family and the separator cardinality is 0.

## 11. Equivalence classes

NBG-T14 exports two partitions:

- target-equivalence classes at k10/t10;
- full temporal-equivalence classes across k1...k12 × t1...t12.

Target classes may split when the observer family is widened.

This is the temporal-governance analogue of widening an NBG Keyhole.

## 12. Browser explorer

The live research site exposes:

- atlas-wide pair counts;
- target-equivalent pair count;
- hidden-residue pair count;
- temporally equivalent pair count;
- four canonical pair witnesses;
- left/right focal signatures;
- full temporal signature fingerprints;
- focal vs temporal equivalence verdicts;
- first separating Governance Keyhole;
- Governance Residue fingerprint;
- governed pair export.

## 13. Qualification

Requires:

- 34/34 Python invariant checks PASS;
- 38/38 Python unit tests PASS;
- browser intervention-equivalence acceptance PASS;
- Vite production build PASS;
- 9 interventions;
- 36 pair receipts;
- deterministic target and temporal classes;
- primary hidden-residue witness;
- second hidden-residue witness;
- full temporal-equivalence control with different ledger heads;
- minimal separator cardinality 1 for distinct pairs;
- separator cardinality 0 for full-equivalence controls;
- pair-receipt tamper detection;
- deterministic atlas replay;
- deterministic pair replay.

## 14. Claim firewall

NBG-T14 defines behavioral equivalence only relative to the declared Governance Keyhole family.

It does not claim that target-equivalent interventions are historically identical, physically identical, or causally identical.
