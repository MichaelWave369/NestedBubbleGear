import assert from 'node:assert/strict';
import {buildHornScene} from '../src/hornA1Visualization.js';
import {hornPrefix, probeHorn, makeHornState} from '../src/hornA1.js';

const checks = [
  ['scene samples finite, original horn section count', () => {
    const scene = buildHornScene({sections:16});
    assert.equal(scene.faces.length, 88 * 28);
    assert.equal(scene.mouth.length, 29);
    assert.equal(scene.endpoint,17);
    assert.equal(scene.compression,'DISPLAY_ONLY_LOG_X');
    assert.deepEqual(scene.highlights.map(h => h.sectionBoundary), [2,3]);
    assert.equal(scene.origin,'SIMULATED');
    assert.equal(scene.authority,'NONE');
    assert.ok(scene.faces.some(f=>f.section===1));
    assert.ok(scene.faces.some(f=>f.section===2));
    assert.ok(scene.faces.some(f=>f.section===0));
    for (const face of scene.faces) {
      assert.equal(face.points.length, 4);
      assert.ok(Number.isFinite(face.depth));
      for (const p of face.points) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
  }],
  ['painter faces are sorted by projection depth', () => {
    const {faces} = buildHornScene({sections:256,yaw:.44,width:800,height:360});
    for(let i=1;i<faces.length;i++) assert.ok(faces[i-1].depth<=faces[i].depth);
  }],
  ['projection changes when camera yaw changes', () => {
    const a=buildHornScene({yaw:0});
    const b=buildHornScene({yaw:.7});
    assert.notDeepEqual(a.mouth,b.mouth);
    assert.notDeepEqual(a.axis,b.axis);
  }],
  ['label reversal changes display highlights, never mathematical geometry', () => {
    const a=buildHornScene({sections:16,labels:[1,-1]});
    const b=buildHornScene({sections:16,labels:[-1,1]});
    assert.equal(a.endpoint,b.endpoint);
    assert.deepEqual(a.mouth,b.mouth);
    assert.deepEqual(a.axis,b.axis);
    assert.ok(a.faces.some((f,i)=>f.section===1&&f.fill!==b.faces[i].fill));
    assert.deepEqual(hornPrefix(16),hornPrefix(16));
    assert.equal(
      probeHorn(makeHornState([1,-1])).readout,
      -probeHorn(makeHornState([-1,1])).readout,
    );
  }],
  ['finite cutoffs at bounds render stable meshes', () => {
    for (const sections of [2,8,32,128,256]) {
      const scene=buildHornScene({sections});
      assert.equal(scene.faces.length,2464);
      assert.equal(scene.endpoint,sections+1);
      assert.ok(scene.faces.every(f=>f.points.every(p=>Number.isFinite(p.x) && Number.isFinite(p.y))));
    }
  }],
  ['invalid sizes, angles, viewport or label types fail closed', () => {
    for (const sections of [0,1,257,3.5,Infinity]) {
      assert.throws(()=>buildHornScene({sections}), RangeError);
    }
    for (const yaw of [Infinity,NaN,2]) assert.throws(()=>buildHornScene({yaw}),RangeError);
    assert.throws(()=>buildHornScene({width:0}),RangeError);
    assert.throws(()=>buildHornScene({height:10000}),RangeError);
    assert.throws(()=>buildHornScene({labels:[0,0]}),RangeError);
    assert.throws(()=>buildHornScene({labels:['+', '-']}),RangeError);
  }],
  ['display is deterministic and independent from physical measurement formulas', () => {
    const options={sections:32,yaw:.2,width:620,height:280,labels:[1,-1]};
    assert.deepEqual(buildHornScene(options),buildHornScene(options));
    const original=hornPrefix(32);
    buildHornScene(options);
    assert.deepEqual(hornPrefix(32),original);
  }],
];

let passed = 0;
for (const [name,run] of checks) {
  run();
  console.log('PASS ' + name);
  passed++;
}
console.log('NBG-HORN-A1 UI geometry ' + passed + '/' + checks.length
  + ' PASS · display-only projection / preserved formal model');
