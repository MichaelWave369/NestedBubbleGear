// Usage: node scripts/run_resilience_atlas.mjs [--out path.json]
// Deterministic synthetic sweep; never reports observations of nature.
import {writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {BR2_GRID,BR2_PROTOCOL,runBR2FullSweep,runBR2Controls} from '../src/resilienceAtlasModel.js'

const args=process.argv.slice(2)
if(args.length!==0 && (args.length!==2||args[0]!=='--out'||!args[1].endsWith('.json'))){
  throw Error('Usage: node scripts/run_resilience_atlas.mjs [--out path.json]')
}
const result=runBR2FullSweep()
const controls=runBR2Controls()
const record={
  protocol:BR2_PROTOCOL,origin:'SIMULATED',evidenceStatus:'SYNTHETIC_SWEEP_ONLY',
  authority:'NONE',parameters:BR2_GRID,summary:result.summary,controls,
  slices:result.slices,
  limitation:'Censored means not recovered within this horizon, not forever. Velocity correlation comes from undisturbed baseline. No causal or chaotic-dynamics claims outside the simulator.',
}
const bytes=JSON.stringify(record,null,2)+'\n'
const digest=createHash('sha256').update(bytes,'utf8').digest('hex')
if(args.length)writeFileSync(args[1],bytes,{encoding:'utf8',flag:'w'})
console.log(JSON.stringify({
  protocol:record.protocol,origin:record.origin,
  cells:result.totalCells,summary:result.summary,controls,
  receipt_sha256:digest,
  saved_to:args.length?args[1]:null,
},null,2))
