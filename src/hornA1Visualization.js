// NBG-HORN-A1 display-only 3D projection. No external renderer or imported geometry.
// Axial distances use log(x) for readability; measurements always use hornA1.js.
const RING_STEPS = 88;
const ANGLE_STEPS = 28;
const PITCH = 0.19;
const FIRST = [240, 180, 101];
const SECOND = [112, 179, 245];
const UNMARKED = [89, 203, 188];

function validate({sections, yaw, width, height, labels}) {
  if (!Number.isInteger(sections) || sections < 2 || sections > 256)
    throw new RangeError('sections must be an integer in [2,256]');
  if (!Number.isFinite(yaw) || Math.abs(yaw) > 1.5)
    throw new RangeError('yaw must be finite within ±1.5 radians');
  if (![width, height].every(x => Number.isFinite(x) && x >= 10 && x <= 8192))
    throw new RangeError('viewport width and height must be in [10,8192]');
  if (!Array.isArray(labels) || labels.length !== 2 || !labels.every(x => x === 1 || x === -1))
    throw new RangeError('labels must contain two orientation bits');
}

export function buildHornScene({
  sections = 16, yaw = 0.15, width = 860, height = 350, labels = [1, -1],
} = {}) {
  validate({sections, yaw, width, height, labels});
  const endpoint = sections + 1;
  const lengthLog = Math.log(endpoint);
  const scale = Math.min((width - 24) / 640, (height - 28) / 270);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(PITCH), sp = Math.sin(PITCH);

  function point(x, theta) {
    const displayX = 530 * Math.log(x) / lengthLog - 265;
    const y = 100 * Math.cos(theta) / x;
    const z = 100 * Math.sin(theta) / x;
    const turnedX = cy * displayX + sy * z;
    const turnedZ = -sy * displayX + cy * z;
    const projectedY = cp * y - sp * turnedZ;
    const depth = sp * y + cp * turnedZ;
    return {
      x: width / 2 + turnedX * scale,
      y: height / 2 - projectedY * scale,
      depth,
    };
  }

  const vertices = Array.from({length: RING_STEPS + 1}, (_, i) => {
    const x = Math.exp(lengthLog * i / RING_STEPS);
    return Array.from({length: ANGLE_STEPS + 1},
      (_, j) => point(x, 2 * Math.PI * j / ANGLE_STEPS));
  });

  const faces = [];
  for (let i = 0; i < RING_STEPS; i++) {
    const from = Math.exp(lengthLog * i / RING_STEPS);
    const to = Math.exp(lengthLog * (i + 1) / RING_STEPS);
    const mid = (from + to) / 2;
    const section = mid < 2 ? 1 : mid < 3 ? 2 : 0;
    for (let j = 0; j < ANGLE_STEPS; j++) {
      const corners = [vertices[i][j], vertices[i + 1][j],
        vertices[i + 1][j + 1], vertices[i][j + 1]];
      const theta = 2 * Math.PI * (j + 0.5) / ANGLE_STEPS;
      const light = 0.48 + 0.43 * Math.max(0, Math.cos(theta - 0.4));
      const base = section === 0 ? UNMARKED
        : labels[section - 1] === 1 ? FIRST : SECOND;
      faces.push({
        points: corners.map(({x, y}) => ({x, y})),
        depth: corners.reduce((sum, p) => sum + p.depth, 0) / 4,
        section,
        fill: 'rgba(' + base.map(v => Math.round(v * light)).join(',') + ',0.92)',
      });
    }
  }

  // Opaque painter's algorithm for an intentionally low-cost Canvas2D preview.
  faces.sort((a, b) => a.depth - b.depth);
  const mouth = Array.from({length: ANGLE_STEPS + 1},
    (_, j) => point(1, j * 2 * Math.PI / ANGLE_STEPS));
  const highlights = [2, 3].filter(x => x <= endpoint).map(x => ({
    sectionBoundary: x,
    points: Array.from({length: ANGLE_STEPS + 1},
      (_, j) => point(x, j * 2 * Math.PI / ANGLE_STEPS)),
  }));

  return {faces, mouth, highlights, endpoint, sections,
    axis: [point(1, 0), point(endpoint, 0)],
    compression: 'DISPLAY_ONLY_LOG_X',
    origin: 'SIMULATED',
    authority: 'NONE'};
}

function follow(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
}

export function paintHorn(ctx, scene, {width, height}) {
  if (!ctx || typeof ctx.fillRect !== 'function') throw new TypeError('canvas context required');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a1b28');
  gradient.addColorStop(0.57, '#102233');
  gradient.addColorStop(1, '#081218');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Deliberately illustrative particles, not data points.
  ctx.fillStyle = 'rgba(179,239,243,0.16)';
  for (let i = 0; i < 36; i++) {
    const x = (i * 197 + 17) % Math.floor(width);
    const y = (i * 91 + 23) % Math.floor(height);
    ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1, 1);
  }

  for (const face of scene.faces) {
    follow(ctx, face.points);
    ctx.closePath();
    ctx.fillStyle = face.fill;
    ctx.fill();
    if (face.section && scene.sections <= 32) {
      ctx.strokeStyle = 'rgba(255,255,255,0.065)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  for (const {points} of scene.highlights) {
    follow(ctx, points);
    ctx.strokeStyle = 'rgba(224,255,238,0.58)';
    ctx.lineWidth = 1.35;
    ctx.stroke();
  }
  // The horn mouth is *open*: a dark cavity rather than a filled cap.
  follow(ctx, scene.mouth);
  ctx.closePath();
  ctx.fillStyle = '#051118';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#afe9d8';
  ctx.stroke();

  ctx.font = '12px ui-monospace, monospace';
  ctx.fillStyle = '#d7f9ed';
  ctx.fillText('x = 1', 16, 22);
  ctx.fillStyle = '#a4b9b8';
  ctx.fillText('x = ' + scene.endpoint + ' (finite cutoff)', 16, height - 17);
}
