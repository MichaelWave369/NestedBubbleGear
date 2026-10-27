import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {makeES01ReviewPacket,ES01_E5_FIELDS} from '../src/es01ReviewPacket.js'
import {checkES01PacketIntake,makeES01IntakeReceipt,ES01_E6_MAX_BYTES} from '../src/es01PacketIntake.js'
const text=p=>readFileSync(p,'utf8')
const source=JSON.parse(text('src/es01Evidence.json'))
const clone=x=>JSON.parse(JSON.stringify(x))
assert.equal(ES01_E6_MAX_BYTES,262144)
for(const record of source.records){
  const original=makeES01ReviewPacket(record.id)
  const ok=checkES01PacketIntake(original)
  assert.equal(ok.status,'STRUCTURE_MATCH_ONLY')
  assert.equal(ok.recordId,record.id)
  assert.equal(ok.sourceUrl,record.source.url)
  assert.equal(ok.verifiedByIndependentReviewer,false)
  assert.equal(ok.sourceAuthenticityProven,false)
  assert.equal(ok.clinicalEvidenceValidated,false)
  assert.equal(ok.gate,'HOLD_REVIEW_INCOMPLETE')
  const filled=makeES01ReviewPacket(record.id,{fullMethods:'Reviewer draft note only'})
  const goodNotes=checkES01PacketIntake(filled)
  assert.equal(goodNotes.status,'STRUCTURE_MATCH_ONLY')
  assert.equal(goodNotes.filledNoteFields,1)
  assert.equal(goodNotes.notes.fullMethods,'Reviewer draft note only')
  const receipt=makeES01IntakeReceipt(goodNotes)
  assert.equal(receipt.status,'STRUCTURE_MATCH_ONLY')
  assert.equal(receipt.reviewerNotesIncluded,false)
  assert.equal(receipt.therapeuticClaimPromoted,false)
  assert.equal(receipt.gate,'HOLD_REVIEW_INCOMPLETE')
  assert(!('notes' in receipt)&&!('reviewerNotes' in receipt))
  for(const edit of [
    p=>{p.source.url='https://example.test/forged'},
    p=>{p.source.originalClaim='clinically proven'},
    p=>{p.sourceCustody.notEstablished='none'},
    p=>{p.researchQuestion.candidate='guaranteed'},
    p=>{p.readiness.gate='APPROVED'},
    p=>{p.readiness.requiredFields[0].reviewState='COMPLETE'},
    p=>{p.decisions.clinicalEfficacyInferred=true},
    p=>{p.verifiedByIndependentReviewer=true},
    p=>{p.intake.filledCount=6},
    p=>{p.reviewerNotes.fullMethods='x'.repeat(4001)},
    p=>{p.reviewerNotes.unexpected='injected'},
    p=>{p.extra='unexpected field'},
    p=>{p.status='VERIFIED'},
    p=>{p.source.recordId='DOES_NOT_EXIST'},
  ]){const altered=clone(original);edit(altered);assert.equal(checkES01PacketIntake(altered).status,'REJECTED',record.id+' altered packet accepted')}
}
for(const invalid of [null,[],false,'text',{source:{}},{source:{recordId:'unknown'},reviewerNotes:{}}])assert.equal(checkES01PacketIntake(invalid).status,'REJECTED')
assert.equal(ES01_E5_FIELDS.length,6)
const ui=text('src/ES01PacketIntake.jsx')
for(const token of ['type="file"','accept=".json,application/json"','file.size>ES01_E6_MAX_BYTES','file.text()','JSON.parse(content)','checkES01PacketIntake','aria-live','STRUCTURE_MATCH_ONLY','Export intake receipt','noopener noreferrer'])assert(ui.includes(token),'UI missing '+token)
assert(text('src/ES01Explorer.jsx').includes('<ES01PacketIntake />'))
assert(text('src/es01Explorer.css').includes('.es01-e6'))
const docs=text('docs/ES01_E6_LOCAL_PACKET_INTAKE.md')
for(const token of ['not cryptographic integrity','unsigned JSON','HOLD_REVIEW_INCOMPLETE','256 KiB','Ledger Above Ego'])assert(docs.toLowerCase().includes(token.toLowerCase()),'missing protocol '+token)
assert(text('src/researchAtlasData.js').includes("row('ES-01-E6'"))
assert(JSON.parse(text('package.json')).scripts.test.includes('test:es01-e6'))
console.log('PASS ES-01 E6: canonical custody comparisons, 10 source records, adversarial failures, no claim promotion')
