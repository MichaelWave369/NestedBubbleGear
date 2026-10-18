import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Quantum Boundary Q2: coherence-dependent distinguishability in a STANDARD
// two-qubit dephasing family. Purely mathematical, not physical experiment.
const sqr = x => x * x;
const zero = (rows, cols) => Array.from({length: rows}, () => Array(cols).fill(0));
const MM = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
const tensor = (A, B) => {
  const T = zero(A.length * B.length, A[0].length * B[0].length);
  for (let i=0; i<A.length; i++) for (let j=0; j<A[0].length; j++)
    for (let k=0; k<B.length; k++) for (let l=0; l<B[0].length; l++)
      T[i*B.length+k][j*B[0].length+l] = A[i][j]*B[k][l];
  return T;
};
const trace = X => X.reduce((s, row, i) => s + row[i], 0);
const expectation = (rho, O) => trace(MM(rho, O));
const approx = (actual, target, label) => assert.ok(Math.abs(actual-target)<1e-10, label + ': '+actual+' vs '+target);
const eqMatrix = (A, B, label) => {
  assert.equal(A.length, B.length, label + ' row count');
  A.forEach((row,i)=>row.forEach((x,j)=>approx(x,B[i][j],label+'['+i+','+j+']')));
};
const rhoGamma = gamma => {
  if (gamma < 0 || gamma > 1) throw Error('Gamma must be between 0 and 1');
  const rho = zero(4,4);
  rho[0][0] = rho[3][3] = .5;
  rho[0][3] = rho[3][0] = gamma/2;
  return rho;
};
const partialTransposeB = rho => {
  const out = zero(4,4);
  for (let a=0; a<2; a++) for (let b=0; b<2; b++)
    for (let c=0; c<2; c++) for (let d=0; d<2; d++)
      out[2*a+d][2*c+b] = rho[2*a+b][2*c+d];
  return out;
};
const rhoBell = rhoGamma(1), rhoMixture = rhoGamma(0);
const zObservable = theta => {
  const c=Math.cos(2*theta),s=Math.sin(2*theta);
  return [[c,s],[s,-c]];
};
const projector = (theta,sign) => {
  assert.ok(sign === 1 || sign === -1);
  const O=zObservable(theta);
  return O.map((row,i)=>row.map((x,j)=>(Number(i===j)+sign*x)/2));
};
const probs = (rho,alpha,beta) => {
  const ans={};
  for (const a of [1,-1]) for (const b of [1,-1]) {
    ans[a+':'+b] = expectation(rho, tensor(projector(alpha,a),projector(beta,b)));
  }
  return ans;
};
const correlation = (rho,alpha,beta) => expectation(rho,tensor(zObservable(alpha),zObservable(beta)));
const chsh = (rho,a,ap,b,bp) => correlation(rho,a,b)+correlation(rho,a,bp)+correlation(rho,ap,b)-correlation(rho,ap,bp);
const compareM = (A,B)=>A.flat().every((x,i)=>Math.abs(x-B.flat()[i])<1e-10);
let checks=0;
const gate = fn => {fn(); checks++;};

gate(()=>eqMatrix(rhoMixture,[[.5,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,.5]],'separable mixture'));
gate(()=>eqMatrix(rhoBell,[[.5,0,0,.5],[0,0,0,0],[0,0,0,0],[.5,0,0,.5]],'Bell pure'));
gate(()=>assert.throws(()=>rhoGamma(-.1),'reject gamma below 0'));
gate(()=>assert.throws(()=>rhoGamma(1.1),'reject gamma above 1'));
const gammaGrid=Array.from({length: 21}, (_,i)=>i/20);
const angles=Array.from({length: 17},(_,i)=>(i-8)*Math.PI/16);
const exemplars=[];
for (const gamma of gammaGrid) {
  const rho=rhoGamma(gamma);
  const finiteChannel=rhoBell.map((row,i)=>row.map((x,j)=>(1+gamma)/2*rhoBell[i][j]
    + (1-gamma)/2*(i===0||i===1 ? 1 : -1)*(j===0||j===1 ? 1 : -1)*rhoBell[i][j]));
  gate(()=>eqMatrix(rho,finiteChannel,'dephasing phase-flip channel mixture'));
  gate(()=>approx(trace(rho),1,'density trace'));
  gate(()=>approx(expectation(rho,tensor([[1,0],[0,-1]],[[1,0],[0,-1]])),1,'Z correlation'));
  gate(()=>approx(expectation(rho,tensor([[0,1],[1,0]],[[0,1],[1,0]])),gamma,'X correlation reveals coherence'));
  // Spectrum(rho)=(1+-gamma)/2, 0, 0; positive density matrices.
  gate(()=>assert.ok((1-gamma)/2>=0,'density nonnegative eigenvalue'));
  // Partial transpose eigenvalues: 1/2,1/2,gamma/2,-gamma/2.
  // For gamma>0, NPT criterion proves this two-qubit family is entangled.
  const pt=partialTransposeB(rho);
  const antisym=[0,1/Math.sqrt(2),-1/Math.sqrt(2),0];
  const ptTimesVec=pt.map(row=>row.reduce((s,x,k)=>s+x*antisym[k],0));
  const minRayleigh=antisym.reduce((s,x,k)=>s+x*ptTimesVec[k],0);
  gate(()=>approx(minRayleigh,-gamma/2,'partial transpose negative-eigenvalue witness'));
  gate(()=>ptTimesVec.forEach((x,k)=>approx(x,-gamma/2*antisym[k],'partial transpose eigenvector')));
  const z=probs(rho,0,0);
  gate(()=>approx(z['1:1'],.5,'matching 00 is always 1/2'));
  gate(()=>approx(z['-1:-1'],.5,'matching 11 is always 1/2'));
  gate(()=>approx(z['1:-1'],0,'cross 01 never observed in Z'));
  gate(()=>approx(z['-1:1'],0,'cross 10 never observed in Z'));
  const fixed=chsh(rho,0,Math.PI/4,Math.PI/8,-Math.PI/8);
  const optAngle=Math.atan(gamma)/2;
  const optimized=chsh(rho,0,Math.PI/4,optAngle,-optAngle);
  gate(()=>approx(fixed,Math.SQRT2*(1+gamma),'fixed CHSH gamma curve'));
  gate(()=>approx(optimized,2*Math.sqrt(1+sqr(gamma)),'optimized CHSH gamma curve'));
  gate(()=>assert.ok(optimized >= fixed-1e-10,'optimized not less than fixed'));
  gate(()=>assert.equal(fixed>2+1e-10,gamma>Math.SQRT2-1+1e-10,'fixed CHSH crossing'));
  gate(()=>assert.equal(optimized>2+1e-10,gamma>0,'optimized CHSH crossing'));
  gate(()=>approx(correlation(rho,Math.PI/4,Math.PI/4),gamma,'X/X measurement differs with gamma'));
  for (const alpha of angles) for (const beta of angles){
    const ps=probs(rho,alpha,beta);
    gate(()=>approx(Object.values(ps).reduce((s,x)=>s+x,0),1,'probability normalization'));
    gate(()=>assert.ok(Object.values(ps).every(x=>x>=-1e-10&&x<=1+1e-10),'Born probabilities in [0,1]'));
    gate(()=>approx(correlation(rho,alpha,beta),Math.cos(2*alpha)*Math.cos(2*beta)+gamma*Math.sin(2*alpha)*Math.sin(2*beta),'correlation matches dephasing formula'));
    gate(()=>approx(ps['1:1']+ps['1:-1'],.5,'Alice marginal 1/2'));
    gate(()=>approx(ps['1:1']+ps['-1:1'],.5,'Bob marginal 1/2'));
  }
  if ([0,.25,.5,.75,1].includes(gamma)) exemplars.push({gamma,fixed_chsh:fixed,optimal_chsh:optimized,xx_correlation:gamma,pt_min_eigenvalue:-gamma/2});
}
gate(()=>assert.ok(compareM(rhoGamma(0),rhoMixture),'gamma zero matches Q1 mixture'));
gate(()=>assert.ok(compareM(rhoGamma(1),rhoBell),'gamma one matches Q1 Bell'));
gate(()=>approx(chsh(rhoGamma(.25),0,Math.PI/4,Math.atan(.25)/2,-Math.atan(.25)/2),2*Math.sqrt(1+.25*.25),'small coherence optimal detection'));
gate(()=>assert.ok(chsh(rhoGamma(.25),0,Math.PI/4,Math.PI/8,-Math.PI/8)<2,'fixed-setting observer misses weak coherence for CHSH violation'));
const receipt={
  experiment:'PHMP Quantum Boundary Q2: dephasing continuum',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  family:'rho(gamma)=1/2[|00><00|+|11><11|+gamma(|00><11|+|11><00|)]',
  gamma_points:gammaGrid.length,angle_pairs_per_gamma:angles.length*angles.length,
  checks_passed:checks,checks_total:checks,examples:exemplars,
  crossing_fixed_gamma:Math.SQRT2-1,
  controls:['all Z-basis probabilities unchanged for every gamma','both local marginals I/2','X/X coherence correlation gamma','relative phase-flip dephasing channel','fixed vs optimized CHSH observer choices','partial transpose negative for gamma>0'],
  claim_boundary:'standard simulated qubit Born predictions; no Bell hardware, no NBG-specific quantum prediction, no PHMP-3 heldout scoring'
};
const receiptSHA256=createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
if (process.argv.length>2) {
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,receiptSHA256},null,2)+'\n',{flag:'wx'});
}
console.log('QUANTUM BOUNDARY Q2 PASS '+checks+'/'+checks+' mathematical controls (no reserved memory evaluation).');
console.log('examples: '+JSON.stringify(exemplars));
console.log('receiptSHA256: '+receiptSHA256);
