import assert from 'node:assert/strict'
import {
  BSR3_VERSION,BIDMC_SOURCE,BIDMC_RECORDS,bidmcUrl,
  parseBidmcNumerics,analyzeBidmcNumerics,buildBSR3Receipt,
} from '../src/resonanceObservatoryModel.js'

let passed=0
function test(label,fn){fn();passed++;console.log('PASS',label)}
const header='Time [s], HR, PULSE, RESP, SpO2'
const sourceRows=Array.from({length:480},(_,i)=>{
  const hr=80+7*Math.sin(i*.082)+2*Math.cos(i*.034)
  const resp=20+3*Math.sin(i*.082)+.2*Math.cos(i*.066)
  const pulse=i>=110&&i<125?'NaN':(hr+.6*Math.sin(i*.17)).toFixed(4)
  return [i,hr.toFixed(4),pulse,resp.toFixed(4),'97'].join(',')
})
const csv=[header,...sourceRows].join('\n')
const recording=parseBidmcNumerics(csv)
const result=analyzeBidmcNumerics(recording)

test('frozen public catalog and safe exact record URLs',()=>{
  assert.equal(BSR3_VERSION,'BSR-3.0.0')
  assert.equal(BIDMC_RECORDS.length,3)
  assert.equal(BIDMC_SOURCE.doi,'10.13026/C2208R')
  assert.match(bidmcUrl('01'),/bidmc_01_Numerics\.csv$/)
  assert.throws(()=>bidmcUrl('../secret'),/not in frozen catalog/)
  assert.ok(BIDMC_RECORDS.every(item=>/^[a-f0-9]{64}$/.test(item.sha256)))
})

test('parser accepts documented spaced BIDMC header and 1 Hz rows',()=>{
  assert.equal(recording.rows.length,480)
  assert.equal(recording.sampleRateHz,1)
  assert.equal(recording.provenance,'USER_SUPPLIED_UNVERIFIED')
  assert.equal(recording.rows[0].t,0)
  assert.equal(recording.rows.at(-1).t,479)
})

test('NaN from original monitor is preserved as missing, never filled',()=>{
  assert.equal(recording.rows[111].pulseRate,null)
  assert.equal(result.quality.missingPulseRate,15)
  assert.equal(result.quality.missingHeartRate,0)
  assert.equal(result.quality.missingRespiratoryRate,0)
})

test('known constructed aligned rate changes are recoverable',()=>{
  assert.ok(result.primary.r>.8)
  assert.ok(result.changes.r>.5)
  assert.equal(result.primary.paired,480)
  assert.equal(result.quality.coverage,1)
  assert.equal(result.scientificStatus,'DESCRIPTIVE_ONLY')
})

test('all fixed diagnostics have exact pre-registered offsets',()=>{
  assert.deepEqual(result.shifts.map(item=>item.offsetSeconds),[60,90,120,150,180])
  assert.deepEqual(result.lags.map(item=>item.lagSeconds),[-30,-20,-10,0,10,20,30])
  assert.equal(result.methods.significanceTests,false)
  assert.equal(result.methods.phaseOrNeuralInference,false)
  assert.ok(result.shifts.every(item=>item.paired===480))
})

test('split halves are evaluated separately',()=>{
  assert.equal(result.halves.length,2)
  assert.deepEqual(result.halves.map(item=>item.paired),[240,240])
})

test('isolated 1 Hz NaN missingness is pairwise excluded without interpolation',()=>{
  const altered=csv.split('\n')
  altered[31]=altered[31].replace(/^[^,]+,[^,]+,/,'30,NaN,')
  // Keep five columns: replace exactly the HR field instead.
  const line=csv.split('\n')
  const fields=line[31].split(',')
  fields[1]='NaN';fields[3]='NaN';line[31]=fields.join(',')
  const newData=parseBidmcNumerics(line.join('\n'))
  const calc=analyzeBidmcNumerics(newData)
  assert.equal(calc.quality.missingHeartRate,1)
  assert.equal(calc.quality.missingRespiratoryRate,1)
  assert.equal(calc.primary.paired,479)
  assert.equal(calc.changes.paired,477)
})

test('quality refusal applies to missing and degenerate channels',()=>{
  const lines=csv.split('\n')
  for(let i=1;i<=290;i++){
    const cells=lines[i].split(',')
    cells[1]='NaN';cells[3]='NaN';lines[i]=cells.join(',')
  }
  const bad=analyzeBidmcNumerics(parseBidmcNumerics(lines.join('\n')))
  assert.equal(bad.scientificStatus,'REFUSE_INTERPRETATION')
  assert.ok(bad.refusal.includes('INSUFFICIENT_COVERAGE'))
  const constant=csv.split('\n').map((line,i)=>{
    if(i===0)return line
    const fields=line.split(',');fields[3]='20';return fields.join(',')
  }).join('\n')
  assert.ok(analyzeBidmcNumerics(parseBidmcNumerics(constant)).refusal.includes('ZERO_VARIANCE'))
})

test('invalid header and forged CSV fields rejected',()=>{
  assert.throws(()=>parseBidmcNumerics(csv.replace(header,'Time [s],HR,RESP')),/header/)
  assert.throws(()=>parseBidmcNumerics(csv.replace('0,','0,evil,')),/five columns/)
  assert.throws(()=>parseBidmcNumerics(csv.replace('97\n1,','-97\n1,')),/Negative/)
})

test('missing time or non-1-Hz cadence rejects rather than resamples',()=>{
  const lines=csv.split('\n')
  const cells=lines[85].split(',');cells[0]='999';lines[85]=cells.join(',')
  assert.throws(()=>parseBidmcNumerics(lines.join('\n')),/1 second/)
})

test('no silent data-range padding and no too-short series',()=>{
  assert.throws(()=>parseBidmcNumerics(csv.split('\n').slice(0,220).join('\n')),/240/)
  assert.throws(()=>parseBidmcNumerics('x'.repeat(150001)),/150 kB/)
})

test('ledger receipt includes source and metrics but no patient rate samples',()=>{
  const receipt=buildBSR3Receipt(recording,result,{
    source:bidmcUrl('01'),actualSha256:'abc',matchingOfficialChecksum:false,
  })
  assert.equal(receipt.provenance,'USER_SUPPLIED_UNVERIFIED')
  assert.equal(receipt.matchingOfficialChecksum,false)
  assert.equal(receipt.rawSamplesIncluded,false)
  assert.equal(receipt.units.heartRate,'bpm')
  assert.equal(receipt.dataset.doi,'10.13026/C2208R')
  assert.ok(!JSON.stringify(receipt).includes('"rows":'))
})

console.log('BSR-3 '+passed+'/'+passed+' deterministic model checks PASS. This is not a finding about real physiology.')
