import {createHash} from 'node:crypto'
import {writeFileSync} from 'node:fs'
import {buildBC2Receipt} from '../src/boundaryLineageRecovery.js'

const receipt = buildBC2Receipt()
const digest = createHash('sha256').update(JSON.stringify(receipt),'utf8').digest('hex')
const result = {...receipt,digest:{algorithm:'SHA-256',value:digest,
  scope:'UTF-8 JSON.stringify(receipt without digest), key insertion order',
  authority:'NONE',origin:'SIMULATED'}}
const args = process.argv.slice(2)
if (args.length !== 0 && (args.length !== 2 || args[0] !== '--out' || !args[1] || args[1].startsWith('-'))) {
  console.error('Usage: node scripts/run_boundary_lineage.mjs [--out path]')
  process.exitCode = 2
} else {
  const output = JSON.stringify(result,null,2)+'\n'
  if (args.length === 2) writeFileSync(args[1],output,'utf8')
  else process.stdout.write(output)
}
