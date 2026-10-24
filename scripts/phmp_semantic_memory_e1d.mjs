/**
 * PHMP-SM1 E1D: one explicit operator action for a LOCAL public-fixture trial.
 * Uses E1B's hard-coded 127.0.0.1 Ollama transport, then E1A/E1C unchanged
 * scoring. Never runs against a private corpus or reserved evaluation split.
 * No Ollama request on import or inside CI tests (injected mocks only).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { inspectLocal, produceCorpus, loadTemplate } from './phmp_semantic_memory_e1b.mjs';
import { evaluate as evaluateE1A, readCorpus, validateCorpus, verifyReport } from './phmp_semantic_memory_e1a.mjs';
import { evaluatePilot as evaluateE1C, verifyPilotReceipt } from './phmp_semantic_memory_e1c.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const TEMPLATE = fileURLToPath(new URL('../experiments/PHMP1/fixtures/phmp_sm1_e1b_dev_template.json', import.meta.url));
const SPLIT = fileURLToPath(new URL('../experiments/PHMP1/fixtures/phmp_sm1_e1c_development_split.json', import.meta.url));
const ARTIFACT_DIR = resolve(ROOT,'artifacts/local');
const SHA_256 = /^(?:sha256:)?[a-fA-F0-9]{64}$/;
const MODEL = /^[a-zA-Z0-9_.:/-]{1,128}$/;
function need(ok,reason){if(!ok)throw Error(reason);}
function sha(v){return createHash('sha256').update(JSON.stringify(v)).digest('hex');}
function pathSha(bytes){return 'sha256:'+createHash('sha256').update(bytes).digest('hex');}
function normalizedDigest(digest){return 'sha256:'+digest.replace(/^sha256:/i,'').toLowerCase();}
function noVector(r){const {vector,...rest}=r;return rest;}
export function readPublicInputs(){
 const {template,inputSha256}=loadTemplate(TEMPLATE);
 const bytes=readFileSync(SPLIT);
 need(bytes.length<=64*1024,'public split too large');
 const split=JSON.parse(bytes.toString('utf8'));
 need(split && split.purpose==='DEVELOPMENT_ONLY','split must be development only');
 return {template,split,templateSha256:inputSha256,splitSha256:pathSha(bytes)};
}
export function assertPublicCorpus(c,input=readPublicInputs()){
 validateCorpus(c);
 need(c.embeddingSource.kind==='OPERATOR_SUPPLIED_LOCAL'&&c.embeddingSource.exporter==='PHMP-SM1-E1B'&&
    c.embeddingSource.split==='DEVELOPMENT','E1D accepts local E1B-development corpus only');
 need(c.embeddingSource.templateSha256===input.templateSha256,'corpus uses a different public template');
 need(SHA_256.test(c.embeddingSource.modelDigest),'missing pinned local model digest');
 need(c.records.length===input.template.records.length&&c.queries.length===input.template.queries.length,
  'public fixture row counts differ');
 need(JSON.stringify(c.records.map(noVector))===JSON.stringify(input.template.records),
  'record text, labels or source metadata differ from public fixture');
 need(JSON.stringify(c.queries.map(noVector))===JSON.stringify(input.template.queries),
  'query text or labels differ from public fixture');
 return c;
}
function answeredCorrect(decision, expectedIds){
 if(!expectedIds.length)return decision.admittedId===null;
 return expectedIds.includes(decision.admittedId);
}
function quantile(sorted,p){
 const position=(sorted.length-1)*p;
 const lower=Math.floor(position),upper=Math.ceil(position),fraction=position-lower;
 return Number((sorted[lower]*(1-fraction)+sorted[upper]*fraction).toFixed(6));
}
/**
 * Exact nonparametric cluster bootstrap for a SMALL validation group.
 * Each validation subject is a cluster; all repetitions on one subject move
 * together. Exponent n^n is capped at 6^6 = 46,656 enumerated resamples.
 * These intervals describe stability on development labels, not a valid
 * external generalization guarantee or hypothesis test.
 */
export function pairedSubjectBootstrap(groups, left, right) {
 need(Array.isArray(groups)&&groups.length>=2&&groups.length<=6,'subject groups must be 2..6');
 need(groups.every(g=>g&&typeof g.subject==='string'&&g.subject&&Array.isArray(g.rows)&&g.rows.length>0),
   'invalid subject group');
 const unique=new Set(groups.map(g=>g.subject));need(unique.size===groups.length,'duplicate subject group');
 const delta=groups.map(g=>{
   let n=0,a=0,b=0;
   for(const row of g.rows){
     need(typeof row[left]==='boolean'&&typeof row[right]==='boolean','missing paired outcomes');
     n++;a+=Number(row[left]);b+=Number(row[right]);
   }
   return {n,a,b};
 });
 const n=groups.length, observed=delta.reduce((z,x)=>z+x.a-x.b,0)/
   delta.reduce((z,x)=>z+x.n,0);
 const values=[],total=n**n;
 for(let code=0;code<total;code++){
   let rem=code,sum=0,denom=0;
   for(let i=0;i<n;i++){
     const g=delta[rem%n];rem=Math.floor(rem/n);
     sum+=g.a-g.b;denom+=g.n;
   }
   values.push(sum/denom);
 }
 values.sort((a,b)=>a-b);
 return {validationSubjectGroups:n,validationQueries:delta.reduce((z,g)=>z+g.n,0),
   observedDelta:Number(observed.toFixed(6)),
   percentileInterval95:[quantile(values,0.025),quantile(values,0.975)],
   exhaustiveBootstrapSamples:values.length,
   status:'EXPLORATORY_DEVELOPMENT_ONLY_NO_INDEPENDENT_CI'};
}
export function summarizePairs(c,split,report){
 const validationIds=new Set(split.validationQueryIds);
 const queries=c.queries.filter(q=>validationIds.has(q.id));
 const byMode=Object.fromEntries(Object.entries(report.modes).map(([mode,data])=>
   [mode,new Map(data.validationDecisions.map(d=>[d.queryId,d]))]));
 const subjects=new Map();
 for(const q of queries){
   if(!subjects.has(q.claim.subject))subjects.set(q.claim.subject,[]);
   const row={queryId:q.id};
   for(const mode of Object.keys(byMode)){
     const d=byMode[mode].get(q.id);need(d,'missing validation decision');
     row[mode]=answeredCorrect(d,q.expectedIds);
   }
   subjects.get(q.claim.subject).push(row);
 }
 const groups=[...subjects].map(([subject,rows])=>({subject,rows}));
 const result={};
 for(const mode of ['metadata_filter','exact_claim_filter','signed_real']){
   const stats=pairedSubjectBootstrap(groups,'complex_phase',mode);
   let phaseOnly=0,baselineOnly=0,bothCorrect=0,bothWrong=0;
   for(const {rows} of groups)for(const row of rows){
     if(row.complex_phase&&row[mode])bothCorrect++;
     else if(row.complex_phase)phaseOnly++;
     else if(row[mode])baselineOnly++;
     else bothWrong++;
   }
   result['phase_minus_'+mode]={...stats,pairedCounts:{bothCorrect,phaseOnly,baselineOnly,bothWrong}};
 }
 need(result.phase_minus_signed_real.observedDelta===0,'signed-real/phase parity violated');
 need(result.phase_minus_signed_real.pairedCounts.phaseOnly===0 &&
   result.phase_minus_signed_real.pairedCounts.baselineOnly===0,'signed-real/phase decisions diverged');
 return result;
}
export function buildBundle(c,{timing=null,runMode='REPLAY_EXISTING_CORPUS',inputs=readPublicInputs()}={}){
 assertPublicCorpus(c,inputs);
 const e1a=evaluateE1A(c), e1c=evaluateE1C(c,inputs.split);
 need(verifyReport(e1a)&&verifyPilotReceipt(e1c),'input evaluations failed integrity verification');
 const pairs=summarizePairs(c,inputs.split,e1c);
 const metadata={
   source:'OPERATOR_REPORTED_LOCAL',
   model:c.embeddingSource.model,modelDigest:c.embeddingSource.modelDigest,
   templateSha256:inputs.templateSha256,splitSha256:inputs.splitSha256,
   corpusSha256:e1a.corpusSha256,
   embeddingDimensions:c.dimension,recordCount:c.records.length,queryCount:c.queries.length
 };
 const body={
   schema:'PHMP-SM1-E1D-PUBLIC-DEVELOPMENT-BUNDLE',origin:'SIMULATED',
   authority:'NONE',evaluation:'PUBLIC_DEVELOPMENT_ONLY_NOT_INDEPENDENT_HELD_OUT',
   execution:runMode,metadata,timing:timing??{status:'NOT_MEASURED_IN_OFFLINE_REPLAY'},
   retrieval:e1a,admission:e1c,pairedSubjectComparisons:pairs,
   privacy:'No raw vectors, record text or query text included; output still contains public fixture record IDs and source metadata.',
   conclusion:'No asserted superiority; binary phase and signed-real tie by construction. Tiny public development labels cannot establish performance on real memories or new physics.'
 };
 return {...body,receiptSha256:sha(body)};
}
export function verifyBundle(bundle){
 if(!bundle||typeof bundle!=='object')return false;
 const {receiptSha256,...body}=bundle;
 return typeof receiptSha256==='string'&&sha(body)===receiptSha256&&
   verifyReport(bundle.retrieval)&&verifyPilotReceipt(bundle.admission);
}
export async function runLocal({model,modelDigest,transport=fetch,clock=()=>performance.now()}={}){
 need(typeof model==='string'&&MODEL.test(model),'invalid model name');
 need(typeof modelDigest==='string'&&SHA_256.test(modelDigest),'invalid SHA-256 model digest');
 const inputs=readPublicInputs();
 const start=clock();
 const c=await produceCorpus(inputs.template,{model,modelDigest:normalizedDigest(modelDigest),
   inputSha256:inputs.templateSha256,transport});
 const embeddingMs=clock()-start;
 need(Number.isFinite(embeddingMs)&&embeddingMs>=0,'invalid wall time');
 const evalStart=clock();
 const bundle=buildBundle(c,{inputs,runMode:'OPERATOR_APPROVED_LOCAL_OLLAMA',
   timing:{embeddingWallMilliseconds:Number(embeddingMs.toFixed(3)),
    note:'Elapsed client wall time includes network loopback and model handling; this is not GPU compute time, energy measurement or speed comparison.'}});
 const scoringMs=clock()-evalStart;
 need(Number.isFinite(scoringMs)&&scoringMs>=0,'invalid scoring wall time');
 // Record scoring wall-time without interpreting it as a comparative benchmark.
 const {receiptSha256,...body}=bundle;
 const completed={...body,timing:{...body.timing,scoringWallMilliseconds:Number(scoringMs.toFixed(3))}};
 return {...completed,receiptSha256:sha(completed)};
}
export function outputPath(relative){
 need(typeof relative==='string'&&relative.length>=6&&relative.length<=350,'invalid output filename');
 const dest=resolve(ROOT,relative);
 need(dest.startsWith(ARTIFACT_DIR+sep)&&extname(dest)==='.json',
   'output must be a new JSON file inside artifacts/local/');
 need(!existsSync(dest),'output already exists: refuse overwriting');
 return dest;
}
export function persistBundle(bundle,relative){
 need(verifyBundle(bundle),'report integrity failed');
 const path=outputPath(relative);
 mkdirSync(dirname(path),{recursive:true});
 writeFileSync(path,JSON.stringify(bundle,null,2)+'\n',{flag:'wx',mode:0o600});
 return path;
}
function parseArgs(args){
 const command=args[0];
 if(command==='--inspect'){need(args.length===1,'inspect takes no arguments');return {command};}
 need(['--execute','--offline'].includes(command),'use --inspect | --execute | --offline');
 need(args.length>=5,'missing required arguments');
 const cfg={command};
 for(let i=1;i<args.length;i++){
   const a=args[i];
   if(a==='--ack-public-fixture'){need(command==='--execute'&&!cfg.ack,'invalid duplicate acknowledgement');cfg.ack=true;continue;}
   need(['--model','--digest','--input','--out'].includes(a),'unknown CLI flag');
   need(!Object.hasOwn(cfg,a),'duplicate CLI flag');
   need(i+1<args.length&&typeof args[i+1]==='string'&&!args[i+1].startsWith('--'),'missing flag value');
   cfg[a]=args[++i];
 }
 if(command==='--execute'){
   need(cfg.ack&&cfg['--model']&&cfg['--digest']&&cfg['--out']&&Object.keys(cfg).length===5,
     'execute requires --ack-public-fixture --model NAME --digest sha256:HEX --out artifacts/local/NEW.json');
 }else need(cfg['--input']&&cfg['--out']&&Object.keys(cfg).length===3,
   'offline requires --input EXISTING_E1B_CORPUS.json --out artifacts/local/NEW.json');
 return cfg;
}
export async function main(args=process.argv.slice(2)){
 const cfg=parseArgs(args);
 if(cfg.command==='--inspect'){
   console.log(JSON.stringify({mode:'NO_EMBEDDING_CALLS',models:await inspectLocal()},null,2));
   return;
 }
 // Important: check the output destination BEFORE any model requests.
 outputPath(cfg['--out']);
 let bundle;
 if(cfg.command==='--execute'){
   bundle=await runLocal({model:cfg['--model'],modelDigest:cfg['--digest']});
 }else{
   const input=resolve(cfg['--input']);
   // Offline replay accepts only an E1B-exported copy of the PUBLIC development fixture.
   bundle=buildBundle(readCorpus(input));
 }
 const path=persistBundle(bundle,cfg['--out']);
 console.log(JSON.stringify({status:'LOCAL_REPORT_SAVED',
   path,runMode:bundle.execution,receiptSha256:bundle.receiptSha256,
   records:bundle.metadata.recordCount,queries:bundle.metadata.queryCount,
   phaseVsSignedReal:bundle.pairedSubjectComparisons.phase_minus_signed_real.observedDelta,
   warning:'Public development fixture only; no independent held-out model advantage asserted.'},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(e=>{console.error('PHMP-SM1 E1D REFUSED: '+e.message);process.exitCode=1;});
}
