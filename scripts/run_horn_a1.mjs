import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {buildHornA1Receipt} from '../src/hornA1.js';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out'
    || !args[1] || args[1].startsWith('-'))) {
  console.error('Usage: node scripts/run_horn_a1.mjs [--out <path>]');
  process.exitCode = 2;
} else {
  const receipt = buildHornA1Receipt();
  const digest = createHash('sha256').update(JSON.stringify(receipt), 'utf8').digest('hex');
  const envelope = {
    ...receipt,
    digest: {
      algorithm: 'SHA-256',
      value: digest,
      scope: 'UTF-8 JSON.stringify(receipt without digest), insertion order',
      authority: 'NONE',
    },
  };
  const text = JSON.stringify(envelope, null, 2) + '\n';
  if (args.length) writeFileSync(args[1], text, 'utf8');
  else process.stdout.write(text);
}
