# AH17 Frozen Specification

## 1. Purpose

Test threshold-style reauthorization using two separately insufficient authority Keyholes.

AH17 asks whether:

\[
H(Q_{\rm new}\mid D_{\rm local},E_1)>0,
\]

\[
H(Q_{\rm new}\mid D_{\rm local},E_2)>0,
\]

while:

\[
H(Q_{\rm new}\mid D_{\rm local},E_1,E_2)=0.
\]

The result is called **authorized parallax** operationally: no single authority view resolves the needed distinction, but the permitted combination does.

## 2. Frozen history ensemble

Reuse the AH11-AH16 48-history ensemble:

\[
U,V\in\{I,A,B,S\},
\qquad
k\in\{-1,0,+1\}.
\]

Define:

\[
T_1=UB^k,
\qquad
T_2=B^{-k}V,
\qquad
P_2=T_1T_2,
\]

\[
H_2=T_1BT_1^{-1},
\]

\[
H_3=P_2CP_2^{-1},
\qquad
C=AB,
\]

\[
R_\Gamma=H_3H_2,
\qquad
G=R_\Gamma A.
\]

## 3. Frozen H2 classes

The ensemble contains exactly three \(H_2\) classes:

\[
H_2^{(a)}
=
\begin{pmatrix}
1&-1\\
0&1
\end{pmatrix},
\]

\[
H_2^{(b)}
=
\begin{pmatrix}
1&0\\
1&1
\end{pmatrix},
\]

\[
H_2^{(c)}
=
\begin{pmatrix}
2&-1\\
1&0
\end{pmatrix}.
\]

## 4. Split authority Keyholes

Define:

\[
E_1=(H_2)_{00},
\]

\[
E_2=(H_2)_{10}.
\]

Frozen share values:

### E1

\[
E_1\in\{1,2\}.
\]

Entropy:

\[
H(E_1)=0.8112781244591328\ {\rm bits}.
\]

### E2

\[
E_2\in\{0,1\}.
\]

Entropy:

\[
H(E_2)=0.8112781244591328\ {\rm bits}.
\]

### Joint view

The joint pairs are:

\[
(1,0),
\quad
(1,1),
\quad
(2,1),
\]

which identify the three frozen \(H_2\) classes exactly.

Therefore:

\[
H(H_2\mid E_1,E_2)=0.
\]

Joint entropy:

\[
H(E_1,E_2)=1.5\ {\rm bits}=H(H_2).
\]

## 5. Grant A — ROUTE -> GLOBAL

Local memory:

\[
D_{\rm local}=P_2.
\]

Target:

\[
Q_{\rm new}=G.
\]

Baseline barrier:

\[
H(G\mid P_2)=0.25.
\]

With authority Keyhole 1:

\[
H(G\mid P_2,E_1)=0.125.
\]

With authority Keyhole 2:

\[
H(G\mid P_2,E_2)=0.125.
\]

With both:

\[
H(G\mid P_2,E_1,E_2)=0.
\]

Thus neither store alone can authorize exact restoration, but the pair can.

The release remains:

\[
D_{\rm release}=R_\Gamma.
\]

## 6. Grant B — DOWNSTREAM -> ROUTE

Local memory:

\[
D_{\rm local}=H_3.
\]

Target:

\[
Q_{\rm new}=P_2.
\]

Baseline barrier:

\[
H(P_2\mid H_3)
=
0.5471804688852168.
\]

With authority Keyhole 1:

\[
H(P_2\mid H_3,E_1)=0.25.
\]

With authority Keyhole 2:

\[
H(P_2\mid H_3,E_2)=0.25.
\]

With both:

\[
H(P_2\mid H_3,E_1,E_2)=0.
\]

Again the pair is necessary and sufficient in the frozen model.

The release is:

\[
D_{\rm release}=P_2.
\]

## 7. No single-store reconstruction

Acceptance requires:

\[
H(Q_{\rm new}\mid D_{\rm local},E_i)>0
\]

for \(i=1,2\) in both frozen grants.

So neither authority store alone possesses enough information, even in context with local actor memory.

## 8. Pair reconstruction

The coordinator may combine:

\[
(E_1,E_2)
\to
H_2
\]

and then derive the target using local context.

For ROUTE -> GLOBAL:

\[
G=H_3(P_2)H_2A.
\]

For DOWNSTREAM -> ROUTE, the frozen joint view plus H3 identifies P2 exactly over the ensemble.

Acceptance requires exact reconstruction over all 48 histories.

## 9. Minimal selective release

After threshold reconstruction, the actor receives only:

- \(R_\Gamma\) for GLOBAL;
- \(P_2\) for ROUTE.

It does **not** receive:

- raw \(E_1\);
- raw \(E_2\);
- reconstructed \(H_2\);
- full action memory,

unless separately authorized.

The release must retain zero excess leakage relative to the target role's authorized answer, as in AH13/AH16.

## 10. Threshold receipt

Define a receipt over:

- grant id;
- target role;
- release descriptor;
- released value;
- `share_count=2`;
- protocol version.

The receipt excludes both raw shares.

Because the receipt is a deterministic function of public metadata plus the released memory:

\[
I(Y;R_{\rm grant}\mid D_{\rm release})=0.
\]

## 11. Bad share-commitment controls

Negative controls may commit to raw share values.

Since each share has a tiny enumerable domain, public commitments can reveal the share value by enumeration.

AH17 therefore does not treat hashed share values as hidden shares.

The safe frozen receipt contains no raw-share commitment.

## 12. Parallax interpretation

The frozen result supports the operational statement:

\[
\boxed{
\text{one Keyhole insufficient}
+
\text{second Keyhole insufficient}
\to
\text{jointly sufficient parallax}
}
\]

for the chosen grant tasks.

This is an information-partition result, not a claim about physical optical parallax.

## 13. Claim firewall

AH17 does not establish:

- cryptographic secret sharing;
- Byzantine fault tolerance;
- secure multiparty computation;
- threshold signatures;
- side-channel resistance;
- secure distributed storage;
- real-world access control.

It proves only finite conditional-entropy and reconstruction facts for the frozen Keyhole split.
