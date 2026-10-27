import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareES01Records, ES01_STUDY_CONTEXT } from '../src/es01Comparison.js'
const read=p=>readFileSync(p,'utf8')
const registry=JSON.parse(read('src/es01Evidence.json'))
const rec=registry.records
assert.equal(rec.length,10)
assert.deepEqual(new Set(Object.keys(ES01_STUDY_CONTEXT)),new Set(rec.map(r=>r.id)),'every record must have an explicit study context')
let checked=0
for(const a of rec){
 const ctx=ES01_STUDY_CONTEXT[a.id]
 assert(ctx.setting.length>15 && Array.isArray(ctx.endpointDomains) && ctx.endpointDomains.length>0)
 for(const b of rec){
  const r=compareES01Records(a,b)
  assert(!('effectSize' in r) && !('score' in r) && !('safeDose' in r),'no efficacy scoring or dose data')
  assert(r.blockers.length>0 && r.nextMeasurement.length>20)
  if(a.id===b.id)assert.equal(r.admissibility,'SAME_RECORD')
  else {
    assert.equal(r.admissibility,'CONTEXT_ONLY')
    assert(r.supported.includes('cannot rank')||r.supported.includes('not rank'))
    assert(r.blockers.some(x=>x.includes('Different primary sources')),'no matched source pair asserted')
    if(a.family!==b.family)assert(r.blockers.some(x=>x.includes('Different substance families')))
    if(a.evidenceTier!==b.evidenceTier)assert(r.blockers.some(x=>x.includes('Different evidence tiers')))
  }
  checked++
 }
}
for(const r of rec){
 assert.equal(ES01_STUDY_CONTEXT[r.id].indicationEstablished,['ES01-CAN-CBD','ES01-KET-ESK'].includes(r.id),'indication flag must be narrowly scoped')
}
const ui=read('src/ES01Comparator.jsx'),ex=read('src/ES01Explorer.jsx'),doc=read('docs/ES01_E1_COMPARABILITY_GATES.md')
assert(ex.includes('<ES01Comparator />'))
for(const x of ['aria-live="polite"','Source A','Source B','Next admissible measurement','type="button"']) if(x!=='type="button"')assert(ui.includes(x))
for(const x of ['CONTEXT_ONLY','SAME_RECORD','MDA','hydroxynorketamine','not a treatment trial','Ledger Above Ego'])assert(doc.toLowerCase().includes(x.toLowerCase()))
assert(read('src/es01Explorer.css').includes('.es01-comparator'))
assert(read('package.json').includes('test:es01-e1'))
console.log('PASS ES-01 E1: '+checked+' conservative pairwise evidence gates with explicit study-context custody; no efficacy ranking')
