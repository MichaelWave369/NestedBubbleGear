// PHMP-3 proposed frozen synthetic transport-memory contract.
// This module contains the dataset generator and exact task oracle, not a trained model.
// No holdout scoring or optimization is performed in this phase.

export const PROTOCOL = Object.freeze({
  id: 'PHMP-3-E0', version: '0.1.0',
  origin: 'SIMULATED', authority: 'NONE',
  splits: Object.freeze({train: 201, validation: 202, holdout: 203}),
  samples: Object.freeze({train: 256, validation: 128, holdout: 512}),
  budgets_bytes: Object.freeze([1, 2, 4]),
  query_moduli: Object.freeze([2, 3]),
  query_vectors: Object.freeze([[1,0], [0,1]]),
  tokens: Object.freeze(['A','B','S','a','b','s'])
});
const I=[1,0,0,1];
const A=[1,1,0,1], B=[1,0,1,1], S=[0,-1,1,0];
const a=[1,-1,0,1], b=[1,0,-1,1], s=[0,1,-1,0];
const C=[2,1,1,1]; // A*B in traversal order
const maps={A,B,S,a,b,s};
const mod=(x,p)=>(x%p+p)%p;
export function matrixMul(X,Y,p){return [mod(X[0]*Y[0]+X[1]*Y[2],p),mod(X[0]*Y[1]+X[1]*Y[3],p),mod(X[2]*Y[0]+X[3]*Y[2],p),mod(X[2]*Y[1]+X[3]*Y[3],p)];}
export function inverse(X,p){const d=mod(X[0]*X[3]-X[1]*X[2],p);if(d!==1)throw Error('expected determinant one modulo '+p);return [mod(X[3],p),mod(-X[1],p),mod(-X[2],p),mod(X[0],p)];}
function mulmany(p,...ms){return ms.reduce((q,m)=>matrixMul(q,m,p),I);}
function seeded(seed){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};}
const choose=(rand,n)=>rand()%n;
const invToken={A:'a',a:'A',B:'b',b:'B',S:'s',s:'S'};
function laneTokens(rand,id,regime){
  const result=[];
  const length=5+choose(rand,6); // 5..10, before pair injection
  for(let i=0;i<length;i++)result.push(PROTOCOL.tokens[choose(rand,6)]);
  if(regime==='cancel-pair') {const k=1+choose(rand,result.length-1),g=PROTOCOL.tokens[choose(rand,6)];result.splice(k,0,g,invToken[g]);}
  if(regime==='swap-pair') {const k=1+choose(rand,result.length-1),g=PROTOCOL.tokens[choose(rand,6)];result.splice(k,0,g,invToken[g]); if(id===1)result.splice(k,2,invToken[g],g);}
  return result;
}
export function generateSplit(split){
  if(!Object.hasOwn(PROTOCOL.splits,split))throw Error('unknown split');
  const rand=seeded(PROTOCOL.splits[split]);
  const rows=[];
  for(let id=0;id<PROTOCOL.samples[split];id++){
    const regime=['random','cancel-pair','swap-pair','random'][id%4];
    const lanes=[laneTokens(rand,0,regime),laneTokens(rand,1,regime)];
    const cursor=[0,0],events=[];
    while(cursor[0]<lanes[0].length || cursor[1]<lanes[1].length){
      const available=[0,1].filter(lane=>cursor[lane]<lanes[lane].length);
      const lane=available[choose(rand,available.length)];
      events.push({lane,seq:cursor[lane],token:lanes[lane][cursor[lane]]});
      cursor[lane]++;
    }
    rows.push({id,split,regime,events});
  }
  return rows;
}
export function outerFromEvents(events,p){
  if(p!==2&&p!==3&&p!==6)throw Error('unsupported modular task');
  const connectors=[I,I];
  const seq=[0,0];
  for(const e of events){
    if((e.lane!==0&&e.lane!==1)||e.seq!==seq[e.lane]++||!Object.hasOwn(maps,e.token))throw Error('invalid typed causal event');
    connectors[e.lane]=matrixMul(connectors[e.lane],maps[e.token],p);
  }
  const [T1,T2]=connectors;
  return mulmany(p,T1,T2,C,inverse(T2,p),B,inverse(T1,p),A);
}
export function answer(events,p,v){
  if((p!==2&&p!==3)||!PROTOCOL.query_vectors.some(q=>q[0]===v[0]&&q[1]===v[1]))throw Error('unauthorized query');
  const G=outerFromEvents(events,p);
  return [mod(v[0]*G[0]+v[1]*G[2],p),mod(v[0]*G[1]+v[1]*G[3],p)];
}
export function queriesFor(row){return PROTOCOL.query_moduli.flatMap(p=>PROTOCOL.query_vectors.map(v=>({p,v,expected:answer(row.events,p,v)})));}
export const oracleLabel = 'full-information exact modular algebra, not a memory competitor';
