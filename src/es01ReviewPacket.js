// ES-01 E5: deterministic, human-readable reviewer handoff. No evidence certification.
// Independent reviewer input is UNVERIFIED and never mutates E0-E4 or passes E4 gates.
import evidence from './es01Evidence.json' with { type: 'json' }
import claims from './es01ClaimAudit.json' with { type: 'json' }
import hypotheses from './es01Hypotheses.json' with { type: 'json' }
import readiness from './es01Readiness.json' with { type: 'json' }
import {ES01_E4_FIELDS,checkES01ReviewReadiness} from './es01ReadinessModel.js'
import {ES01_STUDY_CONTEXT} from './es01Comparison.js'

export const ES01_E5_FIELDS = Object.freeze([
  {key:'fullMethods',label:'Methods and source location',hint:'Public section, page or DOI supporting the study-design description'},
  {key:'benefitEndpoint',label:'Desired outcome definition and uncertainty',hint:'Outcome definition, units and what is or is not quantified'},
  {key:'harmEndpoint',label:'Unwanted outcome definition and uncertainty',hint:'Separate outcome definitions; do not infer absence from an unmeasured effect'},
  {key:'comparability',label:'Population, exposure and timing differences',hint:'Document why this can or cannot be compared with other studies'},
  {key:'riskOfBias',label:'Bias, confounds and study limitations',hint:'Describe relevant caveats and what further source checks are required'},
  {key:'replicationSearch',label:'Independent replication search notes',hint:'Where a search was performed; do not assert none exists without a documented search'},
])

const evidenceById = new Map(evidence.records.map(r=>[r.id,r]))
const auditsById = new Map(claims.records.map(r=>[r.recordId,r]))
const hypothesesBySource = new Map(hypotheses.records.map(r=>[r.sourceRecordId,r]))
const readinessById = new Map(readiness.records.map(r=>[r.recordId,r]))
const textOnly = value => typeof value==='string' ? value.trim().slice(0,4000) : ''

export function makeES01ReviewPacket(recordId,notes={}) {
  const source=evidenceById.get(recordId)
  const audit=auditsById.get(recordId)
  const hypothesis=hypothesesBySource.get(recordId)
  const screen=readinessById.get(recordId)
  const context=ES01_STUDY_CONTEXT[recordId]
  if(!source || !audit || !hypothesis || !screen || !context) throw new TypeError('E5 needs an existing E0-E4 source-linked record')
  if(audit.sourceUrl!==source.source.url||screen.hypothesisId!==hypothesis.id||hypothesis.sourceRecordId!==recordId)
    throw new Error('E5 source-custody mismatch')
  const reviewerNotes=Object.fromEntries(ES01_E5_FIELDS.map(field=>[field.key,textOnly(notes[field.key])]))
  const blankFields=ES01_E5_FIELDS.filter(field=>!reviewerNotes[field.key]).map(field=>field.key)
  return {
    schema:'ES01-E5-REVIEW-HANDOFF',
    version:'0.1.0',
    status:'DRAFT_UNVERIFIED',
    origin:'PUBLIC_ATLAS_BROWSER_EXPORT',
    evaluationAuthority:'NONE',
    verifiedByIndependentReviewer:false,
    privacy:'Reviewer notes remain in this browser tab until exported; not sent to a server by this feature.',
    source:{
      recordId:source.id,family:source.family,compound:source.compound,evidenceTier:source.evidenceTier,
      title:source.source.title,url:source.source.url,year:source.source.year,
      studySetting:context.setting,originalClaim:source.observed,
    },
    sourceCustody:{
      scope:audit.scopeLevel,reviewStatus:audit.reviewStatus,
      sourceSupported:audit.supported,notEstablished:audit.notEstablished,
      sourceLocation:audit.primaryLocation,
    },
    researchQuestion:{
      id:hypothesis.id,question:hypothesis.question,
      candidate:hypothesis.candidate,alternative:hypothesis.alternative,
      possibleDisconfirmation:hypothesis.couldCountAgainst,
      boundaries:hypothesis.interpretationBoundary,
      status:hypothesis.status,
    },
    readiness:{
      gate:checkES01ReviewReadiness(screen).result,
      requiredFields:ES01_E4_FIELDS.map(field=>({key:field.key,label:field.label,reviewState:screen[field.key]})),
      nextEvidence:screen.nextExtraction,confound:screen.mostImportantConfound,
      prohibitedInference:screen.prohibitedInference,
    },
    reviewerNotes,
    intake:{filledCount:ES01_E5_FIELDS.length-blankFields.length,totalCount:ES01_E5_FIELDS.length,blankFields,
      note:'Note completeness only. Does not update the E4 ledger or establish source correctness.'},
    decisions:{claimPromoted:false,clinicalEfficacyInferred:false,quantitativeComparisonAuthorized:false},
  }
}
