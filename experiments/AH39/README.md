# NBG-AH39 v0.1.0 — Delayed Key Disclosure and Authenticator History

AH38 separated verification authority from ordinary evidence disclosure.

AH39 makes **key authority temporal** and asks what later key disclosure can and cannot reveal depending on which authenticator artifacts crossed the epoch boundary earlier.

Frozen finite-key model:

- Epoch-1 downgraded release alone preserves **0.4 bits** residual privacy.
- A public toy-HMAC tag was already fully enumerable in AH38, so later key disclosure cannot reduce privacy below its existing **0 bits**.
- If the tag was withheld, later disclosure of the panel-independent key alone leaves privacy at **0.4 bits**.
- A mediated panel-independent `VERIFIED` receipt plus later key disclosure also stays at **0.4 bits**.
- If the previously withheld tag is then released after the key is available, privacy collapses to **0 bits**.

Main distinctions:

[
\text{key disclosure does not recreate an authenticator that never crossed the boundary}
]

and:

[
\text{effective disclosure depends on artifact history + key-authority history}.
]

This is a finite disclosure-history model over an intentionally tiny keyspace. It is not a cryptographic forward-secrecy theorem.
