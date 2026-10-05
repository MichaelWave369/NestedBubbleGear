# NBG-T15 Frozen Specification — Adaptive Keyhole Synthesis

## 1. Goal

NBG-T15 moves Temporal NBG from analyzing a fixed observer family to synthesizing an observer.

The question is:

\`\`\`text
Given intervention histories that are still indistinguishable,
what is the smallest admissible Governance Keyhole family that separates them?
\`\`\`

The governing rule is:

\`\`\`text
observer synthesis != truth synthesis
observer cost != epistemic value
unseparable != equivalent outside the declared query language
\`\`\`

## 2. Frozen intervention families

T15 inherits the nine NBG-T13 interventions and the T14 temporal signatures unchanged.

Three browser-facing families are frozen:

\`\`\`text
EIGHT
  the eight-history family obtained by removing one member of the
  only fully temporally equivalent T14 pair

FULL9
  all nine interventions

RESTRICTED_PAIR
  I_DELAY_ACTIVATE_EMERGENCY_7
  I_REMOVE_SUPERSEDE_NORMAL1
\`\`\`

The eight-history family is pairwise distinguishable under the full JOINT query language.

The full nine-history family is not, because T14 qualified one pair with identical behavior across all 144 Governance Keyholes.

## 3. Admissible Governance Keyholes

The query space is frozen as:

\`\`\`text
known cutoff k1 ... k12
valid time   t1 ... t12
\`\`\`

for a total of:

\`\`\`text
144 Governance Keyholes
\`\`\`

## 4. Observer channels

T15 synthesizes observers under three declared channels:

\`\`\`text
POLICY
  observes selected policy only

OUTCOME
  observes governance outcome only

JOINT
  observes (selected policy, governance outcome)
\`\`\`

Changing the channel changes the available distinction language.

## 5. Static minimal observer

For a declared intervention family and channel, T15 computes the pair-separation set for every admissible Keyhole.

It then:

1. detects pairs that no admissible Keyhole can separate;
2. emits \`REFUSE_UNSEPARABLE\` if any such pair exists;
3. otherwise searches for the minimum-cardinality fixed Keyhole set covering every history pair;
4. among equal-cardinality solutions, minimizes a frozen observer-cost proxy;
5. breaks remaining ties by canonical Keyhole order.

The frozen cost is:

\`\`\`text
observer_cost = known_cutoff + valid_time
\`\`\`

This is a resource proxy only. It is not scientific importance, truth, information quality, or epistemic value.

## 6. Restricted-language refusal witness

The frozen pair:

\`\`\`text
I_DELAY_ACTIVATE_EMERGENCY_7
I_REMOVE_SUPERSEDE_NORMAL1
\`\`\`

is separable by the POLICY channel.

It is not separable by the OUTCOME channel across the entire 144-Keyhole family.

Therefore:

\`\`\`text
POLICY  -> PASS
OUTCOME -> REFUSE_UNSEPARABLE
\`\`\`

This demonstrates that "unseparable" is always relative to an observer language.

## 7. Full-family refusal witness

The FULL9 family under JOINT must emit:

\`\`\`text
REFUSE_UNSEPARABLE
\`\`\`

because:

\`\`\`text
I_ALTER_DEACTIVATE_PAYLOAD_ONLY
I_REMOVE_SUPERSEDE_NORMAL1
\`\`\`

was qualified by T14 as behaviorally equivalent across every frozen Governance Keyhole.

T15 is forbidden from manufacturing a distinction that T14 proved absent from the declared query family.

## 8. Adaptive observer

T15 also synthesizes a deterministic adaptive decision tree.

At each unresolved node it selects the next Keyhole by:

\`\`\`text
1. maximize number of remaining intervention pairs separated
2. minimize observer cost
3. choose earliest known cutoff
4. choose earliest valid time
\`\`\`

Every selection emits a hashed query-selection receipt containing:

- remaining intervention family;
- observer channel;
- previously used Keyholes;
- selected Keyhole;
- split score;
- resulting partition;
- frozen selection rule;
- truth boundary.

## 9. Adaptive refusal

If no remaining admissible Keyhole can split an unresolved candidate family, the tree emits:

\`\`\`text
REFUSE_UNSEPARABLE
\`\`\`

The FULL9 adaptive tree must preserve an unresolved leaf containing the known fully-equivalent T14 pair.

## 10. Static vs adaptive contracts

Static synthesis minimizes a fixed observer family.

Adaptive synthesis chooses a sequence whose next query depends on earlier observations.

T15 reports, but does not collapse, these different quantities:

\`\`\`text
static minimum cardinality
static total resource cost
adaptive worst-case depth
adaptive query-node count
adaptive distinct-Keyhole count
\`\`\`

No one metric is defined as epistemically superior.

## 11. Browser Observer Synthesizer

The live research site exposes:

- family selection;
- POLICY / OUTCOME / JOINT channel selection;
- static PASS / REFUSE status;
- static minimum cardinality;
- selected fixed Keyholes;
- resource cost;
- adaptive PASS / REFUSE status;
- adaptive worst-case depth;
- adaptive distinct-Keyhole count;
- deterministic next Keyhole;
- next-query partition;
- unresolved-leaf warnings;
- governed synthesis export.

## 12. Qualification

Requires:

- 42/42 Python invariant checks PASS;
- 48/48 Python unit tests PASS;
- browser adaptive-Keyhole acceptance PASS;
- Vite production build PASS;
- 144-Keyhole admissible observer family;
- eight-history JOINT static synthesis PASS;
- restricted POLICY witness PASS;
- restricted OUTCOME witness REFUSE_UNSEPARABLE;
- FULL9 JOINT static refusal;
- eight-history adaptive tree fully resolves;
- FULL9 adaptive tree preserves an unresolved equivalent pair;
- static receipt tamper detection;
- adaptive receipt tamper detection;
- query-selection receipt replay;
- deterministic static synthesis;
- deterministic adaptive synthesis;
- observed ledger immutability.

## 13. Claim firewall

A synthesized observer is sufficient only relative to the frozen model, intervention family, observer channel, and admissible Keyhole language.

T15 does not claim that a minimum-cost observer is scientifically optimal or that an unseparable pair is identical outside the declared query family.
