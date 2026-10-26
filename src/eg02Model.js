// EG-02 · independent-model audit, synthetic E0.
// Conventional force identity: F_z = m_z (dB_z/dz) for a fixed dipole aligned
// with the field gradient. This is a narrow approximation, not a model of a
// rotating superconductor, diamagnetic sample, Li–Torr theory, or gravity shield.
export const EG02 = Object.freeze({
  g: 9.80665, provenance: 'SIMULATED', authority: 'NONE',
  citationScope: 'Published abstracts + independent replication report; full analytic derivations pending',
  defaultMassKg: 0.1, defaultMomentAm2: 0.02, defaultGradientTPerM: 0.5,
  defaultFractionalWeight: 0, defaultOffsetN: 0.002,
})
export function forceBudget({massKg=EG02.defaultMassKg,
  momentAm2=EG02.defaultMomentAm2, gradientTPerM=EG02.defaultGradientTPerM,
  fractionalWeight=0}={}) {
  if (![massKg,momentAm2,gradientTPerM,fractionalWeight].every(Number.isFinite) ||
    massKg<=0 || massKg>100 || Math.abs(momentAm2)>100 ||
    Math.abs(gradientTPerM)>1000 || Math.abs(fractionalWeight)>1)
    throw new RangeError('EG02 parameters outside declared domain')
  const weightN=massKg*EG02.g
  const magneticN=momentAm2*gradientTPerM
  const injectedN=weightN*fractionalWeight
  const netChangeN=magneticN+injectedN
  const apparentPercent=100*netChangeN/weightN
  return {weightN,magneticN,injectedN,netChangeN,apparentPercent,
    magneticPercent:100*magneticN/weightN,
    matchingMomentAm2: gradientTPerM===0?null:injectedN/gradientTPerM}
}
function gaussianSolve(A,y) {
  const n=y.length, a=A.map((row,i)=>[...row,y[i]])
  let rank=0
  for(let col=0;col<n;col++){
    let best=rank
    for(let row=rank+1;row<n;row++) if(Math.abs(a[row][col])>Math.abs(a[best][col])) best=row
    if(Math.abs(a[best][col])<1e-10) continue
    ;[a[rank],a[best]]=[a[best],a[rank]]
    const div=a[rank][col]
    for(let j=col;j<=n;j++) a[rank][j]/=div
    for(let row=0;row<n;row++){
      if(row===rank) continue
      const f=a[row][col]
      for(let j=col;j<=n;j++) a[row][j]-=f*a[rank][j]
    }
    rank++
  }
  return rank===n?a.map(row=>row[n]):null
}
export function fitEG02(rows) {
  if(!Array.isArray(rows) || rows.length===0) return {identifiable:false,rank:0,fit:null}
  // force shift = f*(mg) + m_dipole*(dB/dz) + constant sensor offset.
  // Full rank needs both varied mass AND varied gradient under these assumptions.
  const feature=row=>[row.massKg*EG02.g,row.gradientTPerM,1]
  const a=Array.from({length:3},()=>[0,0,0])
  const b=[0,0,0]
  for(const row of rows){
    const f=feature(row)
    if(![...f,row.observedN].every(Number.isFinite)) throw new TypeError('invalid fixture')
    for(let i=0;i<3;i++) {
      b[i]+=f[i]*row.observedN
      for(let j=0;j<3;j++) a[i][j]+=f[i]*f[j]
    }
  }
  const x=gaussianSolve(a,b)
  if(!x) {
    // Rank of the design matrix (not of the normal equations) by Gram elimination.
    const r=a.map(row=>[...row])
    let rank=0
    for(let c=0;c<3;c++){
      let pivot=rank
      for(let k=rank+1;k<3;k++)if(Math.abs(r[k][c])>Math.abs(r[pivot][c]))pivot=k
      if(Math.abs(r[pivot][c])<1e-10)continue
      ;[r[pivot],r[rank]]=[r[rank],r[pivot]]
      const d=r[rank][c]
      for(let j=c;j<3;j++)r[rank][j]/=d
      for(let k=rank+1;k<3;k++){const v=r[k][c];for(let j=c;j<3;j++)r[k][j]-=v*r[rank][j]}
      rank++
    }
    return {identifiable:false,rank,fit:null}
  }
  const rmse=Math.sqrt(rows.reduce((sum,row)=>{
    const predicted=feature(row).reduce((t,v,i)=>t+v*x[i],0)
    return sum+(row.observedN-predicted)**2
  },0)/rows.length)
  return {identifiable:true,rank:3,fit:{
    fractionalWeight:x[0],momentAm2:x[1],sensorOffsetN:x[2],rmseN:rmse
  }}
}
export function runEG02({
  massKg=EG02.defaultMassKg, momentAm2=EG02.defaultMomentAm2,
  gradientTPerM=EG02.defaultGradientTPerM, fractionalWeight=0,
  offsetN=EG02.defaultOffsetN, dualMass=true, reverseGradient=true,
  noiseN=0
}={}) {
  if(![massKg,momentAm2,gradientTPerM,fractionalWeight,offsetN,noiseN].every(Number.isFinite)
    ||massKg<=0||massKg>5||Math.abs(momentAm2)>0.2||gradientTPerM<=0||gradientTPerM>5
    ||Math.abs(fractionalWeight)>.1||Math.abs(offsetN)>.05||noiseN<0||noiseN>.01)
    throw new RangeError('EG02 fixture outside synthetic controls')
  const masses=dualMass?[massKg,massKg*2]:[massKg]
  const gradients=reverseGradient?[-gradientTPerM,gradientTPerM]:[gradientTPerM]
  const rows=[]
  for(let m=0;m<masses.length;m++){
    for(let j=0;j<gradients.length;j++){
      for(let replica=0;replica<3;replica++){
        const mass=masses[m], gradient=gradients[j]
        const weightTermN=mass*EG02.g*fractionalWeight
        const magneticTermN=momentAm2*gradient
        const perturbationN=noiseN*Math.sin(17.11*(rows.length+1))
        rows.push({massKg:mass,gradientTPerM:gradient,replica,
          weightTermN,magneticTermN,offsetTermN:offsetN,perturbationN,
          observedN:weightTermN+magneticTermN+offsetN+perturbationN})
      }
    }
  }
  const regression=fitEG02(rows)
  return {schema:'nbg.eg02.e0.v1',provenance:'SIMULATED',authority:'NONE',
    claim:'linear toy identifiability, no measured gravitational effect',
    inputs:{massKg,momentAm2,gradientTPerM,fractionalWeight,offsetN,dualMass,reverseGradient,noiseN},
    budget:forceBudget({massKg,momentAm2,gradientTPerM,fractionalWeight}),
    records:rows, ...regression,
    caveat:'Assumes identical pickup moment at both masses, gradient reversal without apparatus changes, constant offset, linearity and calibrated forces. The toy setup is not a real device.'
  }
}
