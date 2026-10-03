# AH17 Candidate — Split Authority and Threshold Reauthorization

AH16 uses one higher-authority store. AH17 should remove that single point of trust.

Split reauthorization evidence across two governed stores:

[
E_1,qquad E_2.
]

Target:

[
H(Q_{\rm new}mid D_{\rm local},E_1)>0,
]

[
H(Q_{\rm new}mid D_{\rm local},E_2)>0,
]

but

[
H(Q_{\rm new}mid D_{\rm local},E_1,E_2)=0.
]

Questions:

1. Can neither authority store alone restore the revoked distinction?
2. Can the pair jointly derive only the newly authorized residue?
3. Does either receipt leak enough to defeat the split?
4. Can one store be downgraded independently?
5. How does the minimal joint residue relate to the Keyhole/parallax idea?

This would be a finite threshold-style handoff, not a cryptographic secret-sharing claim.
