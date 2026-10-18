import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Optical Keyhole O2: classical coherent-reference interferometer.
// This is a finite, simulated optics identity test, NOT physical measurement.
const z = (re, im = 0) => ({ re, im });
const asZ = x => typeof x === 'number' ? z(x) : x;
const add = (x, y) => { x=asZ(x); y=asZ(y); return z(x.re+y.re,x.im+y.im); };
const sub = (x, y) => { x=asZ(x); y=asZ(y); return z(x.re-y.re,x.im-y.im); };
const mul = (x, y) => { x=asZ(x); y=asZ(y); return z(x.re*y.re-x.im*y.im,x.re*y.im+x.im*y.re); };
const norm2 = x => { x=asZ(x); return x.re*x.re+x.im*x.im; };
const expi = angle => z(Math.cos(angle),Math.sin(angle));
const pi = Math.PI;
const approx = (a,b,label) => assert.ok(Math.abs(a-b)<1e-10,label+': '+a+' vs '+b);
let checks=0;
const check=fn=>{fn(); checks++;};

function scalarPorts(signal,reference){
  return {plus:norm2(mul(.5,add(signal,reference))),
          minus:norm2(mul(.5,sub(signal,reference)))};
}
const fieldIntensity = components => components.reduce((sum,component)=>sum+norm2(component),0);
function jonesPorts(signal,reference){
  assert.equal(signal.length,2); assert.equal(reference.length,2);
  return {
    plus:fieldIntensity(signal.map((x,i)=>mul(.5,add(x,reference[i])))),
    minus:fieldIntensity(signal.map((x,i)=>mul(.5,sub(x,reference[i]))))
  };
}
const scaleJones=(q,a)=>q.map(x=>mul(a,x));
const el0=[z(1),z(0)],el1=[z(0),z(1)];
const balanced=[z(1/Math.sqrt(2)),z(1/Math.sqrt(2))];

check(()=>approx(norm2(expi(1.234)),1,'no-reference intensity always 1'));
check(()=>approx(scalarPorts(expi(0),expi(0)).plus,1,'aligned constructive'));
check(()=>approx(scalarPorts(expi(0),expi(0)).minus,0,'aligned destructive'));
check(()=>approx(scalarPorts(expi(pi),expi(0)).plus,0,'single-arm pi flips outputs'));
check(()=>approx(scalarPorts(expi(pi),expi(0)).minus,1,'single-arm pi swaps outputs'));
check(()=>approx(scalarPorts(expi(pi),expi(pi)).plus,1,'common pi is invisible'));
check(()=>approx(scalarPorts(expi(pi),expi(pi)).minus,0,'common pi preserves null'));
check(()=>approx(scalarPorts(expi(0),expi(pi)).plus,0,'reference-arm pi relative flip'));
check(()=>approx(scalarPorts(expi(pi/2),expi(0)).plus,.5,'quarter turn balanced'));
check(()=>approx(scalarPorts(expi(pi/2),expi(pi/2)).plus,1,'shift both fields together'));

// Fixed reference phase 0 sees cos(theta) but cannot distinguish theta from -theta.
const theta=pi/3;
check(()=>approx(scalarPorts(expi(theta),expi(0)).plus,scalarPorts(expi(-theta),expi(0)).plus,'cosine single-output degeneracy'));
check(()=>assert.ok(Math.abs(scalarPorts(expi(theta),expi(pi/2)).plus-scalarPorts(expi(-theta),expi(pi/2)).plus)>.5,'quadrature sign resolution'));

const relativeSteps=128,referenceAngles=[0,pi/5,pi/2,pi,3*pi/2], commonAngles=[0,pi/3,pi,2*pi];
for(let k=0;k<relativeSteps;k++){
  const phi=2*pi*k/relativeSteps;
  const signalIntensity=norm2(expi(phi));
  check(()=>approx(signalIntensity,1,'unreferenced scalar phase blindness'));
  const zeroPort=scalarPorts(expi(phi),expi(0));
  const quadPort=scalarPorts(expi(phi),expi(pi/2));
  check(()=>approx(zeroPort.plus,(1+Math.cos(phi))/2,'cos quadrature'));
  check(()=>approx(quadPort.plus,(1+Math.sin(phi))/2,'sin quadrature'));
  // Paired quadratures recover a relative phase mod 2pi when fringe visibility is nonzero.
  const relative=Math.atan2(2*quadPort.plus-1,2*zeroPort.plus-1);
  check(()=>approx(Math.cos(relative),Math.cos(phi),'recovered relative phase cos'));
  check(()=>approx(Math.sin(relative),Math.sin(phi),'recovered relative phase sin'));
  for(const refAngle of referenceAngles){
    for(const common of commonAngles){
      const x=expi(phi+common), r=expi(refAngle+common);
      const out=scalarPorts(x,r);
      check(()=>approx(out.plus,(1+Math.cos(phi-refAngle))/2,'reference phase difference readout'));
      check(()=>approx(out.minus,(1-Math.cos(phi-refAngle))/2,'complementary output'));
      check(()=>approx(out.plus+out.minus,1,'ideal lossless two-port energy accounting'));
      check(()=>approx(norm2(x),1,'common signal field intensity'));
      check(()=>approx(norm2(r),1,'common reference field intensity'));
      check(()=>approx(jonesPorts(scaleJones(el0,x),scaleJones(el0,r)).plus,out.plus,'co-polarized Jones equals scalar'));
      const orthogonal=jonesPorts(scaleJones(el0,x),scaleJones(el1,r));
      check(()=>approx(orthogonal.plus,.5,'orthogonal polarization destroys fringe'));
      check(()=>approx(orthogonal.minus,.5,'orthogonal complementary port'));
      const balancedOut=jonesPorts(scaleJones(balanced,x),scaleJones(balanced,r));
      check(()=>approx(balancedOut.plus,out.plus,'arbitrary shared matched polarization same scalar fringe'));
    }
  }
}
// A swept, independently unknown reference phase erases the fringe *in its average*.
for(const phi of [0,pi/5,pi/2,pi,1.71*pi]){
  const randomPhaseGrid=Array.from({length:32},(_,i)=>2*pi*i/32);
  const averagePlus=randomPhaseGrid.reduce((t,eta)=>t+scalarPorts(expi(phi),expi(eta)).plus,0)/32;
  const averageMinus=randomPhaseGrid.reduce((t,eta)=>t+scalarPorts(expi(phi),expi(eta)).minus,0)/32;
  check(()=>approx(averagePlus,.5,'uniform phase-averaged plus output'));
  check(()=>approx(averageMinus,.5,'uniform phase-averaged minus output'));
}
const receipt={
  experiment:'PHMP Optical Keyhole O2 reference interferometry',version:'0.1.0',
  origin:'SIMULATED',authority:'NONE',
  model:'classical scalar and Jones coherent-reference interference',
  relative_phase_grid:relativeSteps,reference_angle_count:referenceAngles.length,
  common_phase_count:commonAngles.length,phase_averaging_count:32,
  checks_passed:checks,checks_total:checks,
  controls:['no reference cannot reveal isolated scalar global phase','coherently shifted signal and reference is unobservable','signal-only pi changes interference','orthogonal polarization removes interference','uniformly dephased reference averages fringe to 1/2','single cosine readout has sign ambiguity; quadrature resolves'],
  no_reserved_scoring:true,
  nonclaims:'no hardware data, no absolute phase measurement, no physical energy recycling, no quantum Dirac field, no novel NBG-specific prediction'
};
const receipt_sha256=createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,receipt_sha256},null,2)+'\n',{flag:'wx'});
}
console.log('PHMP Optical O2 PASS '+checks+'/'+checks+' classical interference assertions; PHMP-3 E2 untouched');
console.log('receipt_sha256: '+receipt_sha256);
