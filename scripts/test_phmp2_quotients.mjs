import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// PHMP-2 Stage 3: native AH9/AH10 row-vector SL(2,Z) to finite
// real-orthogonal (therefore complex-unitary) permutation QUOTIENTS.
// Exact native BigInt arithmetic. This is NOT a faithful embedding.
const M=(a,b,c,d)=>[[BigInt(a),BigInt(b)],[BigInt(c),BigInt(d)]];
const I=M(1,0,0,1), A=M(1,1,0,1), B=M(1,0,1,1), S=M(0,-1,1,0);
const mul=(X,Y)=>M(X[0][0]*Y[0][0]+X[0][1]*Y[1][0],X[0][0]*Y[0][1]+X[0][1]*Y[1][1],X[1][0]*Y[0][0]+X[1][1]*Y[1][0],X[1][0]*Y[0][1]+X[1][1]*Y[1][1]);
const prod=(...xs)=>xs.reduce(mul,I);
const det=X=>X[0][0]*X[1][1]-X[0][1]*X[1][0];
const inv=X=>{assert.equal(det(X),1n);return M(X[1][1],-X[0][1],-X[1][0],X[0][0]);};
const pow=(X,n)=>{let P=I;for(let i=0;i<n;i++)P=mul(P,X);return P;};
const eq=(X,Y)=>X.every((row,i)=>row.every((x,j)=>x===Y[i][j]));
const eye=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>Number(i===j)));
const mm=(X,Y)=>X.map(row=>Y[0].map((_,j)=>row.reduce((s,x,k)=>s+x*Y[k][j],0)));
const transpose=X=>X[0].map((_,j)=>X.map(row=>row[j]));
const pEq=(X,Y)=>X.every((row,i)=>row.every((x,j)=>x===Y[i][j]));
const pSame=(X,Y,msg)=>assert.ok(pEq(X,Y),msg);
const ptr=P=>P.reduce((s,row,i)=>s+row[i],0);
const mod=(x,p)=>Number(((x%BigInt(p))+BigInt(p))%BigInt(p));

function quotient(p){
  const vectors=[];
  for(let x=0;x<p;x++)for(let y=0;y<p;y++)if(x||y)vectors.push([x,y]);
  const indices=new Map(vectors.map((v,i)=>[v.join(','),i]));
  const n=vectors.length,identity=eye(n);
  const permutation=G=>vectors.map(v=>{
    const w=[mod(BigInt(v[0])*G[0][0]+BigInt(v[1])*G[1][0],p),
             mod(BigInt(v[0])*G[0][1]+BigInt(v[1])*G[1][1],p)];
    const j=indices.get(w.join(','));
    assert.notEqual(j,undefined,'nonzero vector must map to nonzero');
    return j;
  });
  // Row-oriented permutation matrix: rho(GH)=rho(G)rho(H).
  const rho=G=>{
    const P=Array.from({length:n},()=>Array(n).fill(0));
    permutation(G).forEach((j,i)=>{P[i][j]=1;});
    return P;
  };
  return {p,n,rho,permutation,identity};
}
const reps=[quotient(2),quotient(3)];
assert.deepEqual(reps.map(x=>x.n),[3,8]);
const generators={I,A,B,S,A2:pow(A,2),B2:pow(B,2),AB:mul(A,B),BA:mul(B,A),Ainv:inv(A),Sinv:inv(S)};
for(const r of reps){
  for(const G of Object.values(generators)){
    assert.equal(det(G),1n);
    pSame(mm(r.rho(G),transpose(r.rho(G))),r.identity,'unitary/orthogonal map');
    pSame(r.rho(inv(G)),transpose(r.rho(G)),'inverse map');
  }
  for(const G of Object.values(generators))for(const H of Object.values(generators))
    pSame(r.rho(mul(G,H)),mm(r.rho(G),r.rho(H)),'homomorphism');
  pSame(r.rho(I),r.identity,'identity map');
  assert.ok(!eq(pow(A,r.p),I),'native shear has infinite order');
  pSame(r.rho(pow(A,r.p)),r.identity,'unitary quotient has nontrivial kernel');
}
// Precise Keyhole blindness and visible noncommutativity.
pSame(reps[0].rho(pow(A,2)),reps[0].identity,'p2 loses A^2');
assert.ok(!pEq(reps[1].rho(pow(A,2)),reps[1].identity),'p3 sees A^2');
assert.equal(ptr(reps[1].rho(pow(A,2))),2);
assert.equal(ptr(reps[0].rho(A)),1);
assert.equal(ptr(reps[1].rho(A)),2);
assert.ok(!eq(pow(A,6),I));
for(const r of reps){
  pSame(r.rho(pow(A,6)),r.identity,'both quotients lose A^6');
  assert.ok(!pEq(r.rho(mul(A,B)),r.rho(mul(B,A))),'order matters in quotient');
}
// Real 3-cycles in p=3 generate genuine complex cube-root eigenphases.
const r3=reps[1],per=r3.permutation(A),visited=new Set(),cycles=[];
for(let i=0;i<r3.n;i++){
  if(visited.has(i))continue;
  const cy=[];let j=i;
  do {assert.ok(!visited.has(j));visited.add(j);cy.push(j);j=per[j];}while(j!==i);
  cycles.push(cy);
}
assert.deepEqual(cycles.map(x=>x.length).sort((a,b)=>a-b),[1,1,3,3]);
const omega={re:Math.cos(2*Math.PI/3),im:Math.sin(2*Math.PI/3)};
const cmul=(z,w)=>({re:z.re*w.re-z.im*w.im,im:z.re*w.im+z.im*w.re});
for(const cy of cycles.filter(x=>x.length===3)){
  const w=Array.from({length:r3.n},()=>({re:0,im:0}));
  cy.forEach((index,k)=>{const angle=-2*Math.PI*k/3;w[index]={re:Math.cos(angle),im:Math.sin(angle)};});
  const P=r3.rho(A);
  const wp=w.map((_,j)=>P.reduce((acc,row,i)=>({re:acc.re+row[j]*w[i].re,im:acc.im+row[j]*w[i].im}),{re:0,im:0}));
  wp.forEach((z,j)=>{
    const expected=cmul(omega,w[j]);
    assert.ok(Math.hypot(z.re-expected.re,z.im-expected.im)<1e-12,'Fourier eigenphase');
  });
}
const c9={I,B,B2:pow(B,2),B_INV:inv(B),A,A2:pow(A,2),A_INV:inv(A),AB:mul(A,B),BA:mul(B,A),S,AS:mul(A,S),SA:mul(S,A)};
const c10={I,A,B,S},C=mul(A,B),summary={};
for(const r of reps){
  let nine=0,nineNative=0,nineVisible=0;const nineHidden=[];
  for(const [name,T] of Object.entries(c9)){
    const outer=prod(T,B,inv(T),A),naive=mul(B,A);
    const mapped=r.rho(outer);
    pSame(mapped,mm(mm(mm(r.rho(T),r.rho(B)),r.rho(inv(T))),r.rho(A)),'AH9 transport survives quotient');
    pSame(mm(r.rho(inv(outer)),mapped),r.identity,'AH9 inverse');
    assert.equal(ptr(mm(mm(r.rho(inv(A)),mapped),r.rho(A))),ptr(mapped),'AH9 conjugacy trace');
    const wrong=!eq(outer,naive),visible=!pEq(mapped,r.rho(naive));
    if(wrong)nineNative++;
    if(visible)nineVisible++;
    if(wrong&&!visible)nineHidden.push(name);
    nine++;
  }
  assert.equal(nine,12);assert.equal(nineNative,8);
  assert.equal(nineVisible+nineHidden.length,8);
  let ten=0,tenNative=0,tenVisible=0;const tenHidden=[];
  for(const [name1,T1] of Object.entries(c10))for(const [name2,T2] of Object.entries(c10)){
    const outer=prod(T1,T2,C,inv(T2),B,inv(T1),A),naive=prod(C,B,A),mapped=r.rho(outer);
    const via=mm(mm(mm(mm(mm(mm(r.rho(T1),r.rho(T2)),r.rho(C)),r.rho(inv(T2))),r.rho(B)),r.rho(inv(T1))),r.rho(A));
    pSame(mapped,via,'AH10 transport survives quotient');
    assert.equal(ptr(mm(mm(r.rho(inv(A)),mapped),r.rho(A))),ptr(mapped),'AH10 conjugacy trace');
    const wrong=!eq(outer,naive),visible=!pEq(mapped,r.rho(naive));
    if(wrong)tenNative++;
    if(visible)tenVisible++;
    if(wrong&&!visible)tenHidden.push(name1+'/'+name2);
    ten++;
  }
  assert.equal(ten,16);assert.equal(tenNative,15);
  assert.equal(tenVisible+tenHidden.length,15);
  summary['p'+r.p]={
    dimension:r.n,
    ah9:{cases:nine,native_naive_failures:nineNative,unitary_visible_failures:nineVisible,hidden_failures:nineHidden.length,hidden_cases:nineHidden},
    ah10:{cases:ten,native_naive_failures:tenNative,unitary_visible_failures:tenVisible,hidden_failures:tenHidden.length,hidden_cases:tenHidden}
  };
}
assert.deepEqual(summary.p2.ah9.hidden_cases,['A2']);
assert.deepEqual(summary.p2.ah10.hidden_cases,['A/I','B/A','B/B','B/S']);
assert.deepEqual(summary.p3.ah9.hidden_cases,[]);
assert.deepEqual(summary.p3.ah10.hidden_cases,[]);
const receipt={
  experiment:'PHMP-2 Stage 3 finite unitary quotient',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  method:'native row SL(2,Z) -> mod p nonzero row vectors -> real-orthogonal / complex-unitary permutation representation',
  summary,controls:{
    nonfaithful_mod2:'A^2 != I but rho2(A^2) = I',
    nonfaithful_mod3:'A^3 != I but rho3(A^3) = I',
    paired_nonfaithful:'A^6 != I but rho2(A^6) = rho3(A^6) = I',
    noncommutative_image:'rho_p(AB) != rho_p(BA)',
    phase_orbit:'two length-3 cycles yield roots of unity exp(+-2pi i/3)'
  },
  nonclaims:'not a faithful unitary embedding of native SL(2,Z), nor quantum/Dirac physics, nor AI memory-performance proof'
};
const digest=createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:digest},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({verdict:'PASS',summary,sha256:digest},null,2));
