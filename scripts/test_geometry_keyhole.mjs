import assert from 'node:assert/strict'
import {
  G1_PROTOCOL,canonicalCells,enumerateFreePolyominoes,foldCubeNet,
  CROSS_NET,RECTANGLE_NET,cubeCensus,hypercubeCensus,projectionWitness,
  project3,probe4,buildG1Receipt,
} from '../src/geometryKeyhole.js'

const checks=[
  ['free hexomino enumeration = 35',()=>{
    assert.equal(enumerateFreePolyominoes(6).length,35)
    assert.equal(new Set(enumerateFreePolyominoes(6).map(x=>JSON.stringify(x))).size,35)
  }],
  ['11 cube nets and 24 nonfoldable hexominoes',()=>{
    const c=cubeCensus()
    assert.deepEqual([c.shapeCount,c.foldableCount,c.nonfoldableCount],[35,11,24])
  }],
  ['rotations/reflections have a single canonical key',()=>{
    const a=canonicalCells(CROSS_NET)
    const shifted=CROSS_NET.map(([x,y])=>[-y+11,x+23])
    assert.deepEqual(a,canonicalCells(shifted))
  }],
  ['cruciform positive control',()=>{
    assert.equal(foldCubeNet(CROSS_NET).folds,true)
    assert.equal(new Set(foldCubeNet(CROSS_NET).normals).size,6)
  }],
  ['2 by 3 rectangle negative control',()=>assert.equal(foldCubeNet(RECTANGLE_NET).folds,false)],
  ['duplicate and invalid input refused',()=>{
    assert.equal(foldCubeNet(Array(6).fill([0,0])).reason,'NOT_SIX_UNIQUE_CELLS')
    assert.throws(()=>enumerateFreePolyominoes(8))
  }],
  ['tesseract incidence counts',()=>{
    const t=hypercubeCensus()
    assert.deepEqual(t,{vertices:16,edges:32,squareFaces:24,cubicCells:8})
  }],
  ['3D projection loses fourth-coordinate bit',()=>{
    const p=projectionWitness()
    assert.equal(p.coarseEqual,true)
    assert.equal(p.richDistinct,true)
    assert.deepEqual(project3(p.stateA),project3(p.stateB))
    assert.notEqual(probe4(p.stateA),probe4(p.stateB))
  }],
  ['SIMULATED provenance and deterministic receipt',()=>{
    assert.equal(G1_PROTOCOL.origin,'SIMULATED')
    assert.deepEqual(buildG1Receipt(),buildG1Receipt())
    assert.equal(buildG1Receipt().authority,'NONE')
  }],
]
let passed=0
for(const [name,run] of checks){
  run();passed++
  console.log('PASS '+name)
}
console.log('NBG-G1 '+passed+'/'+checks.length+' PASS · finite formal toy model only')
