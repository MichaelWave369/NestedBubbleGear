import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {makeES01ReviewPacket} from '../src/es01ReviewPacket.js'
import {ES01_E8_MAX_BYTES,ES01_E8_ACTIONS,makeES01FollowupQueue} from '../src/es01FollowupQueue.js'
const read=p=>readFileSync(p,'utf8')
const records=JSON.parse(read('src/es01Evidence.json')).records
const copy=x=>JSON.parse(JSON.stringify(x))
assert.equal(ES01_E8_MAX_BYTES,262144)
assert.equal(ES01_E8_ACTIONS.length,5)
for(const row of records){
 const a=makeES01ReviewPacket(row.id,{fullMethods:'Private Reviewer A marker',harmEndpoint:'Untrusted wording A'})
 const b=makeES01ReviewPacket(row.id,{fullMethods:'Private Reviewer B marker',comparability:'Untrusted wording B'})
 const queue=makeES01FollowupQueue(a,b)
 assert.equal(queue.schema,'ES01-E8-OPEN-QUESTIONS-QUEUE')
 assert.equal(queue.recordId,row.id)
 assert.equal(queue.sourceUrl,row.source.url)
 assert.equal(queue.items.length,6)
 assert.equal(queue.status,'DRAFT_UNVERIFIED')
 assert.equal(queue.intake.fieldsWithActions,0)
 assert.equal(queue.intake.questionsWritten,0)
 assert.equal(queue.gate,'HOLD_REVIEW_INCOMPLETE')
 assert.equal(queue.evidenceAuthority,'NONE')
 assert.equal(queue.independentReviewerIdentityVerified,false)
 assert.equal(queue.scientificClaimsEvaluated,false)
 assert.equal(queue.adjudicationCompleted,false)
 assert.equal(queue.biomedicalFindingsConfirmed,false)
 assert.equal(queue.noteContentsIncluded,false)
 assert(queue.items.every(f=>f.assessment==='UNRESOLVED_NOT_EVALUATED'))
 assert(!JSON.stringify(queue).includes('Private Reviewer A marker'))
 assert(!JSON.stringify(queue).includes('Untrusted wording B'))
 const edited=makeES01FollowupQueue(a,b,{
  fullMethods:{action:'CHECK_PRIMARY_SOURCE',question:'Check the original methods section for sample details.'},
  benefitEndpoint:{action:'CLARIFY_ENDPOINT',question:'  Check units and uncertainty.  '},
 })
 assert.equal(edited.intake.fieldsWithActions,2)
 assert.equal(edited.intake.questionsWritten,2)
 assert.equal(edited.items[0].openQuestion,'Check the original methods section for sample details.')
 assert.equal(edited.items[1].openQuestion,'Check units and uncertainty.')
 assert(edited.items.every(f=>f.assessment==='UNRESOLVED_NOT_EVALUATED'))
 assert.equal(edited.gate,'HOLD_REVIEW_INCOMPLETE')
 for(const bad of [
  {fullMethods:{action:'VERIFIED',question:'no'}},
  {fullMethods:{action:'NOT_SELECTED',question:'x'.repeat(1201)}},
  {fullMethods:{question:34}},
  {fullMethods:{action:'NOT_SELECTED',question:'',certified:true}},
  {rogue:{action:'NOT_SELECTED'}},
 ])assert.throws(()=>makeES01FollowupQueue(a,b,bad))
 const tampered=copy(a);tampered.source.originalClaim='Definite clinical cure'
 assert.throws(()=>makeES01FollowupQueue(tampered,b),/two E6-accepted/)
}
assert.throws(()=>makeES01FollowupQueue(makeES01ReviewPacket(records[0].id),makeES01ReviewPacket(records[1].id)),/same E0 study/)
const ui=read('src/ES01FollowupQueue.jsx')
for(const token of ['useState','type="file"','multiple','file.size>ES01_E8_MAX_BYTES','file.text()','compareES01ReviewerPackets','makeES01FollowupQueue','URL.createObjectURL','URL.revokeObjectURL','aria-live','Export E8 open-questions JSON','maxLength={1200}','noopener noreferrer'])
 assert(ui.includes(token),'UI missing '+token)
assert(read('src/ES01Explorer.jsx').includes('<ES01FollowupQueue />'))
assert(read('src/es01Explorer.css').includes('.es01-e8'))
assert(read('src/researchAtlasData.js').includes("row('ES-01-E8'"))
const docs=read('docs/ES01_E8_REVIEW_FOLLOWUPS.md')
for(const token of ['DRAFT_UNVERIFIED','UNRESOLVED_NOT_EVALUATED','HOLD_REVIEW_INCOMPLETE','not authenticate reviewers','Ledger Above Ego'])
 assert(docs.toLowerCase().includes(token.toLowerCase()),'Doc missing '+token)
assert(JSON.parse(read('package.json')).scripts.test.includes('test:es01-e8'))
console.log('PASS ES-01 E8: ten source-bound follow-up queues with no claims, approval states, or original reviewer-note disclosure')
