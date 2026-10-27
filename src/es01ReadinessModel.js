// E4 review-readiness gates. This evaluates DOCUMENTATION COMPLETENESS only.
// It does not estimate drug safety, efficacy, mechanism, evidence quality or potencies.
export const ES01_E4_FIELDS=Object.freeze([
  {key:'fullMethods',label:'Primary methods review',pending:'NOT_REVIEWED'},
  {key:'benefitEndpoint',label:'Desired-outcome extraction',pending:'NOT_EXTRACTED'},
  {key:'harmEndpoint',label:'Adverse-outcome extraction',pending:'NOT_EXTRACTED'},
  {key:'comparability',label:'Design and exposure comparability',pending:'NOT_ASSESSED'},
  {key:'riskOfBias',label:'Study bias and confounding assessment',pending:'NOT_ASSESSED'},
  {key:'replicationSearch',label:'Independent replication search',pending:'NOT_SEARCHED'},
])
export function checkES01ReviewReadiness(row) {
  if (!row || typeof row.recordId!=='string') throw new TypeError('E4 needs a source-bound review record')
  // Deliberately fail closed: future upgrades must implement independent evidence custody,
  // uncertainty extraction and protocol review; changing a label must never claim validated efficacy.
  const blockers=ES01_E4_FIELDS.map(field=>({field:field.key,label:field.label,status:row[field.key]}))
  if (blockers.some(x=>typeof x.status!=='string'||x.status.length===0)) throw new TypeError('E4 missing review gate status')
  return Object.freeze({result:'HOLD_REVIEW_INCOMPLETE',blockers,reason:'Review statuses are metadata only. No effect-separation comparison or biomedical claim can be promoted by this software.',canInferClinicalBenefit:false,canPoolEffectEstimates:false})
}
