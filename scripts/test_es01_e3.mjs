import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const data=p=>JSON.parse(readFileSync(p,'utf8'))
const src=p=>readFileSync(p,'utf8')
const origin=data('src/es01Evidence.json')
const audits=data('src/es01ClaimAudit.json')
const hypotheses=data('src/es01Hypotheses.json')
assert.equal(hypotheses.schema,'ES01-E3-QUESTION-CONTRACT')
assert(hypotheses.status.includes('NOT PREREGISTERED')&&hypotheses.status.includes('NOT EXECUTED'))
assert.equal(hypotheses.records.length,origin.records.length)
assert.equal(new Set(hypotheses.records.map(h=>h.id)).size,hypotheses.records.length)
const evidence=new Map(origin.records.map(r=>[r.id,r]))
const audited=new Set(audits.records.map(a=>a.recordId))
assert.deepEqual(new Set(hypotheses.records.map(h=>h.sourceRecordId)),new Set(origin.records.map(r=>r.id)))
assert.deepEqual(new Set(hypotheses.records.map(h=>h.family)),new Set(origin.families))
for(const h of hypotheses.records){
  assert(evidence.has(h.sourceRecordId)&&audited.has(h.sourceRecordId),'unverified binding '+h.id)
  assert.equal(h.family,evidence.get(h.sourceRecordId).family)
  assert.equal(h.status,'DRAFT_UNTESTED')
  assert.equal(h.result,'NONE')
  assert.equal(h.evidenceAuthority,'NONE')
  for(const key of ['question','candidate','alternative','discriminatingEvidence','couldCountAgainst','interpretationBoundary']){
    assert(typeof h[key]==='string'&&h[key].length>=75,'missing/incomplete '+key+' for '+h.id)
  }
  assert.notEqual(h.candidate,h.alternative,'candidate and alternative identical')
  assert.notEqual(h.candidate,h.couldCountAgainst,'missing genuine failure candidate')
  assert(Array.isArray(h.requiredEvidence)&&h.requiredEvidence.length>=3,'missing gaps '+h.id)
  for(const item of h.requiredEvidence)assert(item.length>=20)
  assert(!('effectSize' in h||'dose' in h||'trialResult' in h))
}
const ui=src('src/ES01HypothesisLab.jsx'),explorer=src('src/ES01Explorer.jsx'),css=src('src/es01Explorer.css')
for(const token of ['useState','DRAFT_UNTESTED','couldCountAgainst','alternative','requiredEvidence','aria-live','noopener noreferrer','sourceRecordId'])assert(ui.includes(token),'UI missing '+token)
assert(explorer.includes('<ES01HypothesisLab />'))
assert(css.includes('.es01-e3')&&css.includes('@media(max-width:760px)'))
const guide=src('docs/ES01_E3_FALSIFIABILITY_CONTRACTS.md')
for(const token of ['NOT PREREGISTERED','NOT EXECUTED','NBG experimental authority','NOT equivalent','not preregistered','Ledger Above Ego']){
 assert(guide.toLowerCase().includes(token.toLowerCase()),'missing E3 boundary '+token)
}
const atlas=src('src/researchAtlasData.js')
assert(atlas.includes("row('ES-01-E3'"))
assert(JSON.parse(src('package.json')).scripts.test.includes('test:es01-e3'))
console.log('PASS ES-01 E3: '+hypotheses.records.length+' source-bound, falsifiable draft questions, with universal no-results / no-preregistration gates')
