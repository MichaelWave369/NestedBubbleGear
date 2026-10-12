// NBG-G1 · Geometry Keyhole, deterministic finite combinatorics.
// OBSERVER MODEL ONLY. No metaphysical or historical causal claims.
export const G1_PROTOCOL = Object.freeze({
  id:'NBG-G1',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  question:'Can equal coarse observations conceal different cube-foldability outcomes?',
  observerCoarse:'number of square cells',observerRich:'planar adjacency and cube-face orientation',
})
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]]
const xy=(p)=>p[0]+','+p[1]
const sorted=(cells)=>cells.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0])
function normalize(cells){
  const minx=Math.min(...cells.map(p=>p[0])),miny=Math.min(...cells.map(p=>p[1]))
  return sorted(cells.map(([x,y])=>[x-minx,y-miny]))
}
function shapeKey(cells){return sorted(cells).map(xy).join(';')}
export function canonicalCells(cells){
  let best=null,bestKey=null
  for(let mirror of [1,-1]){
    for(let rotation=0;rotation<4;rotation++){
      const transformed=cells.map(([x,y])=>{
        x*=mirror
        for(let k=0;k<rotation;k++){const old=x;x=-y;y=old}
        return [x,y]
      })
      const normalized=normalize(transformed),key=shapeKey(normalized)
      if(bestKey===null||key<bestKey){bestKey=key;best=normalized}
    }
  }
  return best
}
export function enumerateFreePolyominoes(n=6){
  if(!Number.isInteger(n)||n<1||n>7)throw Error('Supported size: 1 through 7')
  let shapes=[[[0,0]]]
  for(let size=2;size<=n;size++){
    const seen=new Map()
    for(let cells of shapes){
      const occupied=new Set(cells.map(xy))
      for(let [x,y] of cells){
        for(let [dx,dy] of DIRS){
          const p=[x+dx,y+dy]
          if(occupied.has(xy(p)))continue
          const next=canonicalCells([...cells,p])
          seen.set(shapeKey(next),next)
        }
      }
    }
    shapes=[...seen.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v)
  }
  return shapes
}
const neg=v=>v.map(x=>-x)
const equals=(a,b)=>a.every((x,i)=>x===b[i])
// Right and down are tangent directions, n is the outward face normal.
// A planar neighboring square is folded 90 degrees around its shared edge.
function stepOrientation(frame,delta){
  const {r,d,n}=frame
  if(delta[0]===1)return {r:neg(n),d,n:r}
  if(delta[0]===-1)return {r:n,d,n:neg(r)}
  if(delta[1]===1)return {r,d:neg(n),n:d}
  return {r,d:n,n:neg(d)}
}
export function foldCubeNet(cells){
  if(cells.length!==6||new Set(cells.map(xy)).size!==6)return {folds:false,reason:'NOT_SIX_UNIQUE_CELLS',normals:[]}
  const lookup=new Set(cells.map(xy))
  const frames=new Map([[xy(cells[0]),{r:[1,0,0],d:[0,1,0],n:[0,0,1]}]])
  const queue=[cells[0]]
  for(let i=0;i<queue.length;i++){
    const here=queue[i],f=frames.get(xy(here))
    for(const delta of DIRS){
      const next=[here[0]+delta[0],here[1]+delta[1]],key=xy(next)
      if(!lookup.has(key))continue
      const candidate=stepOrientation(f,delta),old=frames.get(key)
      if(old){
        if(!equals(old.r,candidate.r)||!equals(old.d,candidate.d)||!equals(old.n,candidate.n)){
          return {folds:false,reason:'INCONSISTENT_FOLD_CYCLE',normals:[]}
        }
      }else{frames.set(key,candidate);queue.push(next)}
    }
  }
  if(frames.size!==6)return {folds:false,reason:'DISCONNECTED',normals:[]}
  const normals=[...frames.values()].map(f=>f.n.join(','))
  const unique=new Set(normals)
  return {folds:unique.size===6,reason:unique.size===6?'VALID_CUBE_NET':'FACE_OVERLAP',normals}
}
export const CROSS_NET=[[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]]
export const RECTANGLE_NET=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]
export function cubeCensus(){
  const nets=enumerateFreePolyominoes(6).map((cells,index)=>({
    id:'H'+String(index+1).padStart(2,'0'),cells,foldable:foldCubeNet(cells).folds
  }))
  return {shapeCount:nets.length,foldableCount:nets.filter(x=>x.foldable).length,
    nonfoldableCount:nets.filter(x=>!x.foldable).length,nets}
}
// Hypercube graph: binary vertices in 4D. An edge flips exactly one sign.
// Square faces fix two axes and free two. Cubic cells fix one axis.
export function hypercubeCensus(){
  const vertices=Array.from({length:16},(_,v)=>Array.from({length:4},(_,i)=>(v&(1<<i))?1:-1))
  const edges=[]
  for(let i=0;i<16;i++)for(let axis=0;axis<4;axis++){
    const j=i^(1<<axis);if(i<j)edges.push([i,j])
  }
  const squareFaces=[]
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){
    const fixed=[0,1,2,3].filter(i=>i!==a&&i!==b)
    for(let mask=0;mask<4;mask++)squareFaces.push({freeAxes:[a,b],fixedSigns:fixed.map((i,j)=>({axis:i,sign:(mask&(1<<j))?1:-1}))})
  }
  const cubes=[]
  for(let axis=0;axis<4;axis++)for(let sign of [-1,1])cubes.push({fixedAxis:axis,fixedSign:sign})
  return {vertices:vertices.length,edges:edges.length,squareFaces:squareFaces.length,cubicCells:cubes.length}
}
export const project3=([x,y,z,w])=>[x,y,z] // intentionally discards w
export const probe4=([x,y,z,w])=>w
export function projectionWitness(){
  const A=[1,1,1,-1],B=[1,1,1,1]
  return {stateA:A,stateB:B,coarseA:project3(A),coarseB:project3(B),
    coarseEqual:equals(project3(A),project3(B)),probeA:probe4(A),probeB:probe4(B),
    richDistinct:probe4(A)!==probe4(B)}
}
export function buildG1Receipt(){
  const census=cubeCensus(),p=projectionWitness()
  return {protocol:G1_PROTOCOL,origin:'SIMULATED',authority:'NONE',
    cube:{faces:6,edges:12,vertices:8},
    hexomino:{freeShapes:census.shapeCount,cubeNets:census.foldableCount,
      notCubeNets:census.nonfoldableCount,crossNetFoldable:foldCubeNet(CROSS_NET).folds,
      rectangleNetFoldable:foldCubeNet(RECTANGLE_NET).folds,
      coarseObserver:'6 squares for every specimen',richObserver:'foldability differs'},
    tesseract:hypercubeCensus(),projection:p,
    interpretation:'Symbolic meanings, captivity, Saturn and religious historical claims are NOT inferred from finite geometry.'}
}
