import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// PHMP-2 independent read-only audit of native AH9/AH10 SL(2,Z) formulas.
// Native convention: row vectors; products multiply in traversal order.
// All matrix arithmetic is exact bigint, not floating-point U(2).
const M = (a,b,c,d) => [[BigInt(a),BigInt(b)],[BigInt(c),BigInt(d)]];
const I = M(1,0,0,1), A = M(1,1,0,1), B = M(1,0,1,1), S = M(0,-1,1,0);
const mm = (X,Y) => M(
  X[0][0]*Y[0][0] + X[0][1]*Y[1][0],
  X[0][0]*Y[0][1] + X[0][1]*Y[1][1],
  X[1][0]*Y[0][0] + X[1][1]*Y[1][0],
  X[1][0]*Y[0][1] + X[1][1]*Y[1][1],
);
const prod = (...xs) => xs.reduce(mm,I);
const det = X => X[0][0]*X[1][1] - X[0][1]*X[1][0];
const tr = X => X[0][0] + X[1][1];
const inv = X => { assert.equal(det(X),1n,'SL(2,Z) required'); return M(X[1][1],-X[0][1],-X[1][0],X[0][0]); };
const eq = (X,Y) => X.every((row,i)=>row.every((x,j)=>x===Y[i][j]));
const same = (X,Y,why) => assert.ok(eq(X,Y),why);
const different = (X,Y,why) => assert.ok(!eq(X,Y),why);
const sub = (X,Y) => M(X[0][0]-Y[0][0],X[0][1]-Y[0][1],X[1][0]-Y[1][0],X[1][1]-Y[1][1]);
const conjugate = (T,X) => prod(T,X,inv(T));
const serialize = X => X.map(row => row.map(Number)); // values in the frozen suite fit exact JS integers
const pow = (X,n) => { let p=I;for(let k=0;k<n;k++)p=mm(p,X); return p; };

for(const [name,G] of Object.entries({A,B,S})) assert.equal(det(G),1n,`${name} determinant`);

// AH9: independently calculate from declared edge paths, not by importing frozen Python.
const ah9Connectors = {
  I, B, B2:pow(B,2), B_INV:inv(B), A, A2:pow(A,2), A_INV:inv(A),
  AB:mm(A,B), BA:mm(B,A), S, AS:mm(A,S), SA:mm(S,A)
};
let nineCorrect=0,nineNaive=0,nineCommute=0;
const nineCases=[];
const Q = mm(A,B); // fixed basepoint gauge used for observable conjugacy test
for(const [name,T] of Object.entries(ah9Connectors)){
  const a=T, b=B, c=mm(inv(A),T), d=I,e=I,f=I,g=I;
  const HL=prod(a,d,inv(f),inv(c));
  const HR=prod(b,e,inv(g),inv(d));
  const outer=prod(a,b,e,inv(g),inv(f),inv(c));
  const transported=prod(T,B,inv(T),A);
  const naive=prod(B,A);
  const commute=eq(mm(T,B),mm(B,T));
  same(HL,A,`AH9 ${name}: local left`);
  same(HR,B,`AH9 ${name}: local right`);
  same(outer,transported,`AH9 ${name}: full edge vs transported`);
  same(sub(outer,naive),mm(sub(conjugate(T,B),B),A),`AH9 ${name}: exact defect`);
  assert.equal(eq(outer,naive),commute,`AH9 ${name}: naive iff commute`);
  const shifted=prod(inv(Q),outer,Q);
  assert.equal(tr(shifted),tr(outer),`AH9 ${name}: trace gauge invariant`);
  assert.equal(det(shifted),det(outer),`AH9 ${name}: determinant gauge invariant`);
  same(prod(outer,inv(outer)),I,`AH9 ${name}: inverse cancellation`);
  assert.equal(det(outer),1n,`AH9 ${name}: det 1`);
  nineCorrect++;
  nineNaive+=Number(eq(outer,naive));
  nineCommute+=Number(commute);
  nineCases.push({name,outer:serialize(outer),naive:serialize(naive),commute});
}
assert.equal(nineCorrect,12);
assert.equal(nineCommute,4);
assert.equal(nineNaive,4);
const nineBA=nineCases.find(x=>x.name==='BA');
assert.deepEqual(nineBA.outer,[[3,2],[4,3]]);
assert.deepEqual(nineBA.naive,[[1,1],[1,2]]);
assert.equal(nineBA.outer[0][0]+nineBA.outer[1][1],6);
assert.equal(nineBA.naive[0][0]+nineBA.naive[1][1],3);
assert.deepEqual(nineCases.find(x=>x.name==='S').outer,serialize(I));

// AH10: independently reconstruct three-cell edge boundary and transported
// local loops; test both associative parenthesizations and omitted connectors.
const C=mm(A,B);
const ah10Connectors={I,A,B,S};
let tenCorrect=0,tenLeft=0,tenRight=0,tenNaive=0,tenOmit1=0,tenOmit2=0;
const tenCases=[];
for(const [name1,T1] of Object.entries(ah10Connectors))for(const [name2,T2] of Object.entries(ah10Connectors)){
  const top1=T1,top2=T2,top3=I;
  const bottom1=mm(inv(A),T1),bottom2=mm(inv(B),T2),bottom3=inv(C);
  const H1=prod(top1,inv(bottom1));
  const H2=prod(top2,inv(bottom2));
  const H3=prod(top3,inv(bottom3));
  same(H1,A,`AH10 ${name1}/${name2} local H1`);
  same(H2,B,`AH10 ${name1}/${name2} local H2`);
  same(H3,C,`AH10 ${name1}/${name2} local H3`);
  const outer=prod(top1,top2,top3,inv(bottom3),inv(bottom2),inv(bottom1));
  const h2=conjugate(T1,H2), h3=conjugate(mm(T1,T2),H3);
  const trans=prod(h3,h2,H1);
  const left=mm(h3,mm(h2,H1));
  const right=mm(conjugate(T1,mm(conjugate(T2,H3),H2)),H1);
  const naive=prod(H3,H2,H1);
  const omit2=prod(conjugate(T1,H3),h2,H1);
  const omit1=prod(conjugate(T2,H3),H2,H1);
  same(outer,trans,`AH10 ${name1}/${name2}: outer=transport`);
  same(outer,left,`AH10 ${name1}/${name2}: associative left`);
  same(outer,right,`AH10 ${name1}/${name2}: associative right`);
  const shifted=prod(inv(Q),outer,Q);
  assert.equal(tr(shifted),tr(outer),`AH10 ${name1}/${name2}: trace invariance`);
  assert.equal(det(shifted),det(outer),`AH10 ${name1}/${name2}: det invariance`);
  same(prod(inv(outer),outer),I,`AH10 ${name1}/${name2}: inverse cancellation`);
  tenCorrect++;
  tenLeft+=Number(eq(outer,left));
  tenRight+=Number(eq(outer,right));
  tenNaive+=Number(eq(outer,naive));
  tenOmit1+=Number(eq(outer,omit1));
  tenOmit2+=Number(eq(outer,omit2));
  tenCases.push({name1,name2,outer:serialize(outer),naive:serialize(naive),omit1:serialize(omit1),omit2:serialize(omit2)});
}
assert.equal(tenCorrect,16);
assert.equal(tenLeft,16);
assert.equal(tenRight,16);
assert.equal(tenNaive,1);
assert.equal(tenOmit1,4);
assert.equal(tenOmit2,4);
const tenAB=tenCases.find(x=>x.name1==='A' && x.name2==='B');
assert.deepEqual(tenAB.outer,[[5,3],[3,2]]);
assert.deepEqual(tenAB.naive,[[3,4],[2,3]]);
const tenBS=tenCases.find(x=>x.name1==='B' && x.name2==='S');
assert.deepEqual(tenBS.outer,serialize(I));
different(M(...tenBS.naive.flat()),I,'AH10 B/S: naive is not identity');
different(M(...tenBS.omit1.flat()),I,'AH10 B/S: omit1 is not identity');
different(M(...tenBS.omit2.flat()),I,'AH10 B/S: omit2 is not identity');

// Simple native unitarization obstruction: A is unipotent with
// (A-I)^2=0, A != I; a nontrivial Jordan block cannot be similar
// to any finite-dimensional unitary matrix over a positive-definite inner product.
const nilpotent=sub(A,I);
different(nilpotent,M(0,0,0,0),'A != I');
same(mm(nilpotent,nilpotent),M(0,0,0,0),'(A-I)^2 = 0');
assert.equal(tr(A),2n);
assert.equal(det(A),1n);
// Nontrivial unipotent has unbounded powers, unlike bounded conjugates of U(2).
assert.equal(pow(A,12)[0][1],12n);

const receipt={
  experiment:'PHMP-2 native SL2Z audit',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  mathematical_claim:'finite group-valued discrete connection identities in native AH9/AH10 row-vector convention',
  controls:{nonunitary_jordan_block:'A != I; (A-I)^2=0; not similar to a 2x2 unitary matrix'},
  ah9:{connectors:12,direct_equals_transport:nineCorrect,commuting:nineCommute,naive_matches:nineNaive,BA:nineBA,S:nineCases.find(x=>x.name==='S')},
  ah10:{pairs:16,direct_equals_transport:tenCorrect,left_group_matches:tenLeft,right_group_matches:tenRight,naive_matches:tenNaive,omit1_matches:tenOmit1,omit2_matches:tenOmit2,AB:tenAB,BS:tenBS},
  interpretation:'Exact native group transport algebra; not new physics, not a U(2) mapping, not an NBG-specific predictive advantage.',
};
const canonical=JSON.stringify(receipt);
const sha256=createHash('sha256').update(canonical).digest('hex');
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out','Only optional --out path is supported');
  assert.equal(process.argv.length,4,'usage: node scripts/test_phmp2.mjs --out <path>');
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256},null,2)+'\n',{flag:'wx'});
}
console.log('PHMP-2 PASS: AH9 12/12, AH10 16/16; native SL(2,Z) exact transported composition and controls.');
console.log('AH9 naive 4/12; AH10 naive 1/16, omit1 4/16, omit2 4/16.');
console.log('PHMP-2 SHA256: '+sha256);
console.log('CLAIM: SIMULATED / authority NONE; no U(2), physical, or AI-performance conclusion.');
