import assert from 'node:assert/strict';

// PHMP-1: independent H/S linear-algebra sanity witness, not NBG validation.
const c = (re = 0, im = 0) => ({ re, im });
const asC = z => typeof z === 'number' ? c(z) : z;
const add = (a, b) => { a = asC(a); b = asC(b); return c(a.re + b.re, a.im + b.im); };
const sub = (a, b) => { a = asC(a); b = asC(b); return c(a.re - b.re, a.im - b.im); };
const mul = (a, b) => { a = asC(a); b = asC(b); return c(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re); };
const conj = z => c(asC(z).re, -asC(z).im);
const abs2 = z => asC(z).re**2 + asC(z).im**2;
const I = [[1, 0], [0, 1]];
const mm = (A, B) => A.map(row => B[0].map((_, j) => add(mul(row[0], B[0][j]), mul(row[1], B[1][j]))));
const mv = (A, v) => A.map(row => add(mul(row[0], v[0]), mul(row[1], v[1])));
const dag = A => [[conj(A[0][0]), conj(A[1][0])], [conj(A[0][1]), conj(A[1][1])]];
const tr = A => add(A[0][0], A[1][1]);
const det = A => sub(mul(A[0][0], A[1][1]), mul(A[0][1], A[1][0]));
const proj = v => v.map(abs2);
const near = (a, b, label = 'number') => assert.ok(Math.abs(a-b) < 1e-10, `${label}: ${a} vs ${b}`);
const nearZ = (a, b, label = 'complex') => { a=asC(a); b=asC(b); near(a.re,b.re,label+'.re'); near(a.im,b.im,label+'.im'); };
const nearM = (A, B, label = 'matrix') => A.forEach((row,i) => row.forEach((z,j) => nearZ(z,B[i][j],`${label}[${i},${j}]`)));
const nearP = (a, b, label = 'projection') => a.forEach((x,i) => near(x,b[i],`${label}[${i}]`));

const h = 1 / Math.sqrt(2);
const H = [[h,h],[h,-h]];
const S = [[1,0],[0,c(0,1)]];
const v = [1,0];
nearM(mm(dag(H),H), I, 'H unitary');
nearM(mm(dag(S),S), I, 'S unitary');
const X = mv(H,mv(S,v));
const Xp = mv(S,mv(H,v));
nearP(proj(X),[0.5,0.5],'X');
nearP(proj(Xp),[0.5,0.5],'Xp');
nearP(proj(mv(H,X)),[1,0],'delayed X');
nearP(proj(mv(H,Xp)),[0.5,0.5],'delayed Xp');

const U = mm(mm(mm(dag(H),dag(S)),H),S);
nearM(mm(dag(U),U),I,'holonomy unitary');
nearZ(tr(U),1,'Tr U');
nearZ(det(U),1,'det U');
nearZ(tr(mm(U,U)),-1,'Tr U squared');
assert.ok(Math.abs(asC(U[0][0]).re-1)>1e-6,'loop must be nonidentity');
// The characteristic equation lambda^2 - lambda + 1 = 0 has roots exp(+- i*pi/3).
const eigenPositive = c(Math.cos(Math.PI/3),Math.sin(Math.PI/3));
const eigenNegative = conj(eigenPositive);
nearZ(add(eigenPositive,eigenNegative),tr(U),'eigenvalue sum');
nearZ(mul(eigenPositive,eigenNegative),det(U),'eigenvalue product');
const Ug = mm(mm(dag(H),U),H);
nearZ(tr(Ug),tr(U),'basepoint-conjugate trace');
nearZ(det(Ug),det(U),'basepoint-conjugate determinant');
nearM(mm(dag(U),U),I,'inverse path cancellation');

const Ucomm = mm(mm(mm(dag(H),I),H),I);
nearM(Ucomm,I,'commuting identity control');
nearZ(tr(Ucomm),2,'commuting trace');
// A noncommuting REAL orthogonal example: loop=-I. Nontrivial loop but
// magnitude-only observations of any state cannot see a global sign.
const R = [[0,-1],[1,0]];
const Ur = mm(mm(mm(dag(H),dag(R)),H),R);
nearM(Ur,[[-1,0],[0,-1]],'real orthogonal loop');
nearP(proj(mv(Ur,v)),proj(v),'global sign undetectable');

console.log('PHMP-1 PASS: exact H/S witness; Tr(U)=1; det(U)=1; Tr(U^2)=-1; gauge conjugacy and controls.');
console.log('PROVENANCE: SIMULATED / authority NONE. Standard U(2) mathematics, not NBG validation.');
