/**
 * PHMP-SM1 E1B: explicit operator-run Ollama embedding exporter.
 * - Node 20+ built-ins only, no packages, downloads, background tasks, or auto-pulls.
 * - Only 127.0.0.1:11434 (fixed literal loopback); no configurable remote URL.
 * - Local-only model inventory preflight, exact name and digest pin required.
 * - Validates output as E1A corpus and writes it only with exclusive create.
 * This is a trusted-local-machine experiment, not a remote service.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateCorpus } from './phmp_semantic_memory_e1a.mjs';

const BASE = 'http://127.0.0.1:11434';
const TEMPLATE_SCHEMA = 'PHMP-SM1-E1B-TEMPLATE';
const MAX_INPUT_BYTES = 256 * 1024;
const MAX_RECORDS = 80;
const MAX_QUERIES = 40;
const MAX_BATCH = 8;
const EMBED_TIMEOUT_MS = 90_000;
const MODEL_NAME = /^[a-zA-Z0-9_.:/-]{1,128}$/;
const DIGEST = /^(?:sha256:)?[0-9a-f]{64}$/i;
const ORIGINS = new Set(['OBSERVED','VERIFIED','INFERRED','DREAMED','SIMULATED','UNKNOWN']);
const FAMILIES = new Set(['negation','time','paraphrase','scope','abstention','other']);
function insist(test,message) { if (!test) throw new Error(message); }
function str(x,max=300) { return typeof x==='string' && x.length>0 && x.length<=max; }
function digestOf(buf) { return 'sha256:'+createHash('sha256').update(buf).digest('hex'); }
function digestNorm(s) { insist(typeof s==='string' && DIGEST.test(s),'require exact SHA-256 model digest (sha256:64hex)'); return 'sha256:'+s.replace(/^sha256:/i,'').toLowerCase(); }
function exactKeys(o,keys) { insist(o && typeof o==='object' && !Array.isArray(o),'expected object'); insist(JSON.stringify(Object.keys(o).sort())===JSON.stringify([...keys].sort()),'unexpected or missing field in template'); }
function claimOk(c) {
  exactKeys(c,['subject','predicate','object','polarity']);
  for(const k of ['subject','predicate','object'])insist(str(c[k]),'invalid claim '+k);
  insist(c.polarity===1 || c.polarity===-1,'invalid claim polarity');
}
function iso(s) { return str(s) && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s; }
export function validateTemplate(t) {
  exactKeys(t,['schema','split','records','queries']);
  insist(t.schema===TEMPLATE_SCHEMA && t.split==='DEVELOPMENT','only development template accepted');
  insist(Array.isArray(t.records) && t.records.length>=1 && t.records.length<=MAX_RECORDS,'invalid record count');
  insist(Array.isArray(t.queries) && t.queries.length>=1 && t.queries.length<=MAX_QUERIES,'invalid query count');
  const ids=new Map();
  for (const r of t.records) {
    exactKeys(r,['id','text','scope','sourceId','origin','authority','validFrom','validTo','claim']);
    insist(str(r.id) && str(r.text,1200) && str(r.scope) && str(r.sourceId),'invalid record');
    insist(ORIGINS.has(r.origin) && r.authority==='NONE','invalid declared provenance/authority');
    insist(iso(r.validFrom) && (r.validTo===null || iso(r.validTo)) && (r.validTo===null || r.validFrom<r.validTo),'invalid interval');
    claimOk(r.claim);
    insist(!ids.has(r.id),'duplicate record ID');
    ids.set(r.id,r);
  }
  const queryIds=new Set();
  for (const q of t.queries) {
    exactKeys(q,['id','text','scope','asOf','family','claim','expectedIds']);
    insist(str(q.id) && str(q.text,1200) && str(q.scope) && iso(q.asOf),'invalid query');
    insist(!queryIds.has(q.id),'duplicate query ID');queryIds.add(q.id);
    insist(FAMILIES.has(q.family),'invalid query family');
    claimOk(q.claim);
    insist(Array.isArray(q.expectedIds) && new Set(q.expectedIds).size===q.expectedIds.length,'invalid labels');
    for(const id of q.expectedIds) {
      const r=ids.get(id);
      insist(r && r.scope===q.scope && ['OBSERVED','VERIFIED'].includes(r.origin) &&
        r.validFrom<=q.asOf && (r.validTo===null || q.asOf<r.validTo) &&
        r.claim.polarity===q.claim.polarity,'invalid/ineligible expected record ID');
    }
  }
  return t;
}
export function loadTemplate(path) {
  const buf=readFileSync(path);
  insist(buf.length<=MAX_INPUT_BYTES,'template larger than 256 KiB');
  return {template:validateTemplate(JSON.parse(buf.toString('utf8'))), inputSha256:digestOf(buf)};
}
function localModel(model) {
  insist(str(model,128) && MODEL_NAME.test(model),'invalid Ollama model name');
  insist(!/(?:[:/-]cloud|cloud[-:]?ref)$/i.test(model),'cloud reference disallowed');
  return model;
}
async function jsonLocal(path, {method='GET',body,transport=fetch}={}) {
  insist(path==='/api/tags'||path==='/api/embed','unknown local Ollama endpoint');
  const init={method,headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(EMBED_TIMEOUT_MS)};
  if(body!==undefined)init.body=JSON.stringify(body);
  const response=await transport(BASE+path,init);
  insist(response && typeof response.ok==='boolean','invalid local Ollama response');
  insist(response.ok,'Ollama local endpoint returned HTTP '+response.status);
  const data=await response.json();
  insist(data && typeof data==='object','invalid Ollama JSON');
  return data;
}
export async function inspectLocal({transport=fetch}={}) {
  const response=await jsonLocal('/api/tags',{transport});
  insist(Array.isArray(response.models),'Ollama tags missing models');
  return response.models.filter(m=>
    m && str(m.name,128) && MODEL_NAME.test(m.name) && !/(?:[:/-]cloud|cloud[-:]?ref)$/i.test(m.name) &&
    typeof m.digest==='string' && DIGEST.test(m.digest) &&
    Number.isSafeInteger(m.size) && m.size>0
  ).map(m=>({name:m.name,digest:digestNorm(m.digest),sizeBytes:m.size}))
    .sort((a,b)=>a.name.localeCompare(b.name));
}
export async function preflight({model,modelDigest,transport=fetch}) {
  localModel(model);const digest=digestNorm(modelDigest);
  const models=await inspectLocal({transport});
  const exact=models.find(m=>m.name===model);
  insist(exact,'model not found with reported local size; cloud/missing models refused');
  insist(exact.digest===digest,'model digest mismatch: STOP and inspect inventory');
  return exact;
}
export async function produceCorpus(template,{model,modelDigest,inputSha256,transport=fetch}={}) {
  validateTemplate(template);
  insist(typeof inputSha256==='string' && DIGEST.test(inputSha256),'template SHA-256 required');
  const m=await preflight({model,modelDigest,transport});
  const texts=[...template.records.map(x=>x.text),...template.queries.map(x=>x.text)];
  const all=[];
  let dimension=null;
  for(let i=0;i<texts.length;i+=MAX_BATCH) {
    const part=texts.slice(i,i+MAX_BATCH);
    const response=await jsonLocal('/api/embed',{method:'POST',body:{model:m.name,input:part,truncate:false},transport});
    insist(Array.isArray(response.embeddings) && response.embeddings.length===part.length,'Ollama embeddings count mismatch');
    for(const vec of response.embeddings) {
      insist(Array.isArray(vec) && vec.length>=2 && vec.length<=2048,'invalid Ollama embedding dimension');
      insist(vec.every(x=>typeof x==='number'&&Number.isFinite(x))&&vec.some(x=>x!==0),'nonfinite/zero Ollama embedding');
      if(dimension===null)dimension=vec.length;
      insist(vec.length===dimension,'mixed embedding dimensions');
      all.push(vec);
    }
  }
  // Detect alias replacement during a batch export (still operator-reported, not independently attested).
  await preflight({model,modelDigest,transport});
  const corpus={
    schema:'PHMP-SM1-E1A-CORPUS',
    embeddingSource:{
      kind:'OPERATOR_SUPPLIED_LOCAL',model:m.name,modelDigest:m.digest,
      modelSizeBytes:m.sizeBytes,templateSha256:digestNorm(inputSha256),
      exporter:'PHMP-SM1-E1B',split:'DEVELOPMENT',
      note:'Reported local Ollama identity at export time; not an attestation of hardware or independently verified model execution.'
    },
    dimension,
    records:template.records.map((r,i)=>({...r,vector:all[i]})),
    queries:template.queries.map((q,i)=>({...q,vector:all[i+template.records.length]}))
  };
  validateCorpus(corpus);
  return corpus;
}
function usage() { return 'Usage: node scripts/phmp_semantic_memory_e1b.mjs --inspect | --preflight --model NAME:TAG --digest sha256:HEX | --execute --model NAME:TAG --digest sha256:HEX --input TEMPLATE.json --out NEW_CORPUS.json'; }
function flags(args) {
  const command=args[0];
  insist(['--inspect','--preflight','--execute'].includes(command),'invalid command. '+usage());
  const opts={command};
  if(command==='--inspect') { insist(args.length===1,usage());return opts; }
  insist(args.length%2===1,usage());
  for(let i=1;i<args.length;i+=2) {
    insist(['--model','--digest','--input','--out'].includes(args[i]),usage());
    insist(!(args[i] in opts),'duplicate flag');
    opts[args[i]]=args[i+1];
  }
  const needed=command==='--preflight'?['--model','--digest']:['--model','--digest','--input','--out'];
  insist(Object.keys(opts).length===needed.length+1 && needed.every(x=>str(opts[x],1024)),usage());
  return opts;
}
export async function main(args=process.argv.slice(2)) {
  const o=flags(args);
  if(o.command==='--inspect') {
    console.log(JSON.stringify({origin:'LOCAL_OPERATOR_REPORTED',models:await inspectLocal()},null,2));
    return;
  }
  const p=await preflight({model:o['--model'],modelDigest:o['--digest']});
  if(o.command==='--preflight') {
    console.log(JSON.stringify({result:'PREFLIGHT_ONLY',model:p,embeddingCalls:0},null,2)); return;
  }
  const {template,inputSha256}=loadTemplate(o['--input']);
  const corpus=await produceCorpus(template,{model:p.name,modelDigest:p.digest,inputSha256});
  writeFileSync(o['--out'],JSON.stringify(corpus,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({result:'OPERATOR_EXPORTED_LOCAL',outputFile:o['--out'],
    model:p.name,modelDigest:p.digest,dimensions:corpus.dimension,records:corpus.records.length,
    queries:corpus.queries.length,corpusSha256:digestOf(JSON.stringify(corpus))},null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(err=>{console.error('PHMP-SM1 E1B REFUSED: '+err.message);process.exitCode=1;});
}
