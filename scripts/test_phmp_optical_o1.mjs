import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Optical Keyhole O1: conventional *classical* Jones/Stokes algebra.
// No frozen PHMP-3 histories, learned models, quantum hardware, or physical data.
const z=(re,im=0)=>({re,im});
const as=x=>typeof x==='number'?z(x):x;
const plus=(a,b)=>{a=as(a);b=as(b);return z(a.re+b.re,a.im+b.im);};
const mul=(a,b)=>{a=as(a);b=as(b);return z(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);};
const conj=x=>z(as(x).re,-as(x).im);
const norm2=x=>{x=as(x);return x.re*x.re+x.im*x.im;};
const expi=theta=>z(Math.cos(theta),Math.sin(theta));
const scale=(c,a)=>mul(c,a);
const vec=(a,b)=>[as(a),as(b)];
const pi=Math.PI,h=1/Math.sqrt(2);
const horizontal=vec(1,0),diagonal=vec(h,h),rightCircular=vec(h,z(0,h));
const normalized=(theta,globalPhase=0)=>vec(scale(h,expi(globalPhase)),scale(h,expi(globalPhase+theta)));
const componentKeyhole=v=>v.map(norm2);
const inner=(u,v)=>plus(mul(conj(u[0]),v[0]),mul(conj(u[1]),v[1]));
const intensity=(u,v)=>norm2(inner(u,v));
const stokes=v=>{
  const product=mul(conj(v[0]),v[1]);
  return [norm2(v[0])-norm2(v[1]),2*product.re,2*product.im];
};
const approx=(x,y,name)=>assert.ok(Math.abs(x-y)<1e-11,name+': '+x+' vs '+y);
const eqArray=(x,y,name)=>{assert.equal(x.length,y.length);x.forEach((v,i)=>approx(v,y[i],name+'['+i+']'));};
const linear=normalized(0),circular=normalized(pi/2),oppositeCircular=normalized(-pi/2);
let checks=0;
function gate(fn){fn();checks++;}
gate(()=>eqArray(componentKeyhole(linear),[.5,.5],'45deg linear coarse observation'));
gate(()=>eqArray(componentKeyhole(circular),[.5,.5],'circular coarse observation'));
gate(()=>approx(intensity(diagonal,linear),1,'diagonal analyzer passes linear X'));
gate(()=>approx(intensity(diagonal,circular),.5,'diagonal analyzer halves circular Xprime'));
gate(()=>approx(intensity(rightCircular,linear),.5,'circular analyzer halves linear X'));
gate(()=>approx(intensity(rightCircular,circular),1,'matching circular analyzer passes Xprime'));
gate(()=>eqArray(stokes(linear),[0,1,0],'Poincare 45deg'));
gate(()=>eqArray(stokes(circular),[0,0,1],'Poincare right circular'));
gate(()=>eqArray(stokes(oppositeCircular),[0,0,-1],'opposite circular handedness'));
gate(()=>approx(intensity(diagonal,oppositeCircular),intensity(diagonal,circular),'diagonal analyzer blind to handedness'));
gate(()=>approx(intensity(rightCircular,oppositeCircular),0,'circular analyzer distinguishes opposite handedness'));
gate(()=>approx(intensity(diagonal,normalized(pi)),0,'orthogonal linear polarization rejected'));
// 96-step phase cycle with five global-phase references. Includes negative angles and repeated 2pi.
const phases=[-pi,0,pi/3,pi,2*pi],count=96;
for(let k=-count/2;k<=count/2;k++){
  const theta=2*pi*k/count,expectedStokes=[0,Math.cos(theta),Math.sin(theta)];
  for(const psi of phases){
    const w=normalized(theta,psi),s=stokes(w);
    gate(()=>eqArray(componentKeyhole(w),[.5,.5],'phase-blind component Keyhole'));
    gate(()=>eqArray(s,expectedStokes,'relative phase Stokes sphere'));
    gate(()=>approx(s.reduce((a,b)=>a+b*b,0),1,'unit Poincare sphere'));
    gate(()=>approx(intensity(diagonal,w),(1+Math.cos(theta))/2,'45-degree analyzer'));
    gate(()=>approx(intensity(rightCircular,w),(1+Math.sin(theta))/2,'circular analyzer'));
    gate(()=>approx(intensity(horizontal,w),.5,'horizontal component'));
    gate(()=>eqArray(stokes(normalized(theta,psi+pi)),s,'global sign unobservable'));
    gate(()=>eqArray(stokes(normalized(theta,psi+2*pi)),s,'2pi global phase unobservable'));
  }
}
gate(()=>eqArray(stokes(normalized(0,pi)),stokes(normalized(0,0)),'e^(i pi) global phase gives unchanged Stokes'));
gate(()=>eqArray(stokes(normalized(2*pi)),stokes(normalized(0)),'relative 2pi loop closes'));
gate(()=>assert.ok(Math.abs(stokes(normalized(pi/2))[2]-stokes(normalized(-pi/2))[2])>1,'opposite relative phases separate'));
const receipt={
  experiment:'PHMP Optical Keyhole O1',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  theory:'classical Jones vectors and Poincare Stokes sphere, no physical measurement',
  global_phase_samples:phases.length,relative_phase_sample_count:count+1,
  checks_passed:checks,checks_total:checks,
  witnesses:{
    coarse_x:[.5,.5],coarse_xprime:[.5,.5],
    diagonal_x:1,diagonal_xprime:.5,
    circular_x:.5,circular_xprime:1,
    stokes_x:[0,1,0],stokes_xprime:[0,0,1]
  },
  limitations:'standard optics identities; not new NBG physics, gauge field, AI memory or energy recovery; PHMP-3 E2 untouched'
};
const digest=createHash('sha256').update(JSON.stringify(receipt)).digest('hex');
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');
  assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt,sha256:digest},null,2)+'\n',{flag:'wx'});
}
console.log('OPTICAL KEYHOLE O1 PASS: '+checks+'/'+checks+' Jones/Stokes checks; coarse-equal states distinguishable by analyzer.');
console.log('PHMP-3 RESERVED EVALUATION NOT INVOKED. Origin SIMULATED / authority NONE.');
console.log('receipt_sha256: '+digest);
