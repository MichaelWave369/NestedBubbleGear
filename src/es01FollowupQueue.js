// ES-01 E8: preserve open questions after comparing two unsigned review drafts.
// This is not adjudication, reviewer authentication, source verification, or evidence promotion.
import {ES01_E5_FIELDS} from './es01ReviewPacket.js'
import {compareES01ReviewerPackets,ES01_E7_MAX_BYTES,ES01_E7_STATES} from './es01ReviewerDifference.js'

export const ES01_E8_MAX_BYTES=ES01_E7_MAX_BYTES
export const ES01_E8_ACTIONS=Object.freeze([
  {id:'NOT_SELECTED',label:'No follow-up selected'},
  {id:'CHECK_PRIMARY_SOURCE',label:'Check primary source and methods'},
  {id:'CLARIFY_ENDPOINT',label:'Clarify outcome definition and measurement'},
  {id:'CHECK_COMPARABILITY',label:'Check study setting and comparability'},
  {id:'REQUEST_INDEPENDENT_REVIEW',label:'Request independent methodological review'},
])
const allowed=new Set(ES01_E8_ACTIONS.map(a=>a.id))
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key)
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)

export function makeES01FollowupQueue(packetA,packetB,entries={}) {
  const pair=compareES01ReviewerPackets(packetA,packetB)
  if(pair.status!=='STRUCTURAL_PAIR_ONLY')
    throw new TypeError('E8 requires two E6-accepted E5 packets for exactly the same E0 study')
  if(!isObject(entries)) throw new TypeError('E8 annotations must be a plain field-keyed object')
  const keys=new Set(ES01_E5_FIELDS.map(f=>f.key))
  if(Object.keys(entries).some(key=>!keys.has(key))) throw new TypeError('Unknown E8 reviewer-note field')
  if(pair.fields.length!==ES01_E5_FIELDS.length||
     pair.fields.some(f=>!keys.has(f.key)||!ES01_E7_STATES.includes(f.status)))
    throw new TypeError('E7 field custody mismatch')
  const items=pair.fields.map(field=>{
    const entry=own(entries,field.key)?entries[field.key]:{}
    if(!isObject(entry)||Object.keys(entry).some(k=>!['action','question'].includes(k)))
      throw new TypeError('E8 field annotation must contain only action and question')
    const action=entry.action??'NOT_SELECTED'
    const question=entry.question??''
    if(!allowed.has(action)||typeof question!=='string'||question.length>1200)
      throw new TypeError('Invalid E8 follow-up action or question')
    return {
      fieldKey:field.key,label:field.label,comparisonState:field.status,
      followupAction:action,openQuestion:question.trim(),
      assessment:'UNRESOLVED_NOT_EVALUATED',
    }
  })
  return {
    schema:'ES01-E8-OPEN-QUESTIONS-QUEUE',version:'0.1.0',
    status:'DRAFT_UNVERIFIED',recordId:pair.recordId,sourceTitle:pair.sourceTitle,
    sourceUrl:pair.sourceUrl,sourceAuthority:'E0_CANONICAL_METADATA_ONLY',
    noteContentsIncluded:false,
    items,
    intake:{fieldsWithActions:items.filter(x=>x.followupAction!=='NOT_SELECTED').length,
      questionsWritten:items.filter(x=>x.openQuestion.length>0).length,
      totalFields:items.length,
      note:'Counts describe draft queue input, not reviewer agreement, completeness of research, source verification, or progress to clinical use.'},
    independentReviewerIdentityVerified:false,
    scientificClaimsEvaluated:false,
    adjudicationCompleted:false,
    biomedicalFindingsConfirmed:false,
    gate:'HOLD_REVIEW_INCOMPLETE',evidenceAuthority:'NONE',
    interpretation:'This is a source-bound, unsigned follow-up checklist. Neither the E7 text differences nor the E8 questions establish scientific disagreement, consensus, or a correct clinical conclusion.',
  }
}
