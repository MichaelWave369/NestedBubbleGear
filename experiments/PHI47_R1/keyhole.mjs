// PHI47-R1: finite graph observability study; SIMULATED / authority NONE.
export const SCHEMA = 'phi47-keyhole-r1';
export const N = 47;
export const STRIDES = Object.freeze([8, 9, 12, 16]);

export function graph(n = N, strides = STRIDES) {
  if (!Number.isInteger(n) || n < 9 || n > 4096 ||
      !Array.isArray(strides) || strides.length !== 4 ||
      strides.some(s => !Number.isInteger(s) || s <= 0 || s >= n)) throw Error('Invalid topology');
  const residues = strides.flatMap(s => [s % n, (n - s) % n]);
  if (new Set(residues).size !== 8) throw Error('Stride collision');
  return Array.from({length:n}, (_,i) => residues.map(s => (i+s)%n).sort((a,b)=>a-b));
}
export function stateFor(seed, n = N, positive = 24) {
  if (!Number.isInteger(seed) || !Number.isInteger(n) || n < 2 ||
      !Number.isInteger(positive) || positive < 0 || positive > n) throw Error('Invalid seed or state size');
  const slots = Array.from({length:n}, (_,i)=>i);
  let x=(seed>>>0)||1;
  for (let i=n-1;i>0;i--) {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    const j=(x>>>0)%(i+1);
    [slots[i],slots[j]]=[slots[j],slots[i]];
  }
  const out=Array(n).fill(-1);
  for (const i of slots.slice(0,positive)) out[i]=1;
  return out;
}
export function step(state, adjacency) {
  if (!Array.isArray(state) || !Array.isArray(adjacency) ||
      state.length !== adjacency.length ||
      state.some(x => x !== 1 && x !== -1) ||
      adjacency.some(neighbors => !Array.isArray(neighbors) || neighbors.some(j => !Number.isInteger(j) || j < 0 || j >= state.length)))
    throw Error('Invalid state or adjacency');
  return state.map((old,i) => {
    const vote=adjacency[i].reduce((s,j)=>s+state[j],0);
    return vote===0 ? old : Math.sign(vote);
  });
}
export const aggregate = state => state.reduce((s,x)=>s+x,0);
export function entropy(histogram) {
  const counts=Object.values(histogram);
  const total=counts.reduce((s,n)=>s+n,0);
  return total ? -counts.reduce((s,n) => {const p=n/total;return s+p*Math.log2(p);},0) : 0;
}
export function permute(state, adjacency, multiply=13, offset=7) {
  const n=state.length;
  const m=i=>(i*multiply+offset)%n;
  const targets=Array.from({length:n},(_,i)=>m(i));
  if (new Set(targets).size!==n) throw Error('Permutation must be bijective');
  const s=Array(n), a=Array(n);
  for(let i=0;i<n;i++){s[m(i)]=state[i];a[m(i)]=adjacency[i].map(m).sort((x,y)=>x-y);}
  return {state:s,adjacency:a};
}
export function study({trials=512,seed=369}={}) {
  if(!Number.isInteger(trials)||trials<2||trials>10000||!Number.isInteger(seed)) throw Error('Invalid study parameters');
  const topologies={phi47:STRIDES,local:[1,2,3,4],control:[3,7,11,19]};
  const distributions={};
  for(const [name,strides] of Object.entries(topologies)){
    const adj=graph(N,strides),histogram={};
    for(let trial=0;trial<trials;trial++){
      const state=stateFor(seed+trial*7919,N,24);
      const future=aggregate(step(state,adj));
      histogram[future]=(histogram[future]??0)+1;
    }
    distributions[name]={strides,initialAggregate:1,distinctFutures:Object.keys(histogram).length,
      entropyBits:entropy(histogram),histogram:Object.fromEntries(Object.entries(histogram).sort((a,b)=>Number(a[0])-Number(b[0])))};
  }
  return {schema:SCHEMA,origin:'SIMULATED',authority:'NONE',seed,trials,nodes:N,degree:8,
    observer:'initial signed aggregate only',rule:'synchronous neighbor majority; ties retain previous state',distributions};
}
