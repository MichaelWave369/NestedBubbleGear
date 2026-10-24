/**
 * PHMP-SM1 E1C: development-only calibrated candidate admission and abstention.
 * All model vectors are supplied externally via E1A/E1B. No inference, network,
 * truth verification, real deployment, or reserved holdout consumption.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readCorpus, validateCorpus, MODES as E1A_MODES } from './phmp_semantic_memory_e1a.mjs';

export const E1C_MODES = Object.freeze([...E1A_MODES, 'exact_claim_filter']);
const ORIGINS = new Set(['OBSERVED','VERIFIED']);
function assertThat(v, msg) { if (!v) throw new Error(msg); }
function sha(v) { return createHash('sha256').update(JSON.stringify(v)).digest('hex'); }
function claimKey(c) { return [c.subject,c.predicate,c.object].join('\u001f'); }
function sameClaim(a,b) { return claimKey(a) === claimKey(b) && a.polarity === b.polarity; }
function score(a,b) {
  let dot=0,aa=0,bb=0;
  for (let i=0;i<a.length;i++) {dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
  assertThat(aa>0 && bb>0,'vectors must be nonzero');
  return Math.min(1,Math.max(-1,dot / Math.sqrt(aa*bb)));
}
function rounded(v) { return Number(v.toFixed(12)); }
export function rankedCandidates(c,q,mode) {
  assertThat(E1C_MODES.includes(mode),'invalid comparator');
  const eligible=c.records.filter(r=>r.scope===q.scope && ORIGINS.has(r.origin) &&
    r.validFrom<=q.asOf && (r.validTo===null || q.asOf<r.validTo));
  const relevant=eligible.filter(r=>claimKey(r.claim)===claimKey(q.claim));
  const conflict=new Set(relevant.map(r=>r.claim.polarity)).size>1;
  const pool=eligible.filter(r=>mode==='metadata_filter'
    ? r.claim.polarity===q.claim.polarity
    :mode==='exact_claim_filter'?sameClaim(q.claim,r.claim):true);
  const candidates=pool.map(r=>{
    const similarity=score(q.vector,r.vector);
    const polarity=q.claim.polarity===r.claim.polarity?1:-1;
    // Binary phase: Re(e^(i Delta)) is exactly polarity (+1 or -1).
    const adjusted=['signed_real','complex_phase'].includes(mode)?polarity*similarity:similarity;
    return {id:r.id,score:rounded(adjusted),sourceId:r.sourceId,claim:r.claim};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  return {eligibleCount:eligible.length, poolCount:pool.length, conflict,candidates};
}
export function decide(c,q,mode,threshold) {
  assertThat(threshold===2 || (typeof threshold==='number' && Number.isFinite(threshold) && threshold>=-1 && threshold<=1),'invalid frozen threshold');
  const ranked=rankedCandidates(c,q,mode);
  const top=ranked.candidates[0];
  const common={queryId:q.id,mode,rankedId:top?.id??null,rankedScore:top?.score??null,
    sourceId:top?.sourceId??null,conflict:ranked.conflict,eligibleCount:ranked.eligibleCount,
    threshold,origin:'SIMULATED',authority:'NONE'};
  if(ranked.conflict)return {...common,status:'CONFLICT_DEFER',admittedId:null};
  if(!top)return {...common,status:'INSUFFICIENT',admittedId:null};
  // Even a cosine score of 1.0 never bypasses the declared claim predicate.
  if(!sameClaim(q.claim,top.claim))return {...common,status:'CLAIM_MISMATCH_DEFER',admittedId:null};
  if(top.score<threshold)return {...common,status:'LOW_SCORE_DEFER',admittedId:null};
  return {...common,status:'CANDIDATE_ONLY',admittedId:top.id};
}
export function validateSplit(c,split) {
  validateCorpus(c);
  assertThat(split && split.schema==='PHMP-SM1-E1C-SPLIT' &&
    split.purpose==='DEVELOPMENT_ONLY','only development-only split accepted');
  const fields=Object.keys(split).sort();
  assertThat(JSON.stringify(fields)===JSON.stringify(['developmentQueryIds','purpose','schema','validationQueryIds'].sort()),'split has unknown fields');
  const dev=split.developmentQueryIds,val=split.validationQueryIds;
  assertThat(Array.isArray(dev)&&Array.isArray(val)&&dev.length>=2&&val.length>=2,'requires development and validation groups');
  const ids=c.queries.map(q=>q.id),seen=new Set([...dev,...val]);
  assertThat(seen.size===dev.length+val.length,'query appears in both groups or duplicated');
  assertThat(ids.length===seen.size&&ids.every(x=>seen.has(x)),'every corpus query must be assigned');
  // Split on entity/subject prevents paraphrases of one subject entering both groups.
  const byId=new Map(c.queries.map(q=>[q.id,q]));
  const subjects=new Set(dev.map(id=>{assertThat(byId.has(id),'missing development query');return byId.get(id).claim.subject}));
  for(const id of val) {assertThat(byId.has(id),'missing validation query');assertThat(!subjects.has(byId.get(id).claim.subject),'cross-group subject leakage');}
  // Declared origins/labels are user-authored; validity isn't an independent attestation.
  return split;
}
function summarize(rows) {
  let correct=0,wrong=0,conflicts=0,abstentions=0,falseOnEmpty=0,positives=0,empties=0,correctEmpty=0;
  for(const r of rows) {
    if(r.expectedIds.length)positives++;else empties++;
    if(r.status==='CONFLICT_DEFER')conflicts++;
    if(r.admittedId===null) {
      abstentions++;
      if(r.expectedIds.length===0)correctEmpty++;
    } else if(r.expectedIds.includes(r.admittedId))correct++;
    else {wrong++;if(r.expectedIds.length===0)falseOnEmpty++;}
  }
  const ratio=(num,den)=>den===0?null:Number((num/den).toFixed(9));
  return {queryCount:rows.length,positiveQueries:positives,emptyQueries:empties,
    correctAdmissions:correct,wrongAdmissions:wrong,abstentions,conflictDeferrals:conflicts,
    falseAdmissionsOnEmpty:falseOnEmpty,
    selectivePrecision:ratio(correct,correct+wrong),correctAdmitRate:ratio(correct,positives),
    emptyAbstentionRate:ratio(correctEmpty,empties)};
}
function rowsFor(c,ids,mode,threshold) {
  const byId=new Map(c.queries.map(q=>[q.id,q]));
  return ids.map(id=>{
    const q=byId.get(id),result=decide(c,q,mode,threshold);
    return {...result,family:q.family,expectedIds:[...q.expectedIds]};
  });
}
function evaluateThreshold(c,ids,mode,t) {return summarize(rowsFor(c,ids,mode,t));}
export function calibrate(c,ids,mode) {
  // Note: all labels here are exposed DEVELOPMENT data. No threshold selected on validation IDs.
  const byId=new Map(c.queries.map(q=>[q.id,q]));
  const options=new Set([-1,2]);
  for(const id of ids) {
    const q=byId.get(id);
    assertThat(q,'unknown calibration ID');
    const top=rankedCandidates(c,q,mode).candidates[0];
    if(top)options.add(top.score);
  }
  let best=null;
  for(const threshold of [...options].sort((a,b)=>a-b)) {
    const metrics=evaluateThreshold(c,ids,mode,threshold);
    if(metrics.wrongAdmissions!==0)continue;
    // Prefer most correct development recalls, then stricter cutoff.
    if(!best||metrics.correctAdmissions>best.metrics.correctAdmissions ||
      (metrics.correctAdmissions===best.metrics.correctAdmissions&&threshold>best.threshold))
      best={threshold,metrics};
  }
  assertThat(best,'calibration failed to find an abstain-all fallback');
  return best;
}
export function evaluatePilot(c,split) {
  validateSplit(c,split);
  const modes={};
  for(const mode of E1C_MODES) {
    const frozen=calibrate(c,split.developmentQueryIds,mode);
    const development=rowsFor(c,split.developmentQueryIds,mode,frozen.threshold);
    const validation=rowsFor(c,split.validationQueryIds,mode,frozen.threshold);
    modes[mode]={threshold:frozen.threshold,development:summarize(development),
      validation:summarize(validation),validationDecisions:validation.map(({expectedIds,...rest})=>rest)};
  }
  assertThat(JSON.stringify(modes.signed_real.validationDecisions.map(r=>[r.rankedId,r.rankedScore,r.admittedId,r.status]))===
    JSON.stringify(modes.complex_phase.validationDecisions.map(r=>[r.rankedId,r.rankedScore,r.admittedId,r.status])),
    'equal-information phase and real decision parity failed');
  assertThat(modes.signed_real.threshold===modes.complex_phase.threshold,
    'equal-information phase and real cutoff parity failed');
  const body={schema:'PHMP-SM1-E1C-DEVELOPMENT-REPORT',origin:'SIMULATED',authority:'NONE',
    corpusSha256:sha(c),splitSha256:sha(split),embeddingSource:c.embeddingSource,
    developmentQueries:split.developmentQueryIds.length,
    validationQueries:split.validationQueryIds.length,
    status:'DEVELOPMENT_ONLY_NOT_HELD_OUT',
    policy:'EXACT_SCOPE + DECLARED_ORIGIN + TIME + CONFLICT_DEFER + EXACT_CLAIM_ADMISSION + DEVELOPMENT_CALIBRATED_SCORE',
    interpretation:'Results are from exposed development data with user-authored labels. No independent holdout, production confidence calibration, source verification, or claimed superiority over a same-information real baseline.',
    modes};
  return {...body,receiptSha256:sha(body)};
}
export function verifyPilotReceipt(r) {
  if(!r || typeof r!=='object')return false;
  const {receiptSha256,...body}=r;
  return typeof receiptSha256==='string'&&sha(body)===receiptSha256;
}
function readSplit(file) {
  const bytes=readFileSync(file);
  assertThat(bytes.length<=64*1024,'split file too large');
  return JSON.parse(bytes.toString('utf8'));
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const args=process.argv.slice(2);
  assertThat((args.length===4||args.length===6)&&args[0]==='--input'&&args[2]==='--split'&&
    (args.length===4||(args[4]==='--out'&&args[5])),
    'usage: node scripts/phmp_semantic_memory_e1c.mjs --input E1A_CORPUS.json --split E1C_SPLIT.json [--out NEW_REPORT.json]');
  const report=evaluatePilot(readCorpus(args[1]),readSplit(args[3]));
  if(args.length===6)writeFileSync(args[5],JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify(report,null,2));
}
