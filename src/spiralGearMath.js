export const TAU=2*Math.PI;
export const PHI=(1+Math.sqrt(5))/2;
// Pitch curves only; no actual tooth profiles or loads are modeled.
export function radius(angle,e,a=120){return a*(1-e*e)/(1+e*Math.cos(angle))}
export function drivenAngle(t,e){
  const q=(1-e)/(1+e);
  return -2*Math.atan2(q*Math.sin(t/2),Math.cos(t/2));
}
export function gearState(t,e,a=120){
  const output=drivenAngle(t,e),r1=radius(-t,e,a),r2=radius(Math.PI-output,e,a);
  return {input:t,output,r1,r2,ratio:-r1/r2,gap:r1+r2-2*a,centerDistance:2*a};
}
export function goldenRadius(t,r0=6){return r0*Math.pow(PHI,2*t/Math.PI)}
