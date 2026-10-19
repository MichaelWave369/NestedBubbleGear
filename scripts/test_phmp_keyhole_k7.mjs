import assert from 'node:assert/strict';
import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// PHMP Keyhole K7 E1: TEST-ONLY deterministic Ed25519 fixtures.
// Never reuse public deterministic fixture keys to protect live systems.
// Source signatures establish key possession, NOT semantic truth.
const SESSION='PHMP-K7-E1-FIXTURE';
const T=13,DELAY=Object.freeze({alpha:2,beta:1});
const KEY_POLICY=Object.freeze({
  'alpha-v1':{source:'alpha',from:0,to:5},
  'alpha-v2':{source:'alpha',from:5,to:T},
  'beta-v1':{source:'beta',from:0,to:T}
});
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const keyIds=[...Object.keys(KEY_POLICY),'rogue'];
const keys=Object.fromEntries(keyIds.map(id=>{
  const seed=createHash('sha256').update('TEST-ONLY-K7-ED25519:'+id).digest();
  const pkcs8=Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),seed]);
  const privateKey=createPrivateKey({key:pkcs8,format:'der',type:'pkcs8'});
  const publicKey=createPublicKey(privateKey);
  return [id,{privateKey,publicKey}];
}));
const REGISTRY=Object.freeze(Object.fromEntries(Object.entries(KEY_POLICY).map(([id,rule])=>[
  id,Object.freeze({...rule,publicKey:keys[id].publicKey,
    fingerprint:sha(keys[id].publicKey.export({type:'spki',format:'der'}).toString('base64'))})
])));
const PAYLOAD_KEYS=['schema','session','seq','source','key_id','issued_at','due_at','kind','known_reference','reading','prev_hash'];
const equalFields=(a,b)=>JSON.stringify(Object.keys(a).sort())===JSON.stringify([...b].sort());
const clone=x=>JSON.parse(JSON.stringify(x));
function makeReceipt(ledger,source,keyId,t,kind,reading){
  const rule=KEY_POLICY[keyId];
  assert.ok(rule&&rule.source===source,'fixture issuer requires a matching source');
  assert.ok(Number.isInteger(t)&&t>=rule.from&&t<rule.to);
  assert.ok(['target','calibration'].includes(kind)&&[0,1].includes(reading));
  const payload={
    schema:'K7-v1',session:SESSION,seq:ledger.length,source,key_id:keyId,
    issued_at:t,due_at:t+DELAY[source],kind,
    known_reference:kind==='calibration'?1:null,reading,
    prev_hash:ledger.length?ledger[ledger.length-1].hash:'K7-GENESIS'
  };
  assert.ok(payload.due_at<=T);
  const signature=sign(null,Buffer.from(JSON.stringify(payload)),keys[keyId].privateKey).toString('base64');
  const record=Object.freeze({payload:Object.freeze(payload),signature,hash:sha(JSON.stringify(payload)+'\n'+signature)});
  ledger.push(record);
  return record;
}
function verifyIndependent(entry,arrivalTick){
  if(!entry||!entry.payload||typeof entry.signature!=='string'||typeof entry.hash!=='string')
    throw Error('missing signed receipt');
  const p=entry.payload;
  if(!equalFields(p,PAYLOAD_KEYS)||p.schema!=='K7-v1'||p.session!==SESSION||
    !Number.isSafeInteger(p.seq)||p.seq<0||
    !Number.isSafeInteger(p.issued_at)||p.issued_at<0||
    !['alpha','beta'].includes(p.source)||!['target','calibration'].includes(p.kind)||
    ![0,1].includes(p.reading)||p.known_reference!==(p.kind==='calibration'?1:null)||
    p.due_at!==p.issued_at+DELAY[p.source]||
    p.due_at> T ||p.due_at!==arrivalTick)throw Error('invalid schema, clock, or calibration label');
  const trusted=REGISTRY[p.key_id];
  if(!trusted||trusted.source!==p.source||
    p.issued_at<trusted.from||p.issued_at>=trusted.to)
    throw Error('unknown, cross-source, or revoked signing key');
  const canonical=Buffer.from(JSON.stringify(p));
  const signature=Buffer.from(entry.signature,'base64');
  if(signature.length!==64||
    !verify(null,canonical,trusted.publicKey,signature))
    throw Error('invalid Ed25519 signature');
  if(entry.hash!==sha(JSON.stringify(p)+'\n'+entry.signature))
    throw Error('receipt content/signature digest mismatch');
}
function verifyTimeline(receipts,anchor=null){
  const pending=new Map(),arrived=new Set(),accepted=[];
  let maxBuffered=0;
  // Delivery time is externally supplied; receipt time alone is not trusted.
  const arrivals=receipts.map(r=>({receipt:r,at:r.payload.due_at}))
    .sort((a,b)=>a.at-b.at||b.receipt.payload.seq-a.receipt.payload.seq);
  let next=0,last='K7-GENESIS';
  for(const {receipt,at} of arrivals){
    verifyIndependent(receipt,at);
    const seq=receipt.payload.seq;
    if(arrived.has(seq))throw Error('replayed sequence number');
    arrived.add(seq);
    pending.set(seq,receipt);
    maxBuffered=Math.max(maxBuffered,pending.size);
    while(pending.has(next)){
      const entry=pending.get(next),p=entry.payload;
      if(p.prev_hash!==last)throw Error('signed chain predecessor mismatch');
      if(anchor&&next===anchor.seq&&entry.hash!==anchor.hash)
        throw Error('independently pinned checkpoint mismatch');
      accepted.push(entry);
      pending.delete(next);
      last=entry.hash;next++;
    }
  }
  if(pending.size||accepted.length!==receipts.length||
    accepted.some((r,i)=>r.payload.seq!==i))
    throw Error('missing or noncontiguous issuance evidence');
  if(anchor&&(accepted.length<=anchor.seq||accepted[anchor.seq].hash!==anchor.hash))
    throw Error('missing independent checkpoint');
  return {accepted,maxBuffered,headHash:last};
}
const ledger=[];
const events=[
 ['alpha','alpha-v1',0,'calibration',1],
 ['beta','beta-v1',1,'calibration',1],
 ['alpha','alpha-v1',2,'target',1],
 ['beta','beta-v1',2,'target',1],
 ['alpha','alpha-v1',4,'calibration',1],
 ['alpha','alpha-v2',5,'calibration',0], // Authentic signer; WRONG known-reference bit
 ['beta','beta-v1',6,'calibration',1],
 ['alpha','alpha-v2',7,'target',0], // Signed but false target reading
 ['beta','beta-v1',7,'target',1],
 ['alpha','alpha-v2',8,'target',0],
 ['beta','beta-v1',8,'target',1],
 ['alpha','alpha-v2',9,'calibration',0],
 ['beta','beta-v1',9,'calibration',1],
 ['alpha','alpha-v2',10,'target',0],
 ['beta','beta-v1',10,'target',1]
];
for(const args of events)makeReceipt(ledger,...args);
const anchor=Object.freeze({session:SESSION,seq:4,hash:ledger[4].hash});
const baseline=verifyTimeline(ledger,anchor);
assert.equal(baseline.accepted.length,15);
assert.ok(baseline.maxBuffered>=2,'out-of-order delivery must be buffered');
assert.equal(baseline.accepted[5].payload.key_id,'alpha-v2');
assert.equal(baseline.accepted[5].payload.reading,0,'authentic but false calibration');
assert.ok(verify(null,Buffer.from(JSON.stringify(ledger[5].payload)),
  REGISTRY['alpha-v2'].publicKey,Buffer.from(ledger[5].signature,'base64')));

// An independently pinned public key is enough to detect forged unsigned data;
// it does NOT prove content is accurate when the legitimate signer is dishonest.
const attacks={};
const reject=(name,fn)=>{
  assert.throws(fn,name+' must reject');
  attacks[name]='REJECTED';
};
const substitute=(i,payloadPatch,signature=ledger[i].signature)=>{
  const copy=ledger.slice();
  const p={...copy[i].payload,...payloadPatch};
  copy[i]={payload:p,signature,hash:sha(JSON.stringify(p)+'\n'+signature)};
  return copy;
};
reject('modified signed reading',()=>verifyTimeline(substitute(7,{reading:1}),anchor));
reject('modified issuance clock',()=>verifyTimeline(substitute(7,{issued_at:8}),anchor));
reject('modified calibrated reference',()=>verifyTimeline(substitute(5,{known_reference:0}),anchor));
reject('modified source',()=>verifyTimeline(substitute(7,{source:'beta'}),anchor));
reject('modified source key',()=>verifyTimeline(substitute(7,{key_id:'beta-v1'}),anchor));
reject('duplicate delivery',()=>verifyTimeline([...ledger,ledger[7]],anchor));
reject('deleted intermediate signed receipt',()=>verifyTimeline(ledger.filter((_,i)=>i!==7),anchor));
reject('truncated history before anchor',()=>verifyTimeline(ledger.slice(5),anchor));
// Arrival order can be shuffled freely: the verifier reconstructs the signed
// issuance order using the sequence and predecessor hashes.
assert.equal(verifyTimeline([ledger[1],ledger[0],...ledger.slice(2)],anchor).accepted.length,15);
reject('renumbered signed sequence',()=>verifyTimeline(substitute(1,{seq:0}),anchor));
const oldKey=makeReceipt([], 'alpha','alpha-v1',4,'target',1);
const revoked={...oldKey,payload:{...oldKey.payload,seq:15,issued_at:6,due_at:8,
  prev_hash:ledger[14].hash}};
revoked.signature=sign(null,Buffer.from(JSON.stringify(revoked.payload)),keys['alpha-v1'].privateKey).toString('base64');
revoked.hash=sha(JSON.stringify(revoked.payload)+'\n'+revoked.signature);
reject('retired key after rotation',()=>verifyTimeline([...ledger,revoked],anchor));
const roguePayload={...ledger[7].payload,key_id:'rogue'};
const rogueSig=sign(null,Buffer.from(JSON.stringify(roguePayload)),keys.rogue.privateKey).toString('base64');
const rogueReceipt={payload:roguePayload,signature:rogueSig,hash:sha(JSON.stringify(roguePayload)+'\n'+rogueSig)};
reject('rogue untrusted valid Ed25519 signer',()=>verifyTimeline([...ledger.slice(0,7),rogueReceipt,...ledger.slice(8)],anchor));
// With test-only signer keys, a privileged attacker can rewrite and re-sign
// all later records. Public-key verification alone then accepts the rewrite.
// Independently pinned checkpoint binds prior ledger history.
const resigned=[];
for(let i=0;i<ledger.length;i++){
  const old=ledger[i].payload;
  const modified={...old,reading:i===4?0:old.reading,prev_hash:i?resigned[i-1].hash:'K7-GENESIS'};
  const sig=sign(null,Buffer.from(JSON.stringify(modified)),keys[modified.key_id].privateKey).toString('base64');
  resigned.push({payload:modified,signature:sig,hash:sha(JSON.stringify(modified)+'\n'+sig)});
}
assert.equal(verifyTimeline(resigned).accepted.length,15,'all-signers compromised can rewrite unsigned anchor history');
reject('validly re-signed rewritten history with pinned anchor',()=>verifyTimeline(resigned,anchor));
attacks['authorized signer publishes false known calibration']='CRYPTOGRAPHICALLY_VALID_CONTENT_FALSE';
attacks['authorized signer publishes false target']='CRYPTOGRAPHICALLY_VALID_CONTENT_FALSE';

// Governance comparison: authentication != trustworthiness of claims.
// The known-reference classical rule quarantines a signing key once it
// fails a public calibration. NBG-typed policy deliberately uses the exact
// same conventional rule: they MUST tie, and neither gets private truth.
function govern(accepted,policy){
  const quarantine=new Set(),targets=[],alerts=[];
  for(const {payload:p} of accepted){
    if(policy!=='signature-only'&&p.kind==='calibration'&&p.reading!==p.known_reference){
      if(!quarantine.has(p.key_id))alerts.push({at:p.seq,key_id:p.key_id,reason:'known-reference-failed'});
      quarantine.add(p.key_id);
    }
    if(p.kind==='target'){
      if(policy==='signature-only'||!quarantine.has(p.key_id))
        targets.push({seq:p.seq,key_id:p.key_id,reading:p.reading});
    }
  }
  return {acceptedTargets:targets,alerts,quarantine:[...quarantine]};
}
const signedOnly=govern(baseline.accepted,'signature-only');
const classical=govern(baseline.accepted,'classical-known-reference');
const typed=govern(baseline.accepted,'nbg-typed-provenance');
assert.deepEqual(typed,classical,'NBG wrapper must match conventional authenticated calibration gating');
assert.equal(signedOnly.acceptedTargets.length,8);
assert.equal(signedOnly.acceptedTargets.filter(t=>t.reading===1).length,5);
assert.equal(classical.acceptedTargets.length,5);
assert.ok(classical.acceptedTargets.every(t=>t.reading===1));
assert.deepEqual(classical.quarantine,['alpha-v2'],'historical alpha-v1 evidence not retroactively erased');
assert.equal(classical.alerts[0].at,5);
assert.ok(classical.acceptedTargets.some(t=>t.key_id==='alpha-v1'));
assert.ok(classical.acceptedTargets.some(t=>t.key_id==='beta-v1'));
const result={
  experiment:'PHMP K7 E1 Authenticated Evidence & Adversarial Recovery',
  version:'0.1.0',origin:'SIMULATED',authority:'NONE',
  signatures:'Ed25519 with pinned public keys; deterministic publicly derivable test-only secrets',
  key_policy:Object.fromEntries(Object.entries(REGISTRY).map(([id,v])=>[id,{
    source:v.source,from:v.from,to:v.to,fingerprint_sha256:v.fingerprint}])),
  scenario:{receipts:ledger.length,delivered:baseline.accepted.length,
    buffered_max:baseline.maxBuffered,checkpoint_seq:anchor.seq,checkpoint_hash:anchor.hash,
    head_sha256:baseline.headHash},
  attack_controls:attacks, signed_only_targets:signedOnly.acceptedTargets,
  classical_governance:classical,nbg_governance:typed,
  verdict:'SIGNED PROVENANCE DOES NOT GUARANTEE TRUTH; NBG TIES CONVENTIONAL KNOWN-REFERENCE RULE',
  nonclaims:'test-only disclosed deterministic keys; no production PKI, certificate chain, trusted timestamp, live external anchoring, physical sensor, new quantum physics or NBG accuracy advantage',
  reserved_sets:'K1 through K6, PHMP-3 E2 and any future K7 reserved cohorts NOT generated or scored'
};
const resultHash=sha(result);
if(process.argv.length>2){
  assert.equal(process.argv[2],'--out');assert.equal(process.argv.length,4);
  writeFileSync(process.argv[3],JSON.stringify({receipt:result,sha256:resultHash},null,2)+'\n',{flag:'wx'});
}
console.log('K7 E1 PASS: '+ledger.length+' real Ed25519 fixture signatures, '+Object.keys(attacks).length+' adversarial controls; max buffered='+baseline.maxBuffered);
console.log('GOVERNANCE: signature-only 5/8 correct synthetic targets; classical and NBG typed 5/5 accepted correct with 5/8 coverage.');
console.log('No production authentication or PHMP-3/K1-K6 reserved evaluation.');
console.log('receipt_sha256 '+resultHash);
