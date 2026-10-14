import {useEffect, useMemo, useRef, useState} from 'react';
import {
  HORN_A1_PROTOCOL, hornLayer, hornPrefix, makeHornState,
  observeHorn, probeHorn, buildHornA1Receipt,
} from './hornA1.js';
import {buildHornScene, paintHorn} from './hornA1Visualization.js';
import './hornA1Lab.css';

const CONFIGS = Object.freeze({
  X: Object.freeze([1, -1]),
  Y: Object.freeze([-1, 1]),
});
const MODES = Object.freeze([
  {value:'AREA_WEIGHTED', label:'Area-weighted interface'},
  {value:'UNIFORM', label:'Uniform weights · control'},
  {value:'DISABLED', label:'Disabled coupling · control'},
]);
const format = n => Number(n).toLocaleString('en-US', {maximumFractionDigits:5});
const signed = n => n === null ? 'not measured'
  : (n > 0 ? '+' : '') + n.toFixed(5);

function saveJson(name, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], {type:'application/json'});
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function HornCanvas({sections, labels, yawDeg, motion}) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frameId = null;
    let disposed = false;

    function draw(timestamp = 0) {
      if (disposed) return;
      const box = canvas.getBoundingClientRect();
      const width = Math.max(10, Math.round(box.width || 640));
      const height = Math.max(10, Math.round(box.height || 340));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const yaw = yawDeg * Math.PI / 180 + (motion ? 0.30 * Math.sin(timestamp / 1300) : 0);
      paintHorn(ctx, buildHornScene({sections, yaw, width, height, labels}), {width, height});
      if (motion) frameId = window.requestAnimationFrame(draw);
    }

    const resize = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {if (!motion) draw(performance.now());})
      : null;
    resize?.observe(canvas);
    draw(performance.now());

    return () => {
      disposed = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      resize?.disconnect();
    };
  }, [sections, labels, yawDeg, motion]);
  return <canvas ref={canvasRef} className="horn-a1-canvas"
    role="img"
    aria-label={'Rotatable 3D projection of Gabriel’s Horn through ' + sections
      + ' finite sections. Gold means +1 orientation, blue means −1 orientation. '
      + 'The horizontal x axis is compressed logarithmically for visualization; measurements are exact.'}>
    Gabriel's Horn y=1/x revolved around the x axis, with a finite cutoff.
  </canvas>;
}

function ObservationCard({title, labels, observation, keyhole, observed, color}) {
  return <div className={'horn-a1-state horn-a1-state-'+color}>
    <div className="horn-a1-state-heading">
      <h4>{title}</h4>
      <span aria-label="Underlying synthetic labels">{labels.map(v => v > 0 ? '+' : '−').join(' / ')}</span>
    </div>
    <p>Volume: <strong>{format(observation.volume)}</strong> · net label: <strong>{observation.netLabel}</strong></p>
    <p>Probe readout: <strong>{signed(observation.readout)}</strong></p>
    <p>{keyhole === 'K1'
      ? <>K1 reveals ordered boundary labels <strong>[{labels.join(', ')}]</strong>.</>
      : observed
        ? 'K0 now includes the post-intervention readout, but still hides the label order.'
        : 'K0 hides label ordering before intervention.'}</p>
  </div>;
}

export default function HornA1Lab() {
  const [sections, setSections] = useState(16);
  const [selected, setSelected] = useState('X');
  const [keyhole, setKeyhole] = useState('K0');
  const [mode, setMode] = useState('AREA_WEIGHTED');
  const [probed, setProbed] = useState(false);
  const [yawDeg, setYawDeg] = useState(12);
  const [motion, setMotion] = useState(false);

  const labels = CONFIGS[selected];
  const metrics = useMemo(() => hornPrefix(sections), [sections]);
  const [stateX, stateY] = [makeHornState(CONFIGS.X), makeHornState(CONFIGS.Y)];
  const responseX = probed ? probeHorn(stateX, mode) : stateX;
  const responseY = probed ? probeHorn(stateY, mode) : stateY;
  const xView = observeHorn(responseX, keyhole);
  const yView = observeHorn(responseY, keyhole);
  const distinguished = JSON.stringify(xView) !== JSON.stringify(yView);
  const firstTwoDifference = hornLayer(1).lateralArea - hornLayer(2).lateralArea;

  function reset() {
    setSections(16);
    setSelected('X');
    setKeyhole('K0');
    setMode('AREA_WEIGHTED');
    setProbed(false);
    setYawDeg(12);
    setMotion(false);
  }

  function exportView() {
    saveJson('NBG-HORN-A1-view-simulated.json', {
      ...buildHornA1Receipt(),
      interactiveView: {
        label: 'USER_SELECTED_VIEW_NOT_CANONICAL_FROZEN_RECEIPT',
        sectionCount: sections,
        finiteMetrics: metrics,
        selectedSpecimen: selected,
        currentLabels: [...labels],
        keyhole,
        couplingMode: mode,
        probeApplied: probed,
        observationX: xView,
        observationY: yView,
        distinct: distinguished,
        horizontalGeometryAxis: 'LOGARITHMIC_VISUAL_COMPRESSION_ONLY',
        origin: 'SIMULATED',
        authority: 'NONE',
      },
    });
  }

  return <section className="section horn-a1-section" id="horn-a1">
    <span className="section-label">NBG-HORN-A1 · ALTERMATH / GEOMETRY · SIMULATED / FORMAL</span>
    <h2>Finite bulk.<br/><em>Unbounded boundary.</em></h2>
    <p className="muted horn-a1-lede">Gabriel's Horn has exactly π volume and divergent lateral surface area in the mathematical limit.
      Explore finite cutoffs, then test what a deliberately defined interface-sensitive observer can and cannot detect.</p>

    <div className="horn-a1-metrics" aria-label="Exact finite-cutoff metrics">
      <div><small>H1 · CONTAINED VOLUME</small><strong>{format(metrics.volume)}</strong><span>Approaches π ≈ {format(Math.PI)}</span></div>
      <div><small>H1 · VOLUME REMAINING</small><strong>{format(metrics.remainingVolume)}</strong><span>π / ({sections} + 1)</span></div>
      <div><small>H2 · LATERAL AREA</small><strong>{format(metrics.lateralArea)}</strong><span>Continues increasing</span></div>
      <div><small>H2 · AREA / VOLUME</small><strong>{format(metrics.lateralArea / metrics.volume)}</strong><span>Grows with cutoff</span></div>
    </div>

    <div className="horn-a1-controls">
      <div className="horn-a1-field horn-a1-wide">
        <label htmlFor="horn-a1-sections">Finite sections: <strong>{sections}</strong> · x ∈ [1, {sections+1}]</label>
        <input id="horn-a1-sections" type="range" min="2" max="256" step="1"
          value={sections} onChange={e => setSections(Number(e.target.value))}/>
        <div className="horn-a1-presets" aria-label="Finite cutoff presets">
          {[2, 8, 32, 128, 256].map(n => <button type="button" key={n}
            aria-pressed={sections === n} onClick={() => setSections(n)}>N={n}</button>)}
        </div>
      </div>
      <div className="horn-a1-field">
        <label htmlFor="horn-a1-yaw">View angle: {yawDeg}°</label>
        <input id="horn-a1-yaw" type="range" min="-50" max="50" value={yawDeg}
          disabled={motion} onChange={e => setYawDeg(Number(e.target.value))}/>
        <button className="horn-a1-quiet" type="button" aria-pressed={motion} onClick={() => setMotion(p => !p)}>
          {motion ? 'Pause camera orbit' : 'Orbit camera slowly'}
        </button>
      </div>
    </div>

    <div className="horn-a1-layout">
      <div className="horn-a1-visual">
        <div className="horn-a1-visual-header"><strong>Rotatable 3D geometric preview</strong><span>DISPLAY ONLY · LOG x COMPRESSION</span></div>
        <HornCanvas sections={sections} labels={labels} yawDeg={yawDeg} motion={motion}/>
        <p>Gold segments: +1 label · Blue segments: −1 label · Teal: unlabeled continuation.
          Only the first two longitudinal sections carry labels; the probe acts on those two sections.</p>
        <div className="horn-a1-visual-switch" aria-label="Select highlighted horn state">
          <button type="button" aria-pressed={selected === 'X'} onClick={() => setSelected('X')}>Show X · (+, −)</button>
          <button type="button" aria-pressed={selected === 'Y'} onClick={() => setSelected('Y')}>Show X′ · (−, +)</button>
        </div>
      </div>
      <aside className="horn-a1-math">
        <span className="section-label">THE KNOWN MATHEMATICS</span>
        <h3>One converges.<br/>One diverges.</h3>
        <code>y = 1/x, x ≥ 1</code>
        <code>V(N) = π(1 − 1/(N+1))</code>
        <code>A(N) ≥ 2π ln(N+1)</code>
        <div className="horn-a1-volume-track">
          <span>Volume filled toward π</span>
          <div role="progressbar" aria-label="Fraction of asymptotic volume contained by this cutoff"
            aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(metrics.volume / Math.PI * 100)}>
            <span style={{width:(metrics.volume/Math.PI*100)+'%'}}/>
          </div>
          <strong>{format(metrics.volume / Math.PI * 100)}%</strong>
        </div>
        <p>More sections add diminishing volume, but their total lateral area keeps growing.
          This rendering compresses the horizontal axis to reveal the far tail. The numbers use the original, uncompressed equations.</p>
      </aside>
    </div>

    <div className="horn-a1-keyhole">
      <div className="horn-a1-keyhole-header">
        <div>
          <span className="section-label">H3 / H4 · TWO-SECTION ALTERMATH WITNESS</span>
          <h3>Same coarse state. Different permitted future?</h3>
        </div>
        <span className={'horn-a1-verdict'+(distinguished?' is-distinct':'')}>
          {distinguished ? 'DISTINGUISHABLE' : 'COARSE EQUIVALENT'}
        </span>
      </div>
      <div className="horn-a1-keyhole-controls">
        <div className="horn-a1-field">
          <label htmlFor="horn-a1-keyhole">Observer</label>
          <select id="horn-a1-keyhole" value={keyhole} onChange={e => setKeyhole(e.target.value)}>
            <option value="K0">K0 · bulk + net label + readout</option>
            <option value="K1">K1 · adds interface label order</option>
          </select>
        </div>
        <div className="horn-a1-field">
          <label htmlFor="horn-a1-mode">Allowed synthetic future probe</label>
          <select id="horn-a1-mode" value={mode} onChange={e => {setMode(e.target.value);setProbed(false)}}>
            {MODES.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}
          </select>
        </div>
        <button className="horn-a1-action" type="button" onClick={() => setProbed(true)}
          disabled={probed}> {probed ? 'Probe applied' : 'Apply future probe →'}</button>
        <button className="horn-a1-quiet" type="button" disabled={!probed} onClick={() => setProbed(false)}>Clear readout</button>
      </div>
      <div className="horn-a1-state-grid">
        <ObservationCard title="X" labels={CONFIGS.X} observation={xView} keyhole={keyhole} observed={probed} color="amber"/>
        <ObservationCard title="X′" labels={CONFIGS.Y} observation={yView} keyhole={keyhole} observed={probed} color="blue"/>
      </div>
      <p className="horn-a1-explanation" aria-live="polite">
        {keyhole === 'K1'
          ? 'K1 reveals the ordered labels before any probe: the states are already distinguishable.'
          : !probed
            ? 'K0 reports the same bulk and zero net orientation for both states. Their different label orders are hidden.'
            : mode === 'AREA_WEIGHTED'
              ? 'The stipulated area-weighted probe separates the K0 twins: R(X) = '
                + signed(firstTwoDifference) + ' and R(X′) = ' + signed(-firstTwoDifference) + '.'
              : 'Negative control: without position-sensitive area coupling, the reversed labels cancel and both K0 responses remain zero.'}
      </p>
    </div>

    <p className="horn-a1-guard"><strong>Claim firewall:</strong> Calculus gives us the geometry;
      the boundary coupling is an invented toy rule. This experiment neither demonstrates a
      physical Altermath mechanism nor implies infinite information, energy, or causal influence.
      Origin {HORN_A1_PROTOCOL.origin}; authority {HORN_A1_PROTOCOL.authority}.</p>
    <div className="horn-a1-actions">
      <button type="button" onClick={exportView}>Export simulated view JSON</button>
      <button type="button" onClick={reset}>Reset laboratory</button>
      <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/HORN-A1/SPEC.md">
        Protocol, exact derivation &amp; controls ↗
      </a>
    </div>
  </section>;
}
