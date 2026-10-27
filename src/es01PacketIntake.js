// ES-01 E6: untrusted reviewer-packet intake, checked against local repository source custody.
// No signatures are used: matching metadata is NOT proof of file authorship, review, or truth.
import {ES01_E5_FIELDS,makeES01ReviewPacket} from './es01ReviewPacket.js'

export const ES01_E6_MAX_BYTES = 262144

const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x)
const keysEqual = (a,b) => obj(a) && obj(b) &&
  Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every(k => Object.hasOwn(b,k))

function deepSame(a,b) {
  if(Array.isArray(a)||Array.isArray(b)) return Array.isArray(a)&&Array.isArray(b)&&
    a.length===b.length&&a.every((x,i)=>deepSame(x,b[i]))
  if(obj(a)||obj(b)) return keysEqual(a,b)&&Object.keys(a).every(k=>deepSame(a[k],b[k]))
  return Object.is(a,b)
}

export function checkES01PacketIntake(input) {
  const errors=[]
  if(!obj(input)) return Object.freeze({status:'REJECTED',recordId:null,errors:['Expected a JSON object.'],notes:null,gate:'HOLD_REVIEW_INCOMPLETE'})
  const recordId=typeof input.source?.recordId==='string'?input.source.recordId:null
  if(!recordId) errors.push('Missing source record ID.')
  if(!obj(input.reviewerNotes)) errors.push('Missing or invalid reviewer notes object.')
  const expectedNoteKeys=ES01_E5_FIELDS.map(f=>f.key)
  if(obj(input.reviewerNotes) && (!keysEqual(input.reviewerNotes,Object.fromEntries(expectedNoteKeys.map(k=>[k,''])))))
    errors.push('Reviewer note fields differ from the six recognized E5 fields.')
  if(obj(input.reviewerNotes)) for(const field of ES01_E5_FIELDS) {
    const value=input.reviewerNotes[field.key]
    if(typeof value!=='string'||value.length>4000||value!==value.trim())
      errors.push('Invalid reviewer note format: '+field.key+'.')
  }
  let canonical=null
  if(recordId && obj(input.reviewerNotes)) {
    try {canonical=makeES01ReviewPacket(recordId,input.reviewerNotes)}
    catch {errors.push('Source ID is not present in the current E0–E4 evidence ledger.')}
  }
  if(canonical){
    if(!keysEqual(input,canonical)) errors.push('Packet fields differ from the E5 export schema.')
    for(const field of Object.keys(canonical)) {
      if(!deepSame(input[field],canonical[field]))
        errors.push('Mismatch in packet section: '+field+'.')
    }
  }
  const accepted=errors.length===0
  return Object.freeze({
    status:accepted?'STRUCTURE_MATCH_ONLY':'REJECTED',
    recordId:canonical?.source.recordId??recordId,
    sourceTitle:canonical?.source.title??null,
    sourceUrl:canonical?.source.url??null,
    errors,
    notes:accepted?canonical.reviewerNotes:null,
    filledNoteFields:accepted?canonical.intake.filledCount:0,
    gate:'HOLD_REVIEW_INCOMPLETE',
    verifiedByIndependentReviewer:false,
    clinicalEvidenceValidated:false,
    sourceAuthenticityProven:false,
    explanation:accepted
      ? 'Packet structure matches local E5 metadata, but no signature, authorship, independent review, or biomedical claim is verified.'
      : 'Packet is rejected for local review because its structure or source-linked metadata differs from the current E5 export contract.',
  })
}

export function makeES01IntakeReceipt(result) {
  if(!result||!['STRUCTURE_MATCH_ONLY','REJECTED'].includes(result.status))
    throw new TypeError('E6 receipt requires a completed local validation result')
  return {
    schema:'ES01-E6-LOCAL-INTAKE-RECEIPT',
    version:'0.1.0',
    status:result.status,
    recordId:result.recordId,
    sourceUrl:result.sourceUrl,
    issues:[...result.errors],
    filledNoteFields:result.filledNoteFields,
    statement:result.explanation,
    reviewerNotesIncluded:false,
    evidenceAuthority:'NONE',
    gate:'HOLD_REVIEW_INCOMPLETE',
    independentlyVerified:false,
    sourceAuthenticityProven:false,
    therapeuticClaimPromoted:false,
    note:'Local schema/custody comparison only; a matching unsigned JSON packet is not authenticated or independently scientifically reviewed.',
  }
}
