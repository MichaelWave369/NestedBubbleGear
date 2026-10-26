// EG-03 E0: SI Maxwell–London one-dimensional static slab, Meissner assumptions.
// Finite-difference solve is independent of the closed-form cosh reference.
// This is conventional superconducting electrodynamics, not altered gravity.
export const EG03 = Object.freeze({
  schema:'nbg.eg03.e0.v1',provenance:'SIMULATED',authority:'NONE',
  mu0:4*Math.PI*1e-7, // H/m, standard pedagogical SI approximation
  defaults:Object.freeze({ penetrationNm:80, thicknessNm:400, surfaceFieldmT:10, nodes:101 }),
})
export function londonLengthSI({carrierMassKg,carrierDensityM3,carrierChargeC}){
  if(![carrierMassKg,carrierDensityM3,carrierChargeC].every(Number.isFinite) ||
     carrierMassKg<=0 || carrierDensityM3<=0 || carrierChargeC===0) throw new RangeError('invalid London parameters')
  return Math.sqrt(carrierMassKg / (EG03.mu0 * carrierDensityM3 * carrierChargeC ** 2))
}
function parse({penetrationNm=80,thicknessNm=400,surfaceFieldmT=10,nodes=101}={}){
  if(![penetrationNm,thicknessNm,surfaceFieldmT,nodes].every(Number.isFinite) ||
     penetrationNm<30 || penetrationNm>250 || thicknessNm<40 || thicknessNm>1500 ||
     surfaceFieldmT<0 || surfaceFieldmT>25 || !Number.isInteger(nodes) ||
     nodes<11 || nodes>401 || nodes%2!==1) throw new RangeError('EG-03 parameters outside controlled toy domain')
  return {penetrationNm,thicknessNm,surfaceFieldmT,nodes}
}
export function solveLondonSlab(options={}){
  const input=parse(options)
  const {penetrationNm,thicknessNm,surfaceFieldmT,nodes}=input
  const lambdaM=penetrationNm*1e-9, widthM=thicknessNm*1e-9, BsurfaceT=surfaceFieldmT*1e-3
  const dxM=widthM/(nodes-1), a=dxM/lambdaM, diag=2+a*a
  const interior=nodes-2
  // Dirichlet: B(-d/2)=B(d/2)=Bsurface. Interior:
  // -B[i-1]+(2+(dx/lambda)^2)*B[i]-B[i+1]=0.
  const cPrime=new Float64Array(interior)
  const dPrime=new Float64Array(interior)
  const rhs=i=> (i===0?BsurfaceT:0)+(i===interior-1?BsurfaceT:0)
  cPrime[0]=-1/diag
  dPrime[0]=rhs(0)/diag
  for(let i=1;i<interior;i++){
    const denominator=diag+cPrime[i-1]
    cPrime[i]=i===interior-1?0:-1/denominator
    dPrime[i]=(rhs(i)+dPrime[i-1])/denominator
  }
  const numerical=new Float64Array(nodes)
  numerical[0]=BsurfaceT;numerical[nodes-1]=BsurfaceT
  numerical[nodes-2]=dPrime[interior-1]
  for(let i=interior-2;i>=0;i--)numerical[i+1]=dPrime[i]-cPrime[i]*numerical[i+2]
  const halfRatio=widthM/(2*lambdaM)
  const factor=Math.cosh(halfRatio)
  const rows=[]
  let maxAbsErrorT=0, maxResidualT=0, jIntegralSigned=0
  for(let i=0;i<nodes;i++){
    const xM=-widthM/2+i*dxM, u=xM/lambdaM
    const analyticT=BsurfaceT*Math.cosh(u)/factor
    const jApm2=BsurfaceT*Math.sinh(u)/(EG03.mu0*lambdaM*factor)
    const derivativeTperM=(i===0?(numerical[1]-numerical[0])/dxM:
      i===nodes-1?(numerical[i]-numerical[i-1])/dxM:
      (numerical[i+1]-numerical[i-1])/(2*dxM))
    const jNumericalApm2=derivativeTperM/EG03.mu0
    const errorT=Math.abs(numerical[i]-analyticT)
    maxAbsErrorT=Math.max(maxAbsErrorT,errorT)
    if(i>0&&i<nodes-1){
      const residual=Math.abs(numerical[i-1]-diag*numerical[i]+numerical[i+1])
      maxResidualT=Math.max(maxResidualT,residual)
    }
    if(i>0){
      const jPrevious = BsurfaceT*Math.sinh((xM-dxM)/lambdaM)/(EG03.mu0*lambdaM*factor)
      jIntegralSigned+=0.5*(jApm2+jPrevious)*dxM
    }
    rows.push({ xNm:xM*1e9, analyticmT:analyticT*1e3,
      numericalmT:numerical[i]*1e3, unscreenedmT:surfaceFieldmT,
      currentApm2:jApm2,numericalCurrentApm2:jNumericalApm2 })
  }
  const center=rows[(nodes-1)/2]
  return {
    schema:EG03.schema, provenance:EG03.provenance, authority:EG03.authority,
    claim:'conventional London screening, not evidence of gravity modification',
    assumptions:['uniform isotropic London penetration depth','static Meissner state',
      'infinite planar slab with parallel applied field','both faces held at identical tangential field',
      'no vortices, edge fields, heating, gravity coupling or material transition model'],
    input,metrics:{
      centerFraction:BsurfaceT===0?1:center.analyticmT/surfaceFieldmT,
      centerAnalyticmT:center.analyticmT,
      centerNumericmT:center.numericalmT,
      averageFraction:Math.tanh(halfRatio)/halfRatio,
      maxAbsErrorMicroT:maxAbsErrorT*1e6,
      maxDiscreteResidualT:maxResidualT,
      signedSheetCurrentApm:jIntegralSigned,
      halfSheetCurrentApm:BsurfaceT===0?0:(BsurfaceT-center.analyticmT*1e-3)/EG03.mu0,
      ratio:thicknessNm/penetrationNm,
    },
    rows,
  }
}
