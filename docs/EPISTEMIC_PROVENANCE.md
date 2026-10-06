# Epistemic Provenance / Dream Isolation

NBG memory now treats **epistemic origin** as a first-class property that is separate from evidence state and authority.

The core rule is:

[
oxed{	ext{memory} 
eq 	ext{fact}}
]

with the stronger invariants:

[
	ext{DREAMED} 
otRightarrow 	ext{OBSERVED}
]

[
	ext{SIMULATED} 
otRightarrow 	ext{OBSERVED}
]

[
	ext{REPETITION} 
eq 	ext{EVIDENCE}
]

[
	ext{CONFIDENCE} 
eq 	ext{VERIFICATION}.
]

## Three orthogonal axes

NBG already had typed evidence state and governance/authority. The new layer does not replace either.

### 1. Epistemic origin

Where the retained memory came from:

- `OBSERVED`
- `VERIFIED`
- `INFERRED`
- `DREAMED`
- `SIMULATED`
- `UNKNOWN`

### 2. Evidence / claim state

Examples already present in Temporal NBG:

- `OBSERVED`
- `CORROBORATED`
- `INFERRED`
- `DISPUTED`
- `ALLEGED`
- `REFUTED`
- `UNKNOWN`

These answer a different question.

A directly captured source-map record may therefore be:

~~~text
epistemic.origin = OBSERVED
relation          = ALLEGED_LINK
sourceStatus      = ALLEGED
~~~

This means the system observed **the source making an allegation**. It does not promote the alleged relation into an observed fact.

### 3. Authority

Authority remains independent:

~~~text
retainable
reasoningUsable
actionAuthorized
~~~

A dreamed memory can therefore be retained and used for hypothesis generation while being forbidden from authorizing action.

Epistemic promotion never grants new action authority automatically.

The existing rule:

~~~text
CAPABILITY != AUTHORITY
~~~

is extended with:

~~~text
PLAUSIBILITY != EVIDENCE
MEMORY != FACT
REPETITION != VERIFICATION
~~~

## Logical Dream / Possibility Bubble

The implementation does not require a separate physical database.

Logical routing is enough:

~~~text
REALITY_MEMORY
DERIVED_MEMORY
DREAM_POSSIBILITY_BUBBLE
PROVENANCE_QUARANTINE
~~~

`DREAMED` and `SIMULATED` records live logically in the Dream / Possibility Bubble.

They may be retained and retrieved for reasoning, search, planning, creativity, and hypothesis generation.

They are not returned as factual memory.

## Memory envelope

The live memory envelope is:

~~~text
content
epistemic:
  origin
  confidence
  evidence[]
  lineage
  authority
validTime
knownTime
tags[]
recordFingerprint
~~~

The JSON schema is in:

- `schemas/epistemic-memory.schema.json`

Transition receipts are described by:

- `schemas/epistemic-transition-receipt.schema.json`

## Promotion is derivation, not mutation

The original record is immutable.

A qualifying transition creates a new derived memory plus a receipt.

Example:

~~~text
dream:red-object
  origin = DREAMED

OBS:E37
  new observation evidence

obs:E37
  origin = OBSERVED
  parent = dream:red-object

INF:I12
  derived inference
  parent = dream:red-object
  evidence = E37

VER:V4
  derived verification
  parent = inference:I12
  evidence = E37, E42
~~~

The original dream remains recoverable.

Allowed promotion edges in the first implementation are deliberately narrow:

~~~text
DREAMED   -> INFERRED
SIMULATED -> INFERRED
UNKNOWN   -> INFERRED
INFERRED  -> VERIFIED
OBSERVED  -> VERIFIED
~~~

A direct `DREAMED -> VERIFIED` promotion is refused.

A later real observation is represented as a new `OBSERVED` memory with lineage back to the possibility record.

## Evidence requirements

Promotion requires a **new evidence object**.

The following are explicitly non-evidence:

- repetition;
- similarity;
- confidence;
- model agreement by itself.

A repeated dream therefore remains dreamed even after 10,000 repetitions.

Simulation output may support an `INFERRED` memory, but simulation alone cannot create `OBSERVED`.

## Retrieval

Retrieval returns an epistemic envelope rather than plain content.

A factual query over only dreamed content returns:

~~~text
status: UNKNOWN
knownPossibilities:
  - content: "Chamber 7 contains a red sphere."
    origin: DREAMED
    factualStatus: UNVERIFIED_POSSIBILITY
reason: NO_OBSERVATION_OR_VERIFICATION_SUPPORTS_THE_CLAIM
~~~

This preserves useful possibility memory without laundering it into reality.

## Compaction, summary, merge, restart and handoff

Epistemic provenance is non-discardable semantic information.

Compaction keys include:

- content;
- origin;
- confidence;
- evidence;
- authority;
- temporal fields;
- tags.

Different origins therefore do not merge.

Two identical strings with `DREAMED` and `VERIFIED` origin remain two separate memories.

Structured summary groups by origin and never produces an origin-free merged sentence.

Restart/reload and agent handoff use fingerprinted memory bundles.

## Provenance loss

Invalid, missing or corrupted provenance fails closed.

A corrupted imported record becomes:

~~~text
origin = UNKNOWN
confidence = 0
reasoningUsable = false
actionAuthorized = false
~~~

Content may remain inspectable for forensic recovery, but factual authority does not survive provenance loss.

## Temporal NBG integration

`src/epistemicTemporalView.js` attaches an epistemic envelope over the frozen `src/temporalKeyhole.js` semantic core.

The NBG-T6 qualification pins `src/temporalKeyhole.js` by SHA-256. The first integration attempt correctly failed that frozen-hash check. The implementation therefore preserves the T6 file byte-for-byte and layers epistemic retrieval above it rather than weakening the qualification.

Existing semantics remain intact:

- source status remains immutable;
- review status remains a separate later-known layer;
- review evidence may be appended to the epistemic evidence list;
- review evidence does not silently promote epistemic origin;
- provenance bundles export the epistemic envelope.

Analyst hypotheses remain `INFERRED`.

Source-map records are `OBSERVED` as source captures while keeping their typed relation and source evidence status. An `ALLEGED_LINK` stays alleged.

## Frozen experiment boundary

Previously frozen W1/W1R protocol and result artifacts are not rewritten.

Changing those files would destroy the reproducibility boundary that the memory work is trying to protect.

The new epistemic layer applies to the live NBG memory path and to future memory integrations. A frozen experiment artifact may be wrapped by this provenance layer when promoted into agent memory, but its historical bytes remain unchanged.

## Dream Contamination qualification

The adversarial suite in:

- `scripts/test_epistemic_provenance.mjs`

tests:

1. dreamed red-sphere factual recall;
2. 10,000 repetitions;
3. repeated retrieval;
4. compaction;
5. restart/reload;
6. structured summarization;
7. export/import;
8. cross-agent handoff;
9. multi-memory merge;
10. confidence decay;
11. direct promotion attempts without qualifying evidence;
12. simulated-memory contamination;
13. positive observation/inference/verification lineage;
14. provenance corruption and missing origin;
15. mixed dreamed/verified same-content compaction;
16. Temporal NBG origin/evidence integration.

At no point may repetition, serialization, merging, confidence, or similarity silently promote possibility memory into factual memory.

## Remaining boundaries

This layer does not prove:

- truth of any content;
- quality of evidence;
- independence of evidence sources;
- secure deletion;
- machine unlearning;
- cryptographic security of the browser-side FNV fingerprints;
- correctness of an external tool merely because it is labeled authoritative.

Existing evidence-review, source-independence, trust-policy and authority layers remain responsible for those questions.
