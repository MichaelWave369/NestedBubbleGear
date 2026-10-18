import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// PHMP Quantum Boundary Q3: PREDECLARED finite-shot MONTE CARLO under
// textbook iid Born parity probabilities. Not physical Bell data.
// No PHMP-3 reserved memory cohort access.
const PI=Math.PI,ROOT2=Math.SQRT2,ALPHA=.05;
const SHOTS=Object.freeze([256,2048,16384,65536]),REPLICATES=8;
const SCENARIOS=Object.freeze([
  {id:'classical-null',gamma:0,visibility:1},
  {id:'weak-coherence',gamma:.25,visibility:1},
  {id:'weak-noisy',gamma:.25,visibility:.95},
  {id:'medium-coherence',gamma:.5,visibility:1},
  {id:'pure-Bell',gamma:1,visibility:1}
]);
const DESIGNS=Object.freeze(['fixed','gamma-predeclared']);
const FAMILY=SCENARIOS.length*DESIGNS.length*SHOTS.length*REPLICATES;
const alphaFamily=ALPHA/FAMILY;
let checks=0;
const check=fn=>{fn();checks++;};
const approx=(got,want,label,tol=1e-10)=>assert.ok(Math.abs(got-want)<tol,label+': '+got+' vs '+want);
const corr=(gamma,visibility,a,b)=>
  visibility*(Math.cos(2*a)*Math.cos(2*b)+gamma*Math.sin(2*a)*Math.sin(2*b));
const design=(gamma,kind)=>{
  const b=kind==='fixed'?PI/8:Math.atan(gamma)/2;
  return Object.freeze({a:0,ap:PI/4,b,bp:-b});
};
function expectedCHSH(gamma,visibility,kind){
  const {a,ap,b,bp}=design(gamma,kind);
  return corr(gamma,visibility,a,b)+corr(gamma,visibility,a,bp)
    +corr(gamma,visibility,ap,b)-corr(gamma,visibility,ap,bp);
}
// Four separately sampled joint measurement settings; their product ab has
// P(ab=+1)=(1+E)/2 (unbiased local marginals for this rho_gamma family).
function lcg(seed){
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function simulate(gamma,visibility,kind,n,seed){
  const {a,ap,b,bp}=design(gamma,kind);
  const settings=[[a,b,1],[a,bp,1],[ap,b,1],[ap,bp,-1]];
  const rnd=lcg(seed);let estimate=0;
  const correlations=[];
  for(const [left,right,sign] of settings){
    const e=corr(gamma,visibility,left,right);
    let plus=0;
    const pPlus=(1+e)/2;
    for(let shot=0;shot<n;shot++)if(rnd()<pPlus)plus++;
    const ehat=2*plus/n-1;
    correlations.push(ehat);
    estimate+=sign*ehat;
  }
  return {estimate,correlations};
}
// If S_true<=2 under a fixed local model, union + Hoeffding yields
// Pr[S_hat>2+t] <= 4 exp(-n t^2 / 32), n independent shots per setting.
// This is deliberately conservative, not a quantum-optimal likelihood test.
const threshold=(n,alpha)=>2+Math.sqrt(32*Math.log(4/alpha)/n);
const minMeanShots=(s,alpha)=>s<=2?null:Math.ceil(32*Math.log(4/alpha)/((s-2)**2));
const pptMin=(gamma,visibility)=>(1-visibility)/4-visibility*gamma/2;
const rows=[];
for(const [scenarioIndex,scenario] of SCENARIOS.entries()){
  const {gamma,visibility}=scenario;
  check(()=>assert.ok(gamma>=0&&gamma<=1&&visibility>=0&&visibility<=1));
  check(()=>approx(expectedCHSH(gamma,visibility,'fixed'),visibility*ROOT2*(1+gamma),'fixed CHSH'));
  check(()=>approx(expectedCHSH(gamma,visibility,'gamma-predeclared'),visibility*2*Math.sqrt(1+gamma*gamma),'predeclared targeted CHSH'));
  check(()=>approx(corr(gamma,visibility,0,0),visibility,'Z/Z is visibility-calibrated, not gamma-sensitive'));
  check(()=>approx(corr(gamma,visibility,PI/4,PI/4),visibility*gamma,'X/X shows coherence'));
  // This depolarizing + dephasing model has rho' = v*rho_gamma + (1-v)I/4.
  // PPT minimum eigenvalue is (1-v)/4 - v*gamma/2.
  if(scenario.id==='weak-noisy'){
    check(()=>assert.ok(pptMin(gamma,visibility)<0,'weak noisy state remains entangled mathematically'));
    check(()=>assert.ok(expectedCHSH(gamma,visibility,'gamma-predeclared')<2,'weak noisy state does not violate CHSH in expectation'));
  }
  for(const [designIndex,kind] of DESIGNS.entries()){
    const expected=expectedCHSH(gamma,visibility,kind);
    check(()=>assert.ok(expected<=2*ROOT2+1e-10,'Tsirelson mathematical ceiling'));
    for(const n of SHOTS){
      const cutoff=threshold(n,alphaFamily);
      const nominalCutoff=threshold(n,ALPHA);
      check(()=>assert.ok(cutoff>=nominalCutoff,'familywise threshold stricter than nominal'));
      check(()=>assert.ok(cutoff>2,'finite sample threshold above classical bound'));
      let nominalHits=0,familyHits=0;
      const sampleEstimates=[];
      for(let rep=0;rep<REPLICATES;rep++){
        const seed=(0x51430000+scenarioIndex*1000000+designIndex*100000+n*10+rep*379)>>>0;
        const result=simulate(gamma,visibility,kind,n,seed);
        const again=simulate(gamma,visibility,kind,n,seed);
        check(()=>assert.deepEqual(result,again,'PRNG deterministic replay'));
        check(()=>assert.ok(result.correlations.every(x=>x>=-1&&x<=1),'sample parity correlations bounded'));
        check(()=>assert.ok(Math.abs(result.estimate)<=4,'CHSH sample algebra bound 4'));
        nominalHits+=Number(result.estimate>nominalCutoff);
        familyHits+=Number(result.estimate>cutoff);
        sampleEstimates.push(result.estimate);
      }
      const sampleMean=sampleEstimates.reduce((s,x)=>s+x,0)/REPLICATES;
      rows.push({
        scenario:scenario.id,gamma,visibility,design:kind,
        shots_per_setting:n,shots_per_replication:4*n,replications:REPLICATES,
        true_CHSH:expected,ppt_min_eigenvalue:pptMin(gamma,visibility),
        nominal_alpha:ALPHA,nominal_cutoff:nominalCutoff,nominal_flags:nominalHits,
        familywise_alpha_per_test:alphaFamily,familywise_cutoff:cutoff,familywise_flags:familyHits,
        sample_mean_CHSH:sampleMean,
        prereg_sufficient_mean_above_cutoff_n:minMeanShots(expected,alphaFamily)
      });
    }
  }
}
// Tighten important theory/negative-control identities. No stochastic
// detection-count assertions: even null/low-signal results are retained.
check(()=>approx(pptMin(0,1),0,'separable gamma0 PPT boundary'));
check(()=>approx(pptMin(1,1),-.5,'pure Bell PPT'));
check(()=>approx(expectedCHSH(.25,1,'gamma-predeclared'),2*Math.sqrt(1+.25*.25),'weak optimized'));
check(()=>assert.ok(expectedCHSH(.25,.95,'gamma-predeclared')<2,'visibility can suppress CHSH despite NPT'));
check(()=>assert.ok(expectedCHSH(.25,1,'fixed')<2,'unoptimized settings miss weak coherence'));
check(()=>assert.ok(expectedCHSH(.25,1,'gamma-predeclared')>2,'ideal tailored settings violate'));
check(()=>assert.equal(rows.length,SCENARIOS.length*DESIGNS.length*SHOTS.length));
check(()=>assert.equal(rows.reduce((s,r)=>s+r.replications,0),FAMILY));
const receipt={
  experiment:'PHMP Quantum Boundary Q3: finite-shot Bell observer qualification',
  version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  protocol:{alpha_family:ALPHA,family_tests:FAMILY,correction:'Bonferroni across all planned scenario x setting x shot-budget x replication comparisons',
    shots_per_setting:SHOTS,replications:REPLICATES,
    designs:DESIGNS,seed_base:'0x51430000',uniform_PRNG:'32-bit LCG',
    null_tail:'Pr(S_hat>2+t)<=4exp(-n*t^2/32) under four independent bounded iid setting samples',
    physical_readout_model:'Born parity iid plus uniform depolarizing visibility'},
  scenarios:SCENARIOS,
  check_count:checks,results:rows,
  nonclaims:'no physical Bell test, no finite-shot guaranteed detection, no NBG quantum advantage, no PHMP-3 held-out memory evaluation'
};
const digest=createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,receipt_sha256:digest},null,2)+'\n',{flag:'wx'});
}
console.log('QUANTUM Q3 PASS '+checks+' checks; '+rows.length+' scenario-setting-budget rows / '+FAMILY+' finite-shot replications.');
console.log('Weak gamma=.25 optimal expected: '+expectedCHSH(.25,1,'gamma-predeclared')+'; at visibility .95: '+expectedCHSH(.25,.95,'gamma-predeclared'));
console.log('Two-byte memory held-out cohort NOT generated/scored; physical experiment NOT performed.');
console.log('receipt_sha256: '+digest);
