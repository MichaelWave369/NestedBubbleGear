import {createHash} from 'node:crypto'
import {writeFileSync} from 'node:fs'
import {buildBC1Receipt} from '../src/boundaryCrossingPersistence.js'

// Hash identifies the serialized model receipt. It is not a cryptographic
// attestation of an external biological event or independent source evidence.
const receipt = buildBC1Receipt()
const sha256 = createHash('sha256').update(JSON.stringify(receipt), 'utf8').digest('hex')
const envelope = {...receipt, digest: {
  algorithm: 'SHA-256',
  value: sha256,
  scope: 'UTF-8 JSON.stringify(receipt without digest) in insertion order',
  authority: 'NONE',
}}
const output = JSON.stringify(envelope, null, 2) + '\n'
const args = process.argv.slice(2)
if (args.length && (args.length !== 2 || args[0] !== '--out' || !args[1] || args[1].startsWith('-'))) {
  console.error('Usage: node scripts/run_boundary_crossing.mjs [--out <path>]')
  process.exitCode = 2
} else {
  if (args.length) writeFileSync(args[1], output, 'utf8')
  else process.stdout.write(output)
}
