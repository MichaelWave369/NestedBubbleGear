import {createHash} from 'node:crypto'
import {writeFileSync} from 'node:fs'
import {buildBC3Receipt} from '../src/boundaryCustody.js'

const receipt=buildBC3Receipt()
const digest=createHash('sha256').update(JSON.stringify(receipt),'utf8').digest('hex')
const result={...receipt,digest:{
  algorithm:'SHA-256',value:digest,
  scope:'UTF-8 JSON.stringify of receipt without digest, insertion-order keys',
  origin:'SIMULATED',authority:'NONE',
}}
const args=process.argv.slice(2)
if(args.length!==0&&(args.length!==2||args[0]!=='--out'||!args[1]||args[1].startsWith('-'))){
  console.error('Usage: node scripts/run_boundary_custody.mjs [--out path]')
  process.exitCode=2
}else{
  const body=JSON.stringify(result,null,2)+'\n'
  if(args.length)writeFileSync(args[1],body,'utf8')
  else process.stdout.write(body)
}
