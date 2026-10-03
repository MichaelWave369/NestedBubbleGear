# AH16 Candidate — Reauthorization with an External Authority Store

AH15 shows that a lateral role transition can become impossible after a prior downgrade removes distinctions the new role needs.

The next rung should add an explicit higher-authority store.

## Core model

Let:

[
D_{m local}
]

be the actor's minimized local memory, and:

[
D_{m escrow}
]

be a separately governed higher-authority state.

Test transitions where:

[
H(Q_{m new}mid D_{m local})>0
]

but:

[
H(Q_{m new}mid D_{m local},D_{m escrow})=0.
]

Questions:

1. Which role expansions can be restored from escrow?
2. Can the actor receive only the newly authorized residue instead of the full old memory?
3. Can a receipt prove that escalation occurred without leaking escrow contents?
4. What happens if escrow itself has already been downgraded?
5. Can authority expansion be made monotone in permissions without being monotone in retained local memory?

This would turn reauthorization into an explicit governed handoff rather than an implicit assumption that forgotten state can somehow reappear.
