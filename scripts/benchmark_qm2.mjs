import { createHash } from 'node:crypto'
import { runQM2Experiment,qm2Receipt } from '../src/qm2Model.js'
const sha256=async bytes=>new Uint8Array(createHash('sha256').update(bytes).digest())
const options={universe:128,rounds:6,bits:8,seed:369,warmup:16,sha256,
  onRound:({round,total})=>console.error('QM2 verified '+round+'/'+total+' rounds')}
const result=await runQM2Experiment(options)
console.log(JSON.stringify(qm2Receipt(result),null,2))
console.error('QM2 Node software timing only: NOT browser GPU/ASIC/QPU speed or energy data.')
