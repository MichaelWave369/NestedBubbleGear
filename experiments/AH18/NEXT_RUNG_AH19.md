# AH19 Candidate — Authority Access Structures and Minimal Coalition Lattices

AH18 shows that quorum cannot be reduced to coalition size.

The next rung should formalize the whole access structure.

## Candidate model

For a set of Keyholes:

\[
E=\{E_1,\dots,E_n\},
\]

define a coalition \(C\subseteq E\) as sufficient for task \(Q\) iff:

\[
H(Q\mid D_{\rm local},C)=0.
\]

Then define:

\[
\mathcal A_Q
=
\{C\subseteq E:
H(Q\mid D_{\rm local},C)=0\}.
\]

Questions:

1. Is \(\mathcal A_Q\) monotone under supersets?
2. What are its minimal sufficient coalitions?
3. Which Keyholes are present in every minimal coalition?
4. Which shares are redundant under a given task?
5. Can two tasks have different access structures over the same authority views?
6. Can policy authorization be represented as a strict subfamily of mathematical capability?

This would turn AH18's three-node example into a general finite coalition-lattice framework without claiming cryptographic threshold security.
