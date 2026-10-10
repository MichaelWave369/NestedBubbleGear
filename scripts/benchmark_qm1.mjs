import { createHash } from 'node:crypto'
import { comparePoWSchedules,simulateToyGrover,qm1Receipt } from '../src/qm1Model.js'
const sha256=async bytes=>new Uint8Array(createHash('sha256').update(bytes).digest())
const result=await comparePoWSchedules({
  sha256,universe:1024,budget:1024,seed:369,leadingZeroBits:8,
})
const grover=simulateToyGrover({qubits:7,markedIndex:23,iterations:8})
const receipt=qm1Receipt(result,grover)
console.log(JSON.stringify(receipt,null,2))
console.error('Educational CPU/Node benchmark; no GPU, Bitcoin consensus mining, QPU or energy measurements.')
