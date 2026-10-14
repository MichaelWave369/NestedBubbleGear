// NBG-HORN-A1: Gabriel's Horn as a formal finite-bulk / boundary-keyhole witness.
// Known geometry + deliberately stipulated probe; NOT empirical evidence for Altermath.
export const HORN_A1_PROTOCOL = Object.freeze({
  id: 'NBG-HORN-A1',
  version: '0.1.0',
  title: 'Finite Bulk / Persistent Boundary',
  origin: 'SIMULATED',
  authority: 'NONE',
  scope: 'Exact calculus and a constructed two-section observer/probe toy model.',
});

function positiveInteger(name, value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 100000)
    throw new RangeError(name + ' must be an integer in [1,100000]');
}

function boundedEndpoint(name, value) {
  if (!Number.isFinite(value) || value < 1 || value > 100001)
    throw new RangeError(name + ' must be a finite endpoint in [1,100001]');
}

// Horn y=1/x revolved about the x-axis. Endpoints are x>=1.
// Exact closed form: integral 2*pi*sqrt(1+x^-4)/x dx.
export function hornAreaBetween(a, b) {
  boundedEndpoint('a', a);
  boundedEndpoint('b', b);
  if (b <= a) throw new RangeError('b must be greater than a');
  const f = x => Math.sqrt(1 + x ** -4);
  return Math.PI * (Math.asinh(b * b) - Math.asinh(a * a) + f(a) - f(b));
}

export function hornLayer(n) {
  positiveInteger('section index', n);
  return {
    index: n,
    interval: [n, n + 1],
    volume: Math.PI / (n * (n + 1)),
    lateralArea: hornAreaBetween(n, n + 1),
  };
}

export function hornPrefix(count) {
  positiveInteger('section count', count);
  const endpoint = count + 1;
  const area = hornAreaBetween(1, endpoint);
  return {
    sections: count,
    endpoint,
    volume: Math.PI * (1 - 1 / endpoint),
    remainingVolume: Math.PI / endpoint,
    lateralArea: area,
    areaLowerBound: 2 * Math.PI * Math.log(endpoint),
    areaUpperBound: 2 * Math.PI * Math.log(endpoint)
      + (Math.PI / 4) * (1 - endpoint ** -4),
  };
}

// K0 intentionally hides ordering and interface geometry. The fixed two-section
// support has equal bulk volume for any arrangement of the two labels.
export function makeHornState(labels = [1, -1]) {
  if (!Array.isArray(labels) || labels.length !== 2 || !labels.every(x => x === -1 || x === 1))
    throw new RangeError('labels must be two orientation bits (-1 or +1)');
  return {labels: [...labels], readout: null};
}

function checkState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)
      || Object.keys(state).sort().join(',') !== 'labels,readout')
    throw new TypeError('state must contain only labels and readout');
  if (!Array.isArray(state.labels) || state.labels.length !== 2
      || !state.labels.every(x => x === -1 || x === 1))
    throw new RangeError('invalid state labels');
  if (state.readout !== null && !Number.isFinite(state.readout))
    throw new RangeError('invalid readout');
}

export function observeHorn(state, keyhole = 'K0') {
  checkState(state);
  const coarse = {
    volume: hornPrefix(2).volume,
    netLabel: state.labels[0] + state.labels[1],
    readout: state.readout,
  };
  if (keyhole === 'K0') return coarse;
  if (keyhole === 'K1') return {...coarse, interfaceLabels: [...state.labels]};
  throw new RangeError('unknown observer keyhole');
}

// One allowed future word. AREA_WEIGHTED deliberately defines a boundary-
// sensitive interaction. UNIFORM and DISABLED are negative controls.
export function probeHorn(state, mode = 'AREA_WEIGHTED') {
  checkState(state);
  if (!['AREA_WEIGHTED', 'UNIFORM', 'DISABLED'].includes(mode))
    throw new RangeError('unknown probe mode');
  const weights = mode === 'AREA_WEIGHTED'
    ? [hornLayer(1).lateralArea, hornLayer(2).lateralArea]
    : mode === 'UNIFORM' ? [1, 1] : [0, 0];
  return {
    labels: [...state.labels],
    readout: state.labels[0] * weights[0] + state.labels[1] * weights[1],
  };
}

export function buildHornA1Receipt() {
  const plusMinus = makeHornState([1, -1]);
  const minusPlus = makeHornState([-1, 1]);
  return {
    protocol: HORN_A1_PROTOCOL,
    origin: 'SIMULATED',
    authority: 'NONE',
    geometry: [1, 2, 4, 8, 16, 128].map(hornPrefix),
    twoSectionWitness: {
      sections: [hornLayer(1), hornLayer(2)],
      K0Before: [observeHorn(plusMinus), observeHorn(minusPlus)],
      K1Before: [observeHorn(plusMinus, 'K1'), observeHorn(minusPlus, 'K1')],
      K0AfterAreaProbe: [
        observeHorn(probeHorn(plusMinus)),
        observeHorn(probeHorn(minusPlus)),
      ],
      K0AfterUniformControl: [
        observeHorn(probeHorn(plusMinus, 'UNIFORM')),
        observeHorn(probeHorn(minusPlus, 'UNIFORM')),
      ],
      K0AfterDisabledControl: [
        observeHorn(probeHorn(plusMinus, 'DISABLED')),
        observeHorn(probeHorn(minusPlus, 'DISABLED')),
      ],
    },
    claimBoundary: 'Geometric convergence/divergence is classical mathematics. '
      + 'The interaction is a stipulated toy rule, not a measured physical mechanism; '
      + 'infinite area does not imply infinite energy, information, or causal effect.',
  };
}
