import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Independent PHMP-2 Stage 2 audit, native AH9/AH10 row-vector convention.
// Each edge u->v transforms as Q[u]^-1 * E * Q[v].
const M=(a,b,c,d)=>[[BigInt(a),BigInt(b)],[BigInt(c),BigInt(d)]];
const I=M(1,0,0,1), A=M(1,1,0,1), B=M(1,0,1,1), S=M(0,-1,1,0);
const mul=(X,Y)=>M(X[0][0]*Y[0][0]+X[0][1]*Y[1][0],X[0][0]*Y[0][1]+X[0][1]*Y[1][1],X[1][0]*Y[0][0]+X[1][1]*Y[1][0],X[1][0]*Y[0][1]+X[1][1]*Y[1][1]);
const prod=(...xs)=>xs.reduce(mul,I);
const det=X=>X[0][0]*X[1][1]-X[0][1]*X[1][0];
const tr=X=>X[0][0]+X[1][1];
const inv=X=>{assert.equal(det(X),1n,'SL(2,Z) required');return M(X[1][1],-X[0][1],-X[1][0],X[0][0]);};
const eq=(X,Y)=>X.every((row,i)=>row.every((v,j)=>v===Y[i][j]));
const same=(X,Y,label)=>assert.ok(eq(X,Y),label);
const different=(X,Y,label)=>assert.ok(!eq(X,Y),label);
const conj=(Q,X)=>prod(inv(Q),X,Q);
const power=(X,n)=>{let P=I;for(let i=0;i<n;i++)P=mul(P,X);return P;};
const frames=n=>{
  const pool=[I,A,B,S,inv(A),inv(B),mul(A,B),mul(B,A),mul(S,A),power(B,2),inv(S)];
  const f=(name,fn)=>({name,Q:Array.from({length:n},(_,i)=>fn(i))});
  const choices=[
    f('identity',()=>I),
    f('staggered',i=>pool[(3*i+1)%pool.length]),
    f('shifted',i=>pool[(2*i+4)%pool.length]),
    f('alternating',i=>i%2?B:A),
    f('nested',i=>pool[(i*i+3)%pool.length]),
    f('mixed',i=>prod(pool[(i+2)%pool.length],pool[(i*3+5)%pool.length]))
  ];
  for(const item of choices)for(const Q of item.Q)assert.equal(det(Q),1n);
  for(let i=0;i<n;i++)assert.ok(choices.some(x=>!eq(x.Q[i],I)),'vertex needs a nontrivial test frame');
  return choices;
};
const edge=(u,v,value)=>({u,v,value});
const changed=(edges,Q)=>Object.fromEntries(Object.entries(edges).map(([name,e])=>[name,edge(e.u,e.v,prod(inv(Q[e.u]),e.value,Q[e.v]))]));
function path(edges,steps,start){
  let current=start, result=I;
  for(const [name,direction] of steps){
    assert.ok(direction===1||direction===-1,'direction +/-1 required');
    const E=edges[name];assert.ok(E,'unknown edge');
    const src=direction===1?E.u:E.v, dst=direction===1?E.v:E.u;
    assert.equal(current,src,'discontinuous edge path');
    result=mul(result,direction===1?E.value:inv(E.value));
    current=dst;
  }
  assert.equal(current,start,'loop must close');
  return result;
}
const step=(name,direction=1)=>[name,direction];

const c9={I,B,B2:power(B,2),B_INV:inv(B),A,A2:power(A,2),A_INV:inv(A),AB:mul(A,B),BA:mul(B,A),S,AS:mul(A,S),SA:mul(S,A)};
const n9={cases:0,gauge_checks:0,bad_single_edge_detected:0};
for(const [name,T] of Object.entries(c9)){
  // AH9 top: 0,1,2; bottom: 3,4,5.
  const edges={a:edge(0,1,T),b:edge(1,2,B),c:edge(0,3,mul(inv(A),T)),d:edge(1,4,I),e:edge(2,5,I),f:edge(3,4,I),g:edge(4,5,I)};
  const L=[step('a'),step('d'),step('f',-1),step('c',-1)];
  const R=[step('b'),step('e'),step('g',-1),step('d',-1)];
  const O=[step('a'),step('b'),step('e'),step('g',-1),step('f',-1),step('c',-1)];
  const hl=path(edges,L,0),hr=path(edges,R,1),out=path(edges,O,0);
  same(hl,A,'AH9 left local');same(hr,B,'AH9 right local');
  same(out,prod(T,B,inv(T),A),'AH9 native outer');
  n9.cases++;
  for(const {name:regime,Q} of frames(6)){
    const E=changed(edges,Q),l=path(E,L,0),r=path(E,R,1),o=path(E,O,0);
    same(l,conj(Q[0],hl),'AH9 left gauge: '+name+'/'+regime);
    same(r,conj(Q[1],hr),'AH9 right gauge: '+name+'/'+regime);
    same(o,conj(Q[0],out),'AH9 outer gauge: '+name+'/'+regime);
    same(o,prod(E.a.value,r,inv(E.a.value),l),'AH9 transported composition');
    assert.equal(tr(o),tr(out));assert.equal(det(o),det(out));
    same(prod(o,inv(o)),I,'AH9 inverse cancellation');
    n9.gauge_checks++;
    if(regime!=='identity'){
      const bad={...E,f:edge(3,4,prod(inv(Q[3]),edges.f.value))};
      if(!eq(path(bad,O,0),conj(Q[0],out)))n9.bad_single_edge_detected++;
    }
  }
}
assert.deepEqual(n9,{cases:12,gauge_checks:72,bad_single_edge_detected:60});

const C=mul(A,B),c10={I,A,B,S};
const n10={cases:0,gauge_checks:0,bad_single_edge_detected:0};
for(const [n1,T1] of Object.entries(c10))for(const [n2,T2] of Object.entries(c10)){
  // AH10 top: 0,1,2,3; bottom: 4,5,6,7.
  const edges={t1:edge(0,1,T1),t2:edge(1,2,T2),t3:edge(2,3,I),
    b1:edge(4,5,mul(inv(A),T1)),b2:edge(5,6,mul(inv(B),T2)),b3:edge(6,7,inv(C)),
    v0:edge(0,4,I),v1:edge(1,5,I),v2:edge(2,6,I),v3:edge(3,7,I)};
  const l1=[step('t1'),step('v1'),step('b1',-1),step('v0',-1)];
  const l2=[step('t2'),step('v2'),step('b2',-1),step('v1',-1)];
  const l3=[step('t3'),step('v3'),step('b3',-1),step('v2',-1)];
  const outer=[step('t1'),step('t2'),step('t3'),step('v3'),step('b3',-1),step('b2',-1),step('b1',-1),step('v0',-1)];
  const h1=path(edges,l1,0),h2=path(edges,l2,1),h3=path(edges,l3,2),out=path(edges,outer,0);
  same(h1,A,'AH10 H1 local');same(h2,B,'AH10 H2 local');same(h3,C,'AH10 H3 local');
  same(out,prod(T1,T2,C,inv(T2),B,inv(T1),A),'AH10 native outer');
  n10.cases++;
  for(const {name:regime,Q} of frames(8)){
    const E=changed(edges,Q),x1=path(E,l1,0),x2=path(E,l2,1),x3=path(E,l3,2),o=path(E,outer,0);
    same(x1,conj(Q[0],h1),'AH10 H1 gauge '+n1+'/'+n2+'/'+regime);
    same(x2,conj(Q[1],h2),'AH10 H2 gauge '+n1+'/'+n2+'/'+regime);
    same(x3,conj(Q[2],h3),'AH10 H3 gauge '+n1+'/'+n2+'/'+regime);
    same(o,conj(Q[0],out),'AH10 outer gauge '+n1+'/'+n2+'/'+regime);
    const p01=E.t1.value,p02=mul(E.t1.value,E.t2.value);
    const h2base=prod(p01,x2,inv(p01)),h3base=prod(p02,x3,inv(p02));
    same(o,prod(h3base,h2base,x1),'AH10 transported composition');
    same(o,mul(h3base,mul(h2base,x1)),'AH10 left grouped');
    const h23=mul(prod(E.t2.value,x3,inv(E.t2.value)),x2);
    same(o,mul(prod(E.t1.value,h23,inv(E.t1.value)),x1),'AH10 right grouped');
    same(prod(inv(o),o),I,'AH10 loop inverse');
    assert.equal(tr(o),tr(out));assert.equal(det(o),det(out));
    n10.gauge_checks++;
    if(regime!=='identity'){
      const bad={...E,b1:edge(4,5,prod(inv(Q[4]),edges.b1.value))};
      if(!eq(path(bad,outer,0),conj(Q[0],out)))n10.bad_single_edge_detected++;
    }
  }
}
assert.deepEqual(n10,{cases:16,gauge_checks:96,bad_single_edge_detected:80});
const receipt={
  experiment:'PHMP-2 Stage 2',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  scope:'native exact SL(2,Z) edge-level local frame transformations, row-vector convention',
  ah9:n9,ah10:n10,
  result:'valid local frames conjugate loops at basepoints; inconsistent edge controls break covariance',
  nonclaims:'no physical gauge field, general relativity, U(2), Dirac, NBG-specific law, or AI memory advantage'
};
const sha256=createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256},null,2)+'\n',{flag:'wx'});
}
console.log('PHMP-2 Stage 2 PASS: '+JSON.stringify({ah9:n9,ah10:n10}));
console.log('receipt_sha256: '+sha256);
console.log('Origin SIMULATED / authority NONE; finite group transport, not new physics.');
