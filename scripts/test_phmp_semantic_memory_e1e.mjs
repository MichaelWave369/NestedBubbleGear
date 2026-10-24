import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { readPublicInputs, summarizePairs } from './phmp_semantic_memory_e1d.mjs';
import { MODEL_ID, MODEL_REVISION, TRANSFORMERS_VERSION, BATCH_SIZE,
  unpackTensor, assertHostedContext, createHostedCorpus, runHosted,
  buildHostedReport, verifyHostedReport, REPORT_RELATIVE_PATH
} from './phmp_semantic_memory_e1e.mjs';

let checks=0;
const check=(fn)=>{fn();checks++;};
check(()=>assert.equal(MODEL_REVISION.length,40));
check(()=>assert.equal(MODEL_ID,'Xenova/all-MiniLM-L6-v2'));
check(()=>assert.equal(TRANSFORMERS_VERSION,'3.8.1'));
check(()=>assert.equal(BATCH_SIZE,8));
const inputs=readPublicInputs();
check(()=>assert.equal(inputs.template.records.length+inputs.template.queries.length,25));
check(()=>assert.equal(inputs.split.validationQueryIds.length,4));
let requests=0,disposed=0,clockTick=0;
function mockFactory(){
  return async ()=>{
    const encoder=async(texts,opts)=>{
      requests++;
      assert.deepEqual(opts,{pooling:'mean',normalize:true});
      assert(texts.length>=1 && texts.length<=8);
      const flattened=[];
      for(const text of texts){
        // Explicitly artificial 8D keyword fixture, NOT an embedding model.
        const words=['solar','router','bridge','deck','backup','battery','firewall','testing'];
        const lower=text.toLowerCase();
        flattened.push(...words.map((w,i)=>lower.includes(w)?1+i:0.02));
      }
      return {dims:[texts.length,8],data:new Float32Array(flattened)};
    };
    encoder.dispose=async()=>{disposed++;};
    return encoder;
  };
}
const clock=()=>{clockTick+=13;return clockTick;};
const {corpus,embeddingWallMilliseconds}=await createHostedCorpus({
  makeExtractor:mockFactory(),clock,inputs
});
check(()=>assert.equal(embeddingWallMilliseconds,13));
check(()=>assert.equal(disposed,1));
check(()=>assert.equal(requests,4));
check(()=>assert.equal(corpus.dimension,8));
check(()=>assert.equal(corpus.records.length,12));
check(()=>assert.equal(corpus.queries.length,13));
check(()=>assert.equal(corpus.embeddingSource.kind,'OPERATOR_SUPPLIED_HOSTED'));
check(()=>assert.equal(corpus.embeddingSource.modelRevision,MODEL_REVISION));
check(()=>assert.equal(corpus.embeddingSource.templateSha256,inputs.templateSha256));
const dry=buildHostedReport(corpus,{inputs,embeddingWallMilliseconds,commit:'TEST'});
check(()=>assert.equal(dry.embeddingStatus,'MOCK_INJECTED_EMBEDDINGS'));
check(()=>assert(verifyHostedReport(dry)));
check(()=>assert.equal(dry.pairedSubjectComparisons.phase_minus_signed_real.observedDelta,0));
check(()=>assert.equal(dry.pairedSubjectComparisons.phase_minus_metadata_filter.validationSubjectGroups,4));
check(()=>assert.equal(dry.pairedSubjectComparisons.phase_minus_exact_claim_filter.exhaustiveBootstrapSamples,256));
check(()=>assert(!JSON.stringify(dry).includes('"vector"')));
check(()=>assert(!JSON.stringify(dry).includes('The solar inverter passed inspection and acceptance.')));
check(()=>assert.equal(dry.retrieval.embeddingSource.kind,'OPERATOR_SUPPLIED_HOSTED'));
check(()=>assert(!verifyHostedReport({...dry,embeddingStatus:'REAL_HOSTED_ONNX_EMBEDDINGS'})));
check(()=>assert(!verifyHostedReport({...dry,admission:{...dry.admission,authority:'ROOT'}})));
const actualMock=await runHosted({makeExtractor:mockFactory(),inputs,clock,commit:'TEST'});
check(()=>assert(verifyHostedReport(actualMock)));
check(()=>assert.equal(actualMock.embeddingStatus,'MOCK_INJECTED_EMBEDDINGS'));
check(()=>assert.equal(actualMock.timings.evaluationWallMilliseconds,13));
check(()=>assert.equal(requests,8));
check(()=>assert.equal(disposed,2));
assert.throws(()=>unpackTensor({dims:[1,3],data:[1,2]},1),/truncated/);checks++;
assert.throws(()=>unpackTensor({dims:[2,3],data:[1,2,3,4,5,6]},1),/shape/);checks++;
assert.throws(()=>unpackTensor({dims:[1,3],data:[1,2,3]},1,4),/changed/);checks++;
assert.throws(()=>unpackTensor({dims:[1,2],data:[NaN,1]},1),/invalid hosted vector/);checks++;
assert.throws(()=>unpackTensor({dims:[1,2],data:[0,0]},1),/invalid hosted vector/);checks++;
const changed=structuredClone(corpus);
changed.records[0].text='EDITED SECRET OR PRIVATE INPUT';
assert.throws(()=>buildHostedReport(changed,{inputs}),/text or annotations/);checks++;
const wrongSource=structuredClone(corpus);
wrongSource.embeddingSource.kind='OPERATOR_SUPPLIED_LOCAL';
assert.throws(()=>buildHostedReport(wrongSource,{inputs}),/source mismatch/);checks++;
const badCommit=structuredClone(corpus);
badCommit.embeddingSource.modelRevision='main';
assert.throws(()=>buildHostedReport(badCommit,{inputs}),/source mismatch/);checks++;
const validEnv={
 GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',
 GITHUB_REF:'refs/heads/main',GITHUB_REPOSITORY:'MichaelWave369/NestedBubbleGear',
 PHMP_E1E_ACK:'YES_PUBLIC_FIXTURE_AND_HOSTED_MODEL_DOWNLOAD',
};
assert.doesNotThrow(()=>assertHostedContext(validEnv));checks++;
for(const [field,value] of [
 ['GITHUB_ACTIONS','false'],['GITHUB_EVENT_NAME','pull_request'],
 ['GITHUB_REF','refs/heads/dev'],['GITHUB_REPOSITORY','attacker/fork'],
 ['PHMP_E1E_ACK','NO']]){
 assert.throws(()=>assertHostedContext({...validEnv,[field]:value}));checks++;
}
// Explicitly refuse pulling any model by routine CI or deployment.
const workflow=readFileSync('.github/workflows/phmp-sm1-e1e-hosted.yml','utf8');
check(()=>assert(workflow.includes('workflow_dispatch:')));
check(()=>assert(!workflow.includes('pull_request:')&&!workflow.includes('push:')&&!workflow.includes('schedule:')));
check(()=>assert(workflow.includes('permissions:\n  contents: read')));
check(()=>assert(workflow.includes("github.ref == 'refs/heads/main'")));
check(()=>assert(workflow.includes('acknowledge_public_model_download')));
check(()=>assert(workflow.includes('@huggingface/transformers@3.8.1')));
check(()=>assert(workflow.includes('retention-days: 7')));
check(()=>assert(workflow.includes('actions/upload-artifact@v4')));
check(()=>assert(REPORT_RELATIVE_PATH.startsWith('artifacts/local/')));
const versioned=readFileSync('scripts/phmp_semantic_memory_e1e.mjs','utf8');
check(()=>assert(versioned.includes("await import('@huggingface/transformers')")));
console.log(JSON.stringify({schema:'PHMP-SM1-E1E-TEST',checks,realModelsInvoked:0,
 fakeEncoderBatches:requests,modelRevision:MODEL_REVISION,
 note:'All CI tests use injected synthetic encoder. No dependency download or real inference.'},null,2));
