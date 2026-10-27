// ES-01 E7: compare two unsigned, untrusted review packets only after E6 structural screening.
// Exact text equality is NOT scientific agreement; difference is NOT scientific disagreement.
import {ES01_E5_FIELDS} from './es01ReviewPacket.js'
import {checkES01PacketIntake,ES01_E6_MAX_BYTES} from './es01PacketIntake.js'

export const ES01_E7_MAX_BYTES = ES01_E6_MAX_BYTES
export const ES01_E7_STATES = Object.freeze([
  'BOTH_BLANK','ONLY_A_HAS_TEXT','ONLY_B_HAS_TEXT','EXACT_TEXT_MATCH','TEXT_DIFFERS'
])

function classify(a,b) {
  if(!a&&!b) return 'BOTH_BLANK'
  if(!a) return 'ONLY_B_HAS_TEXT'
  if(!b) return 'ONLY_A_HAS_TEXT'
  return a===b?'EXACT_TEXT_MATCH':'TEXT_DIFFERS'
}

export function compareES01ReviewerPackets(packetA,packetB) {
  const a=checkES01PacketIntake(packetA)
  const b=checkES01PacketIntake(packetB)
  const errors=[]
  if(a.status!=='STRUCTURE_MATCH_ONLY') errors.push('Packet A failed E6 source-custody validation: '+a.errors.join('; '))
  if(b.status!=='STRUCTURE_MATCH_ONLY') errors.push('Packet B failed E6 source-custody validation: '+b.errors.join('; '))
  if(errors.length===0 && a.recordId!==b.recordId)
    errors.push('Packets refer to different E0 sources. E7 only compares two packets for the same study.')
  if(errors.length) return {
    status:'REJECTED',errors,recordId:null,sourceTitle:null,sourceUrl:null,fields:[],
    gate:'HOLD_REVIEW_INCOMPLETE',evidenceAuthority:'NONE',
    reviewerIndependenceVerified:false,semanticAgreementEvaluated:false,
    originalEvidenceAltered:false,
  }
  const fields=ES01_E5_FIELDS.map(field=>({
    key:field.key,label:field.label,
    status:classify(a.notes[field.key],b.notes[field.key]),
    noteA:a.notes[field.key],
    noteB:b.notes[field.key],
  }))
  const counts=Object.fromEntries(ES01_E7_STATES.map(name=>[name,fields.filter(x=>x.status===name).length]))
  return {
    status:'STRUCTURAL_PAIR_ONLY',errors:[],recordId:a.recordId,sourceTitle:a.sourceTitle,sourceUrl:a.sourceUrl,
    fields,counts,
    allNotesIdentical:counts.TEXT_DIFFERS===0&&counts.ONLY_A_HAS_TEXT===0&&counts.ONLY_B_HAS_TEXT===0,
    gate:'HOLD_REVIEW_INCOMPLETE',evidenceAuthority:'NONE',
    reviewerIndependenceVerified:false,semanticAgreementEvaluated:false,
    originalEvidenceAltered:false,
    interpretation:'Differences are literal text differences, not a semantic, scientific or clinical comparison. Matching text can be copied or coincidental; reviewer independence and source correctness are not authenticated.',
  }
}

export function makeES01DifferenceReceipt(result) {
  if(!result||result.status!=='STRUCTURAL_PAIR_ONLY')
    throw new TypeError('E7 receipt requires a structurally accepted same-study packet pair')
  return {
    schema:'ES01-E7-LOCAL-DIFFERENCE-RECEIPT',version:'0.1.0',
    status:'STRUCTURAL_PAIR_ONLY',
    recordId:result.recordId,sourceUrl:result.sourceUrl,
    fieldStates:result.fields.map(x=>({key:x.key,status:x.status})),
    counts:{...result.counts},
    notesIncluded:false,
    reviewerIdentityVerified:false,independentReplicationVerified:false,
    semanticAgreementEvaluated:false,sourceEvidenceValidated:false,
    evidenceAuthority:'NONE',gate:'HOLD_REVIEW_INCOMPLETE',
    interpretation:'Exact textual comparison of two unsigned source-bound drafts only. No independent-review, biomedical outcome, causal, or therapeutic conclusion.',
  }
}
