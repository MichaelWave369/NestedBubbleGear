import assert from 'node:assert/strict'
import {
  BC3_PROTOCOL,BC3_MODES,BC3_PUBLIC_ROOTS,toySign,toyVerify,
  makeBC3World,enumerateBC3Worlds,observeBC3,adjudicateBC3,analyzeBC3,buildBC3Receipt,
} from '../src/boundaryCustody.js'

const tests=[
  ['finite worlds and regimes are exactly enumerable',()=>{
    assert.equal(enumerateBC3Worlds().length,16)
    assert.equal(new Set(enumerateBC3Worlds().map(x=>JSON.stringify(x.truth))).size,16)
    assert.equal(BC3_MODES.length,9)
    assert.equal(analyzeBC3().evaluations,144)
  }],
  ['two toy root signature equations work for each defined claim',()=>{
    assert.equal(Object.keys(BC3_PUBLIC_ROOTS).length,2)
    for(const issuer of ['A','B']) for(let claim=0;claim<4;claim++){
      const sig=toySign(issuer,claim)
      assert.equal(toyVerify(issuer,claim,sig),true)
      assert.equal(toyVerify(issuer,claim^1,sig),false)
    }
  }],
  ['blind observer rejects scoring-truth leaks',()=>{
    for(const world of enumerateBC3Worlds())for(const mode of BC3_MODES){
      const view=observeBC3(world,mode)
      assert.deepEqual(Object.keys(view).sort(),['payload','records'])
      assert.equal(JSON.stringify(view).includes('"source"'),false)
      assert.equal(JSON.stringify(view).includes('"edit"'),false)
      assert.throws(()=>adjudicateBC3({...view,truth:world.truth}),TypeError)
    }
  }],
  ['no evidence and unsigned claims cannot promote a source',()=>{
    for(const world of enumerateBC3Worlds()){
      const none=adjudicateBC3(observeBC3(world,'NO_EVIDENCE'))
      assert.equal(none.status,'REFUSE_NO_EVIDENCE')
      assert.equal(none.candidates.length,4)
      const unsigned=adjudicateBC3(observeBC3(world,'UNSIGNED_CLAIM'))
      assert.equal(unsigned.status,'REFUSE_UNSIGNED')
      assert.equal(unsigned.quorum,false)
    }
  }],
  ['single authentic toy record is mathematically informative but unauthorized',()=>{
    for(const world of enumerateBC3Worlds()){
      const result=adjudicateBC3(observeBC3(world,'SIGNED_SINGLE'))
      assert.equal(result.status,'REFUSE_QUORUM')
      assert.equal(result.candidates.length,1)
      assert.equal(result.candidates[0],world.truth.source)
      assert.equal(result.admittedSource,null)
    }
  }],
  ['duplicate of one root is not a second signer',()=>{
    for(const world of enumerateBC3Worlds()){
      const result=adjudicateBC3(observeBC3(world,'DUPLICATED_SINGLE'))
      assert.equal(result.status,'REFUSE_QUORUM')
      assert.equal(result.duplicatesCollapsed,1)
      assert.equal(result.acceptedRoots,1)
      assert.equal(result.quorum,false)
    }
  }],
  ['tampering a signed claim without resigning must fail',()=>{
    for(const world of enumerateBC3Worlds()){
      const result=adjudicateBC3(observeBC3(world,'TAMPERED_SINGLE'))
      assert.equal(result.status,'REFUSE_INVALID_SIGNATURE')
    }
  }],
  ['two distinct matching honest signer identities permit correct source',()=>{
    for(const world of enumerateBC3Worlds()){
      const result=adjudicateBC3(observeBC3(world,'DUAL_HONEST'))
      assert.equal(result.status,'ACCEPT_TOY_QUORUM')
      assert.equal(result.acceptedRoots,2)
      assert.equal(result.admittedSource,world.truth.source)
    }
  }],
  ['conflicting correctly signed records trigger explicit refusal',()=>{
    for(const world of enumerateBC3Worlds()){
      const result=adjudicateBC3(observeBC3(world,'DUAL_CONFLICT'))
      assert.equal(result.status,'REFUSE_CONFLICT')
      assert.equal(result.admittedSource,null)
      assert.deepEqual(result.candidates,[])
    }
  }],
  ['two coordinated false records can be validly signed and falsely accepted',()=>{
    for(const world of enumerateBC3Worlds()){
      const observation=observeBC3(world,'DUAL_COORDINATED_FALSE')
      assert.ok(observation.records.every(x=>toyVerify(x.issuer,x.claim,x.signature)))
      const result=adjudicateBC3(observation)
      assert.equal(result.status,'ACCEPT_TOY_QUORUM')
      assert.notEqual(result.admittedSource,world.truth.source)
    }
  }],
  ['unknown signer and malformed records fail closed',()=>{
    for(const world of enumerateBC3Worlds()){
      assert.equal(adjudicateBC3(observeBC3(world,'UNKNOWN_ISSUER')).status,'REFUSE_UNKNOWN_ISSUER')
    }
    assert.throws(()=>adjudicateBC3({payload:1,records:[],truth:1}),TypeError)
    assert.throws(()=>adjudicateBC3({payload:1,records:[{issuer:'A',claim:1,signature:1,secret:true}]}),TypeError)
    assert.throws(()=>adjudicateBC3({payload:5,records:[]}),RangeError)
    assert.throws(()=>toySign('C',0),RangeError)
    assert.equal(toyVerify('A',0,-1),false)
  }],
  ['frozen matrix explicitly counts false acceptance instead of hiding it',()=>{
    const by=Object.fromEntries(analyzeBC3().rows.map(r=>[r.mode,r]))
    assert.equal(by.DUAL_HONEST.accepted,16)
    assert.equal(by.DUAL_HONEST.correct,16)
    assert.equal(by.DUAL_HONEST.falseAccepted,0)
    assert.equal(by.DUAL_COORDINATED_FALSE.accepted,16)
    assert.equal(by.DUAL_COORDINATED_FALSE.correct,0)
    assert.equal(by.DUAL_COORDINATED_FALSE.falseAccepted,16)
    for(const mode of BC3_MODES.filter(x=>!['DUAL_HONEST','DUAL_COORDINATED_FALSE'].includes(x))) {
      assert.equal(by[mode].accepted,0,mode)
      assert.equal(by[mode].refused,16,mode)
    }
    assert.equal(by.DUPLICATED_SINGLE.duplicateCollapsed,true)
  }],
  ['deterministic receipt and claim firewall',()=>{
    assert.equal(BC3_PROTOCOL.origin,'SIMULATED')
    assert.equal(BC3_PROTOCOL.authority,'NONE')
    assert.equal(BC3_PROTOCOL.motivationDOI,'10.1126/science.aeh3441')
    assert.deepEqual(buildBC3Receipt(),buildBC3Receipt())
    const r=buildBC3Receipt({source:0,edit:0,mode:'DUAL_COORDINATED_FALSE'})
    assert.equal(r.selected.correctWhenAccepted,false)
    assert.equal(r.selected.observation.truth,undefined)
    assert.equal(r.origin,'SIMULATED')
    assert.equal(r.authority,'NONE')
  }],
]
let pass=0
for (const [label,run] of tests){run();pass++;console.log('PASS '+label)}
console.log('NBG-BC3 '+pass+'/'+tests.length+' PASS · custody does not imply truth')
