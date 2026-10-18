import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Quantum Boundary Q1. Exact-formula finite simulations, not quantum hardware.
// Distinguishes Bell-state coherence from Z-basis classical correlation.
const I=[[1,0],[0,1]],X=[[0,1],[1,0]],Z=[[1,0],[0,-1]];
const zero=(r,c)=>Array.from({length:r},()=>Array(c).fill(0));
const mm=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((s,v,k)=>s+v*B[k][j],0)));
const sub=(A,B)=>A.map((r,i)=>r.map((v,j)=>v-B[i][j]));
const tr=A=>A.reduce((s,r,i)=>s+r[i],0);
const tensor=(A,B)=>{
  const out=zero(A.length*B.length,A[0].length*B[0].length);
  for(let i=0;i<A.length;i++)for(let j=0;j<A[0].length;j++)
    for(let k=0;k<B.length;k++)for(let l=0;l<B[0].length;l++)
      out[i*B.length+k][j*B[0].length+l]=A[i][j]*B[k][l];
  return out;
};
const traceProduct=(rho,op)=>tr(mm(rho,op));
const almost=(a,b,name)=>assert.ok(Math.abs(a-b)<1e-11,name+': '+a+' expected '+b);
let checks=0;
const check=fn=>{fn();checks++;};

// rho = |Phi+><Phi+|, versus rho_mix = 1/2 (|00><00|+|11><11|).
// Identical local marginals and 0/1 basis correlations; only Phi+ is entangled.
const bell=zero(4,4),mixture=zero(4,4),product=zero(4,4);
for(const rho of [bell,mixture]){rho[0][0]=.5;rho[3][3]=.5;}
bell[0][3]=.5;bell[3][0]=.5;
product[0][0]=1;

function measurement(theta){
  const cos=Math.cos(2*theta),sin=Math.sin(2*theta);
  return [[cos,sin],[sin,-cos]];
}
function projector(theta,sign){
  assert.ok(sign===1||sign===-1,'measurement result sign required');
  const A=measurement(theta);
  return A.map((row,i)=>row.map((v,j)=>(Number(i===j)+sign*v)/2));
}
function probabilities(rho,a,b){
  const out={};
  for(const s of [1,-1])for(const t of [1,-1])
    out[String(s)+':'+String(t)]=traceProduct(rho,tensor(projector(a,s),projector(b,t)));
  return out;
}
function correlation(rho,a,b){
  const P=probabilities(rho,a,b);
  return P['1:1']+P['-1:-1']-P['1:-1']-P['-1:1'];
}
const chsh=(rho,a,ap,b,bp)=>correlation(rho,a,b)+correlation(rho,a,bp)+correlation(rho,ap,b)-correlation(rho,ap,bp);

check(()=>almost(tr(bell),1,'Bell trace normalized'));
check(()=>almost(tr(mixture),1,'Mixture trace normalized'));
check(()=>almost(tr(product),1,'Product trace normalized'));
check(()=>almost(bell[0][3],.5,'Bell coherence'));
check(()=>almost(mixture[0][3],0,'Mixture has no off-diagonal coherence'));

for(const [name,rho] of [['Bell',bell],['Mixture',mixture]]){
  const p=probabilities(rho,0,0);
  check(()=>almost(p['1:1'],.5,name+' matching |00>'));
  check(()=>almost(p['-1:-1'],.5,name+' matching |11>'));
  check(()=>almost(p['1:-1'],0,name+' no |01>'));
  check(()=>almost(p['-1:1'],0,name+' no |10>'));
}
// Local marginals are the same maximally mixed I/2 for Bell and mixture.
// A single measurement basis, even with perfectly matching outcomes,
// cannot establish entanglement or rule out classical shared randomness.
for(const angle of [0,Math.PI/10,Math.PI/4,Math.PI/2]){
  const pBell=probabilities(bell,angle,0),pMix=probabilities(mixture,angle,0);
  for(const s of [1,-1]){
    check(()=>almost(pBell[s+':1']+pBell[s+':-1'],.5,'Bell local marginal'));
    check(()=>almost(pMix[s+':1']+pMix[s+':-1'],.5,'Mixture local marginal'));
  }
}
// Standard CHSH settings for linear-polarization observable
// A(theta)=cos(2theta) Z+sin(2theta) X.
// Bell Phi+: E(a,b)=cos(2(a-b)), mixture: E(a,b)=cos(2a)cos(2b).
const [a,ap,b,bp]=[0,Math.PI/4,Math.PI/8,-Math.PI/8];
check(()=>almost(chsh(bell,a,ap,b,bp),2*Math.SQRT2,'Bell Tsirelson example'));
check(()=>almost(chsh(mixture,a,ap,b,bp),Math.SQRT2,'Separable mixture no CHSH violation'));
check(()=>almost(chsh(product,a,ap,b,bp),Math.SQRT2,'Product state no CHSH violation'));
check(()=>assert.ok(chsh(bell,a,ap,b,bp)>2,'Bell math violates CHSH classical bound'));
check(()=>assert.ok(chsh(mixture,a,ap,b,bp)<=2,'Classically correlated mixture obeys CHSH bound'));
check(()=>assert.ok(chsh(product,a,ap,b,bp)<=2,'Product control obeys CHSH bound'));

const angles=Array.from({length:25},(_,i)=>(i-12)*Math.PI/24);
for(const first of angles)for(const second of angles){
  for(const [name,rho] of [['Bell',bell],['Mixture',mixture],['Product',product]]){
    const p=probabilities(rho,first,second);
    const values=Object.values(p);
    check(()=>almost(values.reduce((s,x)=>s+x,0),1,name+' probabilities normalized'));
    check(()=>assert.ok(values.every(x=>x>=-1e-12&&x<=1+1e-12),name+' probabilities valid'));
    const actual=correlation(rho,first,second);
    const theory=name==='Bell'?Math.cos(2*(first-second)):
      Math.cos(2*first)*Math.cos(2*second);
    check(()=>almost(actual,theory,name+' conventional correlation'));
    check(()=>assert.ok(Math.abs(actual)<=1+1e-12,'correlation bounded'));
  }
}
// Finite 2x2 matrix commutators cannot realize the canonical CCR [x,p]=i*hbar*I:
// trace([U,V])=0 for any finite square matrices, but trace(i*hbar*I)!=0.
const bracket=sub(mm(X,Z),mm(Z,X));
check(()=>almost(tr(bracket),0,'finite matrix commutator trace'));
check(()=>almost(bracket[0][1],-2,'Pauli [X,Z] upper element'));
check(()=>almost(bracket[1][0],2,'Pauli [X,Z] lower element'));
check(()=>assert.notDeepEqual(bracket,zero(2,2),'Pauli operators noncommute'));

const receipt={
  experiment:'PHMP Quantum Boundary Q1: Bell vs correlated classical mixture',
  version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  model:'standard two-qubit finite density matrices and Born measurement probabilities',
  angle_pairs:angles.length**2,control_states:['Phi+ pure Bell','separable 00/11 mixture','separable product |00>'],
  checks_passed:checks,checks_total:checks,
  z_basis_control:'Bell and mixture both return 00/11 with probabilities 1/2 each',
  chsh_math:{bell:2*Math.SQRT2,mixture:Math.SQRT2,product:Math.SQRT2,classical_bound:2},
  exact_nonclaims:'no actual Bell experiment, locality test, loophole analysis, quantum device, quantum NBG memory, or new physical law',
  phmp3_reserved_untouched:true
};
const digest=createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:digest},null,2)+'\n',{flag:'wx'});
}
console.log('PHMP QUANTUM Q1 PASS: '+checks+'/'+checks+' mathematical assertions; Bell-vs-mixture CHSH 2sqrt2 vs sqrt2.');
console.log('PHMP-3 held-out evaluation was NOT invoked. Origin SIMULATED; authority NONE.');
console.log('receipt_sha256: '+digest);
