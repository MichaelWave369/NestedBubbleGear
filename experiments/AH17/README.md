# NBG-AH17 v0.1.2 — Split Authority and Keyhole Parallax Reauthorization

AH16 used one higher-authority store to restore newly authorized distinctions.

AH17 removes that single point of retained authority.

The missing authority state is split into two deliberately incomplete Keyholes:

\[
E_1=(H_2)_{00},
\qquad
E_2=(H_2)_{10}.
\]

Neither share alone is sufficient for the frozen grants.

Together:

\[
(E_1,E_2)
\]

identify the three frozen \(H_2\) classes exactly, allowing the grant coordinator to reconstruct only the newly authorized target residue.

The result is a finite 2-of-2 information-partition toy model. It is not cryptographic secret sharing.
