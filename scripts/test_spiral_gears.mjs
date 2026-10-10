import assert from 'node:assert/strict';
import {TAU,PHI,gearState,drivenAngle,goldenRadius} from '../src/spiralGearMath.js';
const near=(a,b,tol=2e-8)=>assert.ok(Math.abs(a-b)<tol,String(a)+' != '+String(b));
for(const e of [0,.12,.32,.55]){
  near(drivenAngle(0,e),0);near(drivenAngle(TAU,e),-TAU);
  for(let i=0;i<=360;i++){
    const t=i*TAU/360,s=gearState(t,e);
    near(s.r1+s.r2,240);near(s.gap,0);
    assert.ok(s.r1>0&&s.r2>0);
    near(s.ratio,-s.r1/s.r2);
    if(i>0&&i<360){
      const h=1e-6;
      near((drivenAngle(t+h,e)-drivenAngle(t-h,e))/(2*h),s.ratio);
    }
  }
}
near(gearState(1,0).ratio,-1);
for(const t of [0,.4,1,2.3])near(goldenRadius(t+Math.PI/2)/goldenRadius(t),PHI);
console.log('PASS: elliptical pitch contact, phase derivative, circular control, closure, golden growth');
