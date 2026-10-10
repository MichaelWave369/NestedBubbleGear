import {useEffect,useMemo,useState} from 'react';
import {TAU,PHI,radius,gearState,goldenRadius} from './spiralGearMath.js';
import './spiralGearLab.css';
const A=120,L=218,R=458,Y=205;
function pitchPath(e){
  return Array.from({length:181},(_,i)=>{
    const t=i*TAU/180,r=radius(t,e,A);
    return (i?'L':'M')+(r*Math.cos(t)).toFixed(2)+','+(r*Math.sin(t)).toFixed(2);
  }).join(' ')+' Z';
}
const SPIRAL=Array.from({length:201},(_,i)=>{
  const t=i*3*Math.PI/200,r=goldenRadius(t);
  return (i?'L':'M')+(r*Math.cos(t)).toFixed(2)+','+(r*Math.sin(t)).toFixed(2);
}).join(' ');
function Wheel({x,angle,e,color}){
  const path=useMemo(()=>pitchPath(e),[e]);
  return <g transform={'translate('+x+' '+Y+') rotate('+(angle*180/Math.PI)+')'}>
    <path d={path} stroke={color} strokeWidth="3" fill={color} fillOpacity=".075"/>
    <path d={path} stroke={color} strokeWidth="13" strokeOpacity=".05" fill="none"/>
    {Array.from({length:12},(_,i)=>{
      const t=i*TAU/12,r=radius(t,e,A);
      return <g key={i}>
        <line x1={24*Math.cos(t)} y1={24*Math.sin(t)}
          x2={r*.82*Math.cos(t)} y2={r*.82*Math.sin(t)}
          stroke={color} opacity=".4"/>
        <circle cx={r*.93*Math.cos(t)} cy={r*.93*Math.sin(t)} r="2" fill={color}/>
      </g>;
    })}
    <circle r="20" fill="#091811" stroke={color} strokeWidth="2"/>
    <circle r="7" fill={color}/>
    <line x1="0" y1="0" x2={radius(0,e,A)*.76} y2="0" stroke={color}
      strokeWidth="3" strokeLinecap="round"/>
  </g>;
}
function RatioPlot({e,t}){
  const d=useMemo(()=>Array.from({length:121},(_,i)=>{
    const theta=i*TAU/120,s=gearState(theta,e,A);
    return (i?'L':'M')+(12+550*i/120).toFixed(2)+','+(68-35*Math.log(-s.ratio)).toFixed(2);
  }).join(' '),[e]);
  const x=12+550*t/TAU,y=68-35*Math.log(-gearState(t,e,A).ratio);
  return <div className="sgl-graph">
    <div className="sgl-minor">Speed-ratio trace <small>|ω₂/ω₁| vs driver phase</small></div>
    <svg viewBox="0 0 575 138" role="img" aria-label="Graph of variable output speed ratio">
      <line x1="12" x2="562" y1="68" y2="68" stroke="#88a997" strokeDasharray="5 6"/>
      <path d={d} fill="none" stroke="#73ffc5" strokeWidth="3"/>
      <line x1={x} x2={x} y1="12" y2="122" stroke="#ffc56f" strokeDasharray="3 5"/>
      <circle cx={x} cy={y} r="5" fill="#ffc56f"/>
      <text x="14" y="62">1:1</text><text x="14" y="133">0°</text>
      <text x="528" y="133">360°</text>
    </svg>
  </div>;
}
export default function SpiralGearLab(){
  const [e,setE]=useState(.32),[t,setT]=useState(0);
  const [speed,setSpeed]=useState(.23),[spiral,setSpiral]=useState(true);
  const [run,setRun]=useState(()=>typeof window!=='undefined'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const s=gearState(t,e,A);
  useEffect(()=>{
    if(!run)return;
    let frame,prev;
    const tick=(now)=>{
      if(prev!==undefined)setT(old=>(old+Math.min((now-prev)/1000,.06)*speed*TAU)%TAU);
      prev=now;frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[run,speed]);
  function download(){
    const receipt={schema:'nbg.spiral-gear-lab.v1',origin:'SIMULATED',
      authority:'DEMONSTRATION_ONLY',scope:'Analytic pitch curves; not manufactured gear teeth',
      goldenOverlay:{enabled:spiral,phi:PHI,meshes:false},
      settings:{eccentricity:e,inputRevPerSecond:speed},state:s,
      cycle:{input:TAU,output:gearState(TAU,e,A).output}};
    const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='nbg-spiral-gears.json';
    a.click();URL.revokeObjectURL(url);
  }
  return <section id="spiral-gears" className="section sgl">
    <div className="section-label">SPIRAL GEAR LAB · INTERACTIVE MATHEMATICS</div>
    <h2>Variable motion. <em>Golden geometry.</em></h2>
    <p className="sgl-intro">Watch two matched non-circular pitch curves exchange motion.
      Vary the eccentricity to see the driven gear accelerate and decelerate while
      the driver remains steady. Overlay the golden-ratio spiral as a visual reference.</p>
    <div className="sgl-layout">
      <div className="sgl-display">
        <div className="sgl-legend"><span className="sgl-green">● Driver</span>
          <span className="sgl-blue">● Driven</span><span className="sgl-gold">● Golden overlay</span></div>
        <svg className="sgl-svg" viewBox="0 0 680 408" role="img"
          aria-label="Elliptical pitch curves turning oppositely with changing angular ratio; separate golden spiral overlay">
          <defs><pattern id="sgl-background" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0 L0 0 0 24" fill="none" stroke="#73ffc5" strokeOpacity=".085"/>
          </pattern></defs>
          <rect width="680" height="408" fill="url(#sgl-background)"/>
          <line x1="20" x2="660" y1={Y} y2={Y} stroke="#90afa0" strokeDasharray="6 8" opacity=".5"/>
          <Wheel x={L} angle={t} e={e} color="#73ffc5"/>
          <Wheel x={R} angle={s.output} e={e} color="#8bc9ff"/>
          {spiral&&<g transform={'translate('+L+' '+Y+') rotate('+(t*180/Math.PI)+')'}>
            <path d={SPIRAL} fill="none" stroke="#ffc56f" strokeWidth="2.8"
              strokeLinecap="round"/>
          </g>}
          <circle cx={L+s.r1} cy={Y} r="13" fill="none" stroke="#dfffee" opacity=".65"/>
          <circle cx={L+s.r1} cy={Y} r="4" fill="#dfffee"/>
          <line x1={L+s.r1} x2={L+s.r1} y1={Y+16} y2="364"
            stroke="#dfffee" strokeDasharray="3 7" opacity=".4"/>
          <text x={L+s.r1} y="385" textAnchor="middle" fill="#d4f4e4" fontSize="11">PITCH CONTACT</text>
          <text x={L} y="29" textAnchor="middle" fill="#73ffc5" fontSize="13">↺ DRIVER</text>
          <text x={R} y="29" textAnchor="middle" fill="#8bc9ff" fontSize="13">DRIVEN ↻</text>
        </svg>
        <div className="sgl-caption">{e===0?'CIRCULAR CONTROL · CONSTANT 1:1':'ELLIPTICAL PITCH MODEL · VARIABLE RATIO'}
          <small>No gear teeth or contact forces simulated</small></div>
      </div>
      <div className="sgl-panel">
        <div className="sgl-minor">Control console <small>SIMULATED · NOT AN AH RESULT</small></div>
        <div className="sgl-actions">
          <button className="sgl-primary" onClick={()=>setRun(v=>!v)}>{run?'Ⅱ Pause':'▶ Play'}</button>
          <button onClick={()=>{setRun(false);setT(0)}}>↺ Reset</button>
          <button onClick={()=>setE(v=>v===0?.32:0)}>{e===0?'Ellipse model':'Circle control'}</button>
        </div>
        <label htmlFor="sgl-e">Eccentricity <strong>{e.toFixed(2)}</strong></label>
        <input id="sgl-e" type="range" min="0" max=".55" step=".01" value={e}
          onChange={event=>setE(Number(event.target.value))}/>
        <div className="sgl-hints"><span>0 = circle</span><span>.55 = more variation</span></div>
        <label htmlFor="sgl-speed">Driver speed <strong>{speed.toFixed(2)} rev/s</strong></label>
        <input id="sgl-speed" type="range" min=".05" max="1" step=".01" value={speed}
          onChange={event=>setSpeed(Number(event.target.value))}/>
        <label htmlFor="sgl-angle">Driver phase <strong>{(t*180/Math.PI).toFixed(1)}°</strong></label>
        <input id="sgl-angle" type="range" min="0" max="360" step=".5" value={t*180/Math.PI}
          onChange={event=>{setRun(false);setT(Number(event.target.value)*TAU/360)}}/>
        <div className="sgl-hints"><span>0°</span><span>360° full cycle</span></div>
        <label className="sgl-toggle"><input type="checkbox" checked={spiral}
          onChange={event=>setSpiral(event.target.checked)}/>
          Golden logarithmic spiral (visual reference, not a gear)</label>
        <div className="sgl-stats">
          <div><span>LIVE ω₂ / ω₁</span><strong>{s.ratio.toFixed(3)}×</strong></div>
          <div><span>OUTPUT ANGLE</span><strong>{(s.output*180/Math.PI).toFixed(1)}°</strong></div>
          <div><span>CONTACT RADII</span><strong>{s.r1.toFixed(1)} / {s.r2.toFixed(1)}</strong></div>
          <div><span>PITCH GAP</span><strong>{Math.abs(s.gap).toExponential(1)}</strong></div>
        </div>
        <RatioPlot e={e} t={t}/>
        <button className="sgl-export" onClick={download}>↓ Export simulated JSON snapshot</button>
      </div>
    </div>
    <div className="sgl-notes">
      <article><span>01 · MECHANICAL KINEMATICS</span><h3>Variable ratios</h3>
        <code>ω₂/ω₁ = −r₁/r₂</code><p>Matched elliptical pitch curves retain a fixed center distance.
        Their instantaneous velocity varies, but one full input turn gives one opposite output turn.</p></article>
      <article><span>02 · GOLDEN RATIO</span><h3>Fibonacci limit</h3>
        <code>r(θ) = r₀ φ^(2θ/π)</code><p>The ideal logarithmic spiral expands by
        φ ≈ {PHI.toFixed(6)} per quarter-turn. It is not a meshing gear or a
        Fibonacci-square quarter-circle construction.</p></article>
      <article><span>03 · NBG RESEARCH QUESTION</span><h3>History vs closure</h3>
        <code>same full-cycle ratio ≠ same phase history</code>
        <p>This illustrative comparison invites controlled NBG experiments.
        It does not constitute a validated AH result or establish new physics.</p></article>
    </div>
  </section>;
}
