// PHMP-3 E2 gate smoke test: verifies all E1 pins and the explicit scoring guard.
// THIS FILE MUST NOT GENERATE OR SCORE RESERVED HISTORIES.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const execute=(args)=>spawnSync(process.execPath,[fileURLToPath(new URL('./run_phmp3_e2.mjs',import.meta.url)),...args],{
  encoding:'utf8',maxBuffer:1024*1024
});
const valid=execute(['--verify-freeze']);
assert.equal(valid.status,0,'frozen sources must match E1 Git blobs: '+valid.stderr);
assert.match(valid.stdout,/FREEZE VERIFIED; no reserved data generated or scored/);

for(const args of [[],['--execute-reserved'],['--execute-reserved','--ack-once']]){
  const invalid=execute(args);
  assert.notEqual(invalid.status,0,'scoring must require explicit gate and receipt destination');
  assert.ok(!/RESERVED SCORING COMPLETE/.test(invalid.stdout),'invalid CLI must not score');
}
console.log('PHMP-3 E2 GATE PASS: pinned E1 source verified; reserved execution requires explicit one-shot command.');
console.log('NO HELD-OUT DATA GENERATED OR SCORED BY THIS TEST.');
