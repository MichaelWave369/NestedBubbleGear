// EG-06 · Registered synthetic competing-prediction experiment.
// Neither Li–Torr nor Kowitt's contested field equations are implemented.
// Models share a measured/assumed linear force channel and strict source gates.
export const EG06=Object.freeze({
 schema:'nbg.eg06.e0.v1', provenance:'SIMULATED',authority:'NONE',
 gMps2:9.80665,
 currentSequence:Object.freeze([0,0.35,0.75,1,0.6,0,0.9,0.3,1,0.1,0.55,0]),
 massKg:0.1,gradientTPerM:0.8,
 offsetN:0.0012,magneticMomentAm2:0.016,
 evenPickupN:0.003,thermalCoefficientN:0.0025,transientCoefficientN:0.0008,
});
export const EG06_MODELS=Object.freeze([
 {id:'C0',label:'Conventional artifact model',origin:'ESTABLISHED_MECHANISMS / SYNTHETIC_COEFFICIENTS',
  equation:'y=b + m_z (gradient) I² + p I² + θ T + ν ΔI',
  columns:Object.freeze(['offset','gradientDrive','evenDrive','thermal','transient']),
  interpretation:'Magnetic pickup, current-even pickup, lagging thermal response, vibration transient and offset.'},
 {id:'X1',label:'Generic mass-scaled residual model',origin:'PROPOSED / NOT_LI_TORR',
  equation:'y=C0 + f (M g) I²',
  columns:Object.freeze(['offset','gradientDrive','evenDrive','thermal','transient','massDrive']),
  interpretation:'Adds one testable phenomenological mass-scaled term; not an established gravity law or published Li–Torr prediction.'},
]);
const order=['offset','gradientDrive','evenDrive','thermal','transient','massDrive'];
const norm=x=>Math.sqrt(x.reduce((sum,v)=>sum+v*v,0));
// Modified Gram–Schmidt on small, unweighted, dimensionful synthetic design;
// a rank-deficient observer is REFUSED rather than regularized into a claim.
export function fitEG06(rows,modelId,training=true){
 const definition=EG06_MODELS.find(m=>m.id===modelId);
 if(!definition)throw new RangeError('unknown model');
 const data=training?rows.filter(row=>row.phase==='TRAIN'):rows;
 const n=data.length,k=definition.columns.length;
 if(n<=k)return {id:modelId,identifiable:false,reason:'NOT_ENOUGH_OBSERVATIONS',k,n};
 const y=data.map(row=>row.forceN), A=definition.columns.map(name=>data.map(row=>row.features[name]));
 const q=[],R=Array.from({length:k},()=>Array(k).fill(0));
 const scale=Math.max(1,...A.map(norm));
 for(let j=0;j<k;j++){
  const v=[...A[j]];
  // Reorthogonalize for robustness in the small, correlated synthetic design.
  for(let pass=0;pass<2;pass++)for(let i=0;i<j;i++){
   const a=q[i].reduce((sum,qi,l)=>sum+qi*v[l],0);
   R[i][j]+=a;
   for(let l=0;l<n;l++)v[l]-=a*q[i][l];
  }
  const len=norm(v);
  if(len<scale*1e-10)return {id:modelId,identifiable:false,reason:'RANK_DEFICIENT',k,n,failedColumn:definition.columns[j]};
  R[j][j]=len;q.push(v.map(x=>x/len));
 }
 const qt=q.map(col=>col.reduce((sum,val,i)=>sum+val*y[i],0));
 const beta=Array(k).fill(0);
 for(let j=k-1;j>=0;j--){
  let b=qt[j];for(let a=j+1;a<k;a++)b-=R[j][a]*beta[a];
  beta[j]=b/R[j][j];
 }
 const coefficients=Object.fromEntries(definition.columns.map((name,i)=>[name,beta[i]]));
 const predict=row=>definition.columns.reduce((acc,name)=>acc+coefficients[name]*row.features[name],0);
 const residuals=data.map(row=>row.forceN-predict(row));
 const rss=residuals.reduce((a,b)=>a+b*b,0);
 const rmseN=Math.sqrt(rss/n);
 // BIC is a descriptive model selection score, NOT a significance test
 // and NOT evidence a specific physical cause has been identified.
 const bic=n*Math.log(Math.max(rss/n,1e-30))+k*Math.log(n);
 const holdout=rows.filter(row=>row.phase==='HOLDOUT');
 const holdoutRmseN=holdout.length?Math.sqrt(holdout.reduce((sum,row)=>{
  const e=row.forceN-predict(row);return sum+e*e;
 },0)/holdout.length):null;
 return {id:modelId,identifiable:true,n,k,coefficients,rmseN,rss,bic,holdoutRmseN};
}
export function predictEG06(row,fit) {
 if(!fit?.identifiable)return null;
 return Object.entries(fit.coefficients).reduce((sum,[key,coef])=>sum+coef*row.features[key],0);
}
export function runEG06({
 massKg=EG06.massKg,gradientTPerM=EG06.gradientTPerM,
 massContrast=true,gradientReversal=true,
 massLikeFraction=0,massCorrelatedArtifactFraction=0,noiseN=0.0001,
}={}) {
 if(![massKg,gradientTPerM,massLikeFraction,massCorrelatedArtifactFraction,noiseN].every(Number.isFinite)||
    massKg<0.05||massKg>0.5||gradientTPerM<0.1||gradientTPerM>3||
    massLikeFraction<0||massLikeFraction>0.04||
    massCorrelatedArtifactFraction<0||massCorrelatedArtifactFraction>0.04||
    noiseN<0||noiseN>0.002)
  throw new RangeError('outside EG-06 synthetic fixture controls');
 const rows=[], masses=massContrast?[massKg,2*massKg]:[massKg];
 const signedGradients=gradientReversal?[-gradientTPerM,gradientTPerM]:[gradientTPerM];
 for(let m=0;m<masses.length;m++)for(let s=0;s<signedGradients.length;s++){
  let lag=0,previousI=0;
  for(let tick=0;tick<EG06.currentSequence.length;tick++){
   const I=EG06.currentSequence[tick],i2=I*I,delta=I-previousI;
   previousI=I;lag=0.72*lag+0.28*i2;
   const gradient=signedGradients[s];
   const weight=masses[m]*EG06.gMps2;
   const features={
    offset:1,gradientDrive:gradient*i2,evenDrive:i2,
    thermal:lag,transient:delta,massDrive:weight*i2,
   };
   const conventionalN=EG06.offsetN+EG06.magneticMomentAm2*features.gradientDrive+
     EG06.evenPickupN*i2+EG06.thermalCoefficientN*lag+
     EG06.transientCoefficientN*delta;
   // The following distinct hidden causes share EXACTLY the same observable column.
   // A nonzero 'X1' regression coefficient cannot distinguish their physical origins.
   const massLikeN=massLikeFraction*features.massDrive;
   const correlatedArtifactN=massCorrelatedArtifactFraction*features.massDrive;
   const perturbationN=noiseN*Math.sin(17.19*(tick+1)+4.21*m+1.63*s);
   rows.push({tick,massKg:masses[m],gradientTPerM:gradient,
    normalizedCurrent:I,phase:tick<9?'TRAIN':'HOLDOUT',
    features,conventionalN,massLikeN,correlatedArtifactN,perturbationN,
    forceN:conventionalN+massLikeN+correlatedArtifactN+perturbationN});
  }
 }
 const conventional=fitEG06(rows,'C0');
 const extra=fitEG06(rows,'X1');
 const identifiable=conventional.identifiable&&extra.identifiable;
 const evidence=identifiable?{
  deltaBIC:conventional.bic-extra.bic,
  holdoutImprovementN:conventional.holdoutRmseN-extra.holdoutRmseN,
  favoredByBIC:conventional.bic-extra.bic>6?'X1':extra.bic-conventional.bic>6?'C0':'UNDECIDED',
  warning:'Model preference is not causal identification. X1 has an exactly aliased conventional mass-correlated fixture artifact.',
 }:null;
 return {
  schema:EG06.schema,provenance:EG06.provenance,authority:EG06.authority,
  status:identifiable?'MODEL_COMPARISON_ONLY':'REFUSED_NOT_IDENTIFIABLE',
  claim:'Phenomenological synthetic model competition; no reproduced Li–Torr or Kowitt force prediction, no measured gravity',
  input:{massKg,gradientTPerM,massContrast,gradientReversal,
   massLikeFraction,massCorrelatedArtifactFraction,noiseN},
  fixture:{rows:rows.length,training:rows.filter(x=>x.phase==='TRAIN').length,
    holdout:rows.filter(x=>x.phase==='HOLDOUT').length,
    measuredChannels:['mass','signed gradient','current','thermal proxy','drive transient','force'],
    requires:['two specimen masses','both signed gradients','held-out future steps',
      'calibrated common pickup coefficients','independent mass-correlated artifact control for physical attribution']},
  models:EG06_MODELS,conventional,extra,evidence,
  rows:rows.map(row=>({...row,
   predictedC0N:predictEG06(row,conventional),
   predictedX1N:predictEG06(row,extra)})),
  exactCausalCollision:{
   sumFraction:massLikeFraction+massCorrelatedArtifactFraction,
   construction:'f*MgI² and a mass-correlated fixture pickup c*MgI² have identical columns for every observation',
   status:'PHYSICAL_ORIGIN_NON_IDENTIFIABLE_EVEN_WHEN_X1_FIT_IS_FULL_RANK',
  },
  sourceBoundary:{
   liTorr1991:'PUBLISHED_THEORY_NOT_RECONSTRUCTED',
   liTorr1992:'PARTIAL_EQUATION_CUSTODY_NOT_FORCE_PREDICTION',
   kowitt1994:'PUBLISHER_ABSTRACT_ONLY_FULL_CRITIQUE_PENDING',
  },
 };
}
