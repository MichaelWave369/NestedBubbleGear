// PHMP-3 E1: bounded, streaming memory competitors.
// Candidate code receives validated events and commits bytes before query.
// It does not access dataset labels, oracle functions, or held-out histories.
import { matrixMul, inverse } from './phmp3_contract.mjs';

const ID = Object.freeze([1,0,0,1]);
const A = Object.freeze([1,1,0,1]);
const B = Object.freeze([1,0,1,1]);
const S = Object.freeze([0,-1,1,0]);
const TOKENS = Object.freeze({
  A, B, S, a:[1,-1,0,1], b:[1,0,-1,1], s:[0,1,-1,0]
});
const TOKEN_ORDER = Object.freeze(['A','B','S','a','b','s']);
const mod=(x,p)=>(x%p+p)%p;
const ident=p=>ID.map(x=>mod(x,p));
const key=m=>m.join(',');

function enumerateGroup(p) {
  const elements=[];
  for(let a=0;a<p;a++)for(let b=0;b<p;b++)
    for(let c=0;c<p;c++)for(let d=0;d<p;d++)
      if(mod(a*d-b*c,p)===1)elements.push([a,b,c,d]);
  const indices=new Map(elements.map((e,i)=>[key(e),i]));
  const encode=m=>{
    const idx=indices.get(key(m));
    if(idx===undefined)throw Error('matrix absent from finite SL2 group');
    return idx;
  };
  return Object.freeze({
    p, elements, encode,
    identityIndex:encode(ident(p)),
    // Lower bound on explicitly tabulated matrix entries plus 1-byte state indices.
    // The actual JavaScript Map/string/object overhead is considerably larger.
    minimumCodebookPayloadBytes:elements.length*5
  });
}
export const GROUPS=Object.freeze({
  2:enumerateGroup(2),3:enumerateGroup(3),6:enumerateGroup(6)
});
if(GROUPS[2].elements.length!==6 || GROUPS[3].elements.length!==24 ||
   GROUPS[6].elements.length!==144)throw Error('wrong finite-group enumeration');

const SPECS=[
  {id:'classical-exact',kind:'exact',minimumBytes:2,usedBytes:2,group:6,role:'classical sufficient-statistic baseline'},
  {id:'nbg-typed-interfaces',kind:'exact',minimumBytes:2,usedBytes:2,group:6,role:'NBG-inspired typed interface policy; identical sufficient statistic'},
  {id:'mod2-only',kind:'mod2',minimumBytes:1,usedBytes:1,group:2,role:'single-modulus quotient with explicit abstention'},
  {id:'mod3-only',kind:'mod3',minimumBytes:2,usedBytes:2,group:3,role:'single-modulus quotient with explicit abstention'},
  {id:'recent-events-packed',kind:'recent-packed',minimumBytes:1,usedBytes:1,group:null,role:'lossy two-lane last-event summary'},
  {id:'recent-events-two-byte',kind:'recent-two',minimumBytes:2,usedBytes:2,group:null,role:'two-byte last-event control'},
  {id:'whole-interleaving',kind:'whole',minimumBytes:2,usedBytes:1,group:6,role:'flawed two-byte interleaving-dependent summary; one byte active, one padded'}
];
export const MODEL_SPECS=Object.freeze(SPECS.map(s=>Object.freeze(s)));
export function availableModels(budget) {
  if(![1,2,4].includes(budget))throw Error('unsupported fixed budget');
  return MODEL_SPECS.filter(s=>s.minimumBytes<=budget);
}
export function modelCodebookMinimumBytes(spec) {
  return spec.group===null?0:GROUPS[spec.group].minimumCodebookPayloadBytes;
}
export function makeStreamingMemory(spec,budget) {
  if(!MODEL_SPECS.includes(spec))throw Error('unregistered model');
  if(![1,2,4].includes(budget) || spec.minimumBytes>budget)
    throw Error('invalid model/budget');
  const state=new Uint8Array(budget);
  const group=spec.group===null?null:GROUPS[spec.group];
  if(spec.kind==='exact' || spec.kind==='mod3') {
    state[0]=group.identityIndex;state[1]=group.identityIndex;
  } else if(spec.kind==='mod2') {
    state[0]=GROUPS[2].identityIndex*6 + GROUPS[2].identityIndex;
  } else if(spec.kind==='whole') {
    state[0]=GROUPS[6].identityIndex;
  }
  let committed=false;
  function accept(event) {
    if(committed)throw Error('write after commitment');
    if(!event || ![0,1].includes(event.lane) ||
      !Object.prototype.hasOwnProperty.call(TOKENS,event.token))
      throw Error('invalid event');
    if(spec.kind==='exact' || spec.kind==='mod3') {
      const lane=event.lane,old=group.elements[state[lane]];
      state[lane]=group.encode(matrixMul(old,TOKENS[event.token],group.p));
    } else if(spec.kind==='mod2') {
      const codes=[Math.floor(state[0]/6),state[0]%6];
      codes[event.lane]=GROUPS[2].encode(
        matrixMul(GROUPS[2].elements[codes[event.lane]],TOKENS[event.token],2));
      state[0]=6*codes[0]+codes[1];
    } else if(spec.kind==='recent-packed') {
      const codes=[Math.floor(state[0]/7),state[0]%7];
      codes[event.lane]=TOKEN_ORDER.indexOf(event.token)+1;
      state[0]=7*codes[0]+codes[1];
    } else if(spec.kind==='recent-two') {
      state[event.lane]=TOKEN_ORDER.indexOf(event.token)+1;
    } else if(spec.kind==='whole') {
      state[0]=group.encode(matrixMul(group.elements[state[0]],TOKENS[event.token],6));
    }
  }
  return Object.freeze({
    accept,
    commit(){
      if(committed)throw Error('commit twice');
      committed=true;
      return new Uint8Array(state); // copy, not a reference into a growing event store
    }
  });
}
function pairFromCommitted(spec,snapshot,p) {
  if(!(snapshot instanceof Uint8Array))throw Error('snapshot must be bytes');
  if(spec.kind==='exact'){
    const elems=GROUPS[6].elements;
    if(snapshot[0]>=elems.length||snapshot[1]>=elems.length)throw Error('corrupt exact index');
    return [elems[snapshot[0]].map(x=>x%p),elems[snapshot[1]].map(x=>x%p)];
  }
  if(spec.kind==='mod2'){
    if(p!==2)return null;
    const idx=[Math.floor(snapshot[0]/6),snapshot[0]%6];
    return idx.map(i=>GROUPS[2].elements[i]);
  }
  if(spec.kind==='mod3'){
    if(p!==3)return null;
    return [GROUPS[3].elements[snapshot[0]],GROUPS[3].elements[snapshot[1]]];
  }
  if(spec.kind==='recent-packed'||spec.kind==='recent-two'){
    const codes=spec.kind==='recent-packed'?
      [Math.floor(snapshot[0]/7),snapshot[0]%7]:[snapshot[0],snapshot[1]];
    return codes.map(code=>code===0?ident(p):
      matrixMul(ident(p),TOKENS[TOKEN_ORDER[code-1]],p));
  }
  if(spec.kind==='whole'){
    const combined=GROUPS[6].elements[snapshot[0]];
    return [combined.map(x=>x%p),ident(p)];
  }
  throw Error('unsupported candidate kind');
}
export function answerFromCommitted(spec,snapshot,p,v){
  if(!MODEL_SPECS.includes(spec))throw Error('unregistered model');
  if(![1,2,4].includes(snapshot.length) || snapshot.length<spec.minimumBytes ||
     ![2,3].includes(p) || !([[1,0],[0,1]].some(x=>x[0]===v[0]&&x[1]===v[1])))
    throw Error('bad committed query');
  const pair=pairFromCommitted(spec,snapshot,p);
  if(pair===null)return null; // explicit ABSTAIN, never silently guessed
  const [T1,T2]=pair;
  const C=matrixMul(A,B,p);
  const steps=[T1,T2,C,inverse(T2,p),B,inverse(T1,p),A];
  const G=steps.reduce((acc,m)=>matrixMul(acc,m,p),ident(p));
  return [mod(v[0]*G[0]+v[1]*G[2],p),mod(v[0]*G[1]+v[1]*G[3],p)];
}
