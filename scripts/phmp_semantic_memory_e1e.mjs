/**
 * PHMP-SM1 E1E: one manually dispatched, GitHub-hosted real-model development
 * embedding experiment. No installation on the user's PC or clone required.
 * Production path uses a fixed model/revision and public fixture exclusively.
 * Tests inject a synthetic encoder; model package is dynamically imported
 * only by an explicitly acknowledged, main-branch GitHub Actions dispatch.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateCorpus, evaluate as evaluateE1A, verifyReport } from './phmp_semantic_memory_e1a.mjs';
import { evaluatePilot as evaluateE1C, verifyPilotReceipt } from './phmp_semantic_memory_e1c.mjs';
import { readPublicInputs, summarizePairs } from './phmp_semantic_memory_e1d.mjs';

export const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
export const MODEL_REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';
export const TRANSFORMERS_VERSION = '3.8.1';
export const MODEL_DTYPE = 'q8';
export const MODEL_DEVICE = 'cpu';
export const BATCH_SIZE = 8;
export const REPORT_RELATIVE_PATH = 'artifacts/local/phmp-sm1-e1e-hosted-report.json';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
function requireThat(ok,message){if(!ok)throw new Error(message);}
function sha(value){return 'sha256:'+createHash('sha256').update(JSON.stringify(value)).digest('hex');}
function safeVector(arr){
  requireThat(Array.isArray(arr) && arr.length>=2 && arr.length<=2048,'invalid hosted embedding dimension');
  requireThat(arr.every(x=>typeof x==='number'&&Number.isFinite(x)) && arr.some(x=>x!==0),
    'invalid hosted vector');
  return arr;
}
/** The real ONNX tensor provides flat row-major .data and .dims=[batch,dimension]. */
export function unpackTensor(tensor,expectedRows,expectedDimension=null){
  requireThat(tensor && Array.isArray(tensor.dims) && tensor.dims.length===2 &&
    tensor.dims[0]===expectedRows,'unexpected hosted embedding tensor shape');
  const dimension=tensor.dims[1];
  requireThat(Number.isInteger(dimension)&&dimension>=2&&dimension<=2048,
    'unexpected model dimensions');
  requireThat(expectedDimension===null||expectedDimension===dimension,
    'embedding dimension changed across batches');
  const data=tensor.data;
  requireThat(data && typeof data.length==='number' && data.length===expectedRows*dimension,
    'tensor data missing or truncated');
  const vectors=[];
  for(let row=0;row<expectedRows;row++)
    vectors.push(safeVector(Array.from(data.slice(row*dimension,(row+1)*dimension))));
  return vectors;
}
export function assertHostedContext(env=process.env){
  requireThat(env.GITHUB_ACTIONS==='true','E1E real model execution requires GitHub Actions');
  requireThat(env.GITHUB_EVENT_NAME==='workflow_dispatch','E1E must be manually dispatched');
  requireThat(env.GITHUB_REF==='refs/heads/main','E1E only runs from main');
  requireThat(env.GITHUB_REPOSITORY==='MichaelWave369/NestedBubbleGear',
    'unexpected repository identity');
  requireThat(env.PHMP_E1E_ACK==='YES_PUBLIC_FIXTURE_AND_HOSTED_MODEL_DOWNLOAD',
    'operator consent to public data and temporary model download missing');
}
export async function createHostedCorpus({makeExtractor,clock=()=>performance.now(),inputs=readPublicInputs()}={}){
  requireThat(typeof makeExtractor==='function','hosted encoder factory required');
  const texts=[...inputs.template.records.map(r=>r.text),...inputs.template.queries.map(q=>q.text)];
  requireThat(texts.length===25,'E1E is limited to the frozen public 25-text fixture');
  const start=clock();
  const extractor=await makeExtractor();
  requireThat(typeof extractor==='function','invalid feature extraction pipeline');
  const vectors=[];
  let dimension=null;
  try {
    for(let i=0;i<texts.length;i+=BATCH_SIZE){
      const chunk=texts.slice(i,i+BATCH_SIZE);
      const tensor=await extractor(chunk,{pooling:'mean',normalize:true});
      const vectorsBatch=unpackTensor(tensor,chunk.length,dimension);
      if(dimension===null)dimension=vectorsBatch[0].length;
      vectors.push(...vectorsBatch);
    }
  } finally {if(typeof extractor.dispose==='function')await extractor.dispose();}
  const embeddingWallMilliseconds=Number((clock()-start).toFixed(3));
  requireThat(Number.isFinite(embeddingWallMilliseconds)&&embeddingWallMilliseconds>=0,
    'invalid embedding wall time');
  const c=validateCorpus({
    schema:'PHMP-SM1-E1A-CORPUS',
    embeddingSource:{
      kind:'OPERATOR_SUPPLIED_HOSTED',model:MODEL_ID,modelRevision:MODEL_REVISION,
      engine:'@huggingface/transformers',engineVersion:TRANSFORMERS_VERSION,
      device:MODEL_DEVICE,dtype:MODEL_DTYPE,runner:'GITHUB_ACTIONS_EPHEMERAL',
      templateSha256:inputs.templateSha256,splitSha256:inputs.splitSha256,
      permission:'WORKFLOW_DISPATCH_PUBLIC_FIXTURE_ONLY',
      provenanceNote:'Public model repository revision and runtime identity are declared from the pinned invocation; not separately attested.'
    },
    dimension,
    records:inputs.template.records.map((r,i)=>({...r,vector:vectors[i]})),
    queries:inputs.template.queries.map((q,i)=>({...q,vector:vectors[i+inputs.template.records.length]}))
  });
  return {corpus:c,embeddingWallMilliseconds};
}
export function buildHostedReport(c,{inputs=readPublicInputs(),embeddingWallMilliseconds=null,
  evaluationWallMilliseconds=null,commit='UNKNOWN',execution='SIMULATED_TEST_ONLY'}={}){
  validateCorpus(c);
  requireThat(c.embeddingSource.kind==='OPERATOR_SUPPLIED_HOSTED'&&
    c.embeddingSource.model===MODEL_ID&&c.embeddingSource.modelRevision===MODEL_REVISION&&
    c.embeddingSource.engineVersion===TRANSFORMERS_VERSION&&
    c.embeddingSource.templateSha256===inputs.templateSha256&&
    c.embeddingSource.splitSha256===inputs.splitSha256,'hosted model or source mismatch');
  requireThat(c.records.length===inputs.template.records.length &&
    c.queries.length===inputs.template.queries.length,'public fixture lengths differ');
  // Compare exact public source rows, not merely their IDs/hashes.
  const strip=x=>{const {vector,...rest}=x;return rest;};
  requireThat(JSON.stringify(c.records.map(strip))===JSON.stringify(inputs.template.records)&&
    JSON.stringify(c.queries.map(strip))===JSON.stringify(inputs.template.queries),
    'hosted input text or annotations not identical to frozen fixture');
  const retrieval=evaluateE1A(c);
  const admission=evaluateE1C(c,inputs.split);
  requireThat(verifyReport(retrieval)&&verifyPilotReceipt(admission),'nested evidence receipt invalid');
  const pairs=summarizePairs(c,inputs.split,admission);
  const body={
    schema:'PHMP-SM1-E1E-GITHUB-HOSTED-DEVELOPMENT-REPORT',
    origin:'SIMULATED',authority:'NONE',
    embeddingStatus:execution==='GITHUB_ACTIONS_REAL_MODEL'?'REAL_HOSTED_ONNX_EMBEDDINGS':'MOCK_INJECTED_EMBEDDINGS',
    evaluationStatus:'PUBLIC_SYNTHETIC_DEVELOPMENT_NOT_HELD_OUT',
    commit,
    model:{id:MODEL_ID,revision:MODEL_REVISION,dtype:MODEL_DTYPE,device:MODEL_DEVICE,
      engine:'@huggingface/transformers',engineVersion:TRANSFORMERS_VERSION,
      modelWeightsAttested:false},
    source:{templateSha256:inputs.templateSha256,splitSha256:inputs.splitSha256,
      corpusSha256:retrieval.corpusSha256,
      recordCount:c.records.length,queryCount:c.queries.length,dimension:c.dimension},
    timings:{embeddingWallMilliseconds,evaluationWallMilliseconds,
      caveat:'Hosted CPU wall times include inference and runtime overhead; not same hardware as a local Ollama test.'},
    retrieval,admission,pairedSubjectComparisons:pairs,
    limitations:'Manual public-fixture text and exposed development labels only. Model weights are requested by pinned repo revision on a temporary GitHub runner. No actual hardware or weight-bytes attestation, no independent holdout, no privacy-sensitive memory, no phase-vs-real advantage.'
  };
  return {...body,receiptSha256:sha(body)};
}
export function verifyHostedReport(r){
  if(!r || typeof r!=='object')return false;
  const {receiptSha256,...body}=r;
  return typeof receiptSha256==='string'&&receiptSha256===sha(body)&&
    verifyReport(r.retrieval)&&verifyPilotReceipt(r.admission);
}
export async function runHosted({makeExtractor,inputs=readPublicInputs(),clock=()=>performance.now(),
  commit='UNKNOWN',execution='SIMULATED_TEST_ONLY'}={}){
  const {corpus,embeddingWallMilliseconds}=await createHostedCorpus({makeExtractor,clock,inputs});
  const start=clock();
  const report=buildHostedReport(corpus,{inputs,embeddingWallMilliseconds,commit,execution});
  const scoring=Number((clock()-start).toFixed(3));
  requireThat(scoring>=0&&Number.isFinite(scoring),'invalid scoring wall time');
  const {receiptSha256,...body}=report;
  const withTiming={...body,timings:{...body.timings,evaluationWallMilliseconds:scoring}};
  return {...withTiming,receiptSha256:sha(withTiming)};
}
async function realExtractor(){
  // This package is installed ONLY in the temporary Actions environment during
  // a separately acknowledged manual workflow dispatch, never by normal CI.
  const {pipeline}=await import('@huggingface/transformers');
  return pipeline('feature-extraction',MODEL_ID,{
    revision:MODEL_REVISION,device:MODEL_DEVICE,dtype:MODEL_DTYPE
  });
}
export async function main(args=process.argv.slice(2),env=process.env){
  requireThat(args.length===1&&args[0]==='--run-public-fixture',
    'E1E only accepts --run-public-fixture, with explicit GitHub Actions acknowledgement');
  assertHostedContext(env);
  const report=await runHosted({makeExtractor:realExtractor,commit:env.GITHUB_SHA||'UNKNOWN',
    execution:'GITHUB_ACTIONS_REAL_MODEL'});
  requireThat(verifyHostedReport(report),'result receipt failed validation');
  const destination=resolve(ROOT,REPORT_RELATIVE_PATH);
  mkdirSync(dirname(destination),{recursive:true});
  writeFileSync(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({status:'HOSTED_DEVELOPMENT_REPORT_CREATED',
    relativePath:REPORT_RELATIVE_PATH,modelRevision:MODEL_REVISION,receiptSha256:report.receiptSha256,
    dimension:report.source.dimension,phaseMinusSignedReal:
      report.pairedSubjectComparisons.phase_minus_signed_real.observedDelta,
    note:'Real public model embeddings on synthetic development text. This is not independently validated memory improvement.'},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(e=>{console.error('PHMP-SM1 E1E REFUSED: '+e.message);process.exitCode=1;});
}
