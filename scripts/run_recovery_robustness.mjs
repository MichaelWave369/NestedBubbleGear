// Deterministic offline generator of the predeclared BR3 synthetic sensitivity ledger.
// Usage: node scripts/run_recovery_robustness.mjs [--out path.json]
import {createHash} from 'node:crypto'
import {writeFileSync} from 'node:fs'
import {BR3_BASE_COUNT,BR3_INTEGRATION_COUNT,BR3_OUTCOME_COUNT,
  runBR3Panel,buildBR3Receipt} from '../src/recoveryRobustnessModel.js'
const args=process.argv.slice(2)
if(args.length!==0&&(args.length!==2||args[0]!=='--out'||!args[1].endsWith('.json'))){
  throw new Error('Usage: node scripts/run_recovery_robustness.mjs [--out path.json]')
}
const result=runBR3Panel()
if(result.byBase.length!==BR3_BASE_COUNT||result.runs.length!==BR3_INTEGRATION_COUNT||
  result.summary.thresholdOutcomes!==BR3_OUTCOME_COUNT)throw new Error('Incomplete BR3 sweep')
const receipt=buildBR3Receipt(result)
const bytes=JSON.stringify(receipt,null,2)+'\n'
const sha256=createHash('sha256').update(bytes,'utf8').digest('hex')
if(args.length)writeFileSync(args[1],bytes,{encoding:'utf8'})
const map=(name,fn)=>result.byBase.filter(fn).length
console.log(JSON.stringify({
  protocol:receipt.protocol,origin:receipt.origin,
  baseCases:result.byBase.length,summary:result.summary,
  perBase:{
    horizonRescue:map('horizonRescue',b=>b.horizonRescue>0),
    kickSiteSensitive:map('kickSiteSensitive',b=>b.kickSiteVariation),
    thresholdSensitive:map('thresholdSensitive',b=>b.thresholdSensitive),
    stepOutcomeFlips:map('stepOutcomeFlips',b=>b.dtFlip),
    coarseKeyholeMismatch:map('coarseKeyholeMismatch',b=>b.coarseHighWithoutRecovery),
  },
  receiptSha256:sha256,
  file:args.length?args[1]:null,
  caveat:'Entirely synthetic. Recovery absence is horizon-censored; no permanent instability or chaos claim.',
},null,2))
