import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {NAV_GROUPS,NAV_DIRECT,NAV_ORDER,allNavigationItems,groupForHash} from '../src/labNavigation.js'

const LEGACY_DESTINATIONS=[
 '#stack','#atlas','#spiral-gears','#phase-closure','#body-ship',
 '#biological-bridge','#resonance-observatory','#phase-dynamics',
 '#balance-recovery','#resilience-atlas','#recovery-robustness',
 '#geometry-keyhole','#dimensional-recovery','#noisy-keyhole',
 '#independent-validation','#adaptive-phase','#unknown-gear',
 '#model-recovery','#discovery-loop','#qm1','#qm2','#keyholes',
 '#temporal','#experiments','#claims',
 'https://github.com/MichaelWave369/NestedBubbleGear'
]
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
const jsx=readFileSync(new URL('../src/LabNavigation.jsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/labNavigation.css',import.meta.url),'utf8')
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8')

let count=0
const test=(name,fn)=>{fn();count++;console.log('PASS '+name)}
test('all twenty-six original navigation destinations are preserved exactly once',()=>{
 const observed=allNavigationItems().map(item=>item.href)
 assert.equal(observed.length,LEGACY_DESTINATIONS.length+8)
 assert.equal(observed.filter(href=>href==='#research-atlas').length,1,'research atlas top-level route')
 for(const legacy of LEGACY_DESTINATIONS)assert.equal(observed.filter(href=>href===legacy).length,1,'legacy route: '+legacy)
 assert.equal(observed.filter(href=>href==='#boundary-crossing').length,1,'new BC1 route')
 assert.equal(observed.filter(href=>href==='#boundary-lineage').length,1,'new BC2 route')
 assert.equal(observed.filter(href=>href==='#boundary-custody').length,1,'new BC3 route')
 assert.equal(observed.filter(href=>href==='#horn-a1').length,1,'new HORN-A1 route')
 assert.equal(observed.filter(href=>href==='#ni1').length,1,'NI1 neuroimmune lab route')
 assert.equal(observed.filter(href=>href==='#ni1-e1b').length,1,'NI1 E1B causal collision route')
 assert.equal(new Set(observed).size,observed.length)
})
test('all navigation entries have usable nonblank human labels',()=>{
 for(const item of allNavigationItems()){
  assert.ok(typeof item.label==='string'&&item.label.length>2)
  assert.ok(item.href.startsWith('#')||item.href.startsWith('https://'))
 }
})
test('top bar contains no more than nine visible destinations',()=>{
 assert.equal(NAV_ORDER.length,9)
 assert.equal(NAV_ORDER.filter(x=>x.type==='group').length,4)
 assert.equal(NAV_ORDER.filter(x=>x.type==='direct').length,5)
})
test('groups have unique IDs and contain every targeted destination',()=>{
 assert.equal(new Set(NAV_GROUPS.map(g=>g.id)).size,NAV_GROUPS.length)
 for(const group of NAV_GROUPS){
  assert.ok(group.items.length>=3)
  for(const item of group.items)assert.equal(groupForHash(item.href),group.id)
 }
 assert.equal(groupForHash('#experiments'),'labs')
 assert.equal(groupForHash('#temporal'),null)
 assert.equal(groupForHash('#not-real'),null)
})
test('ordered top-level menu routes have no missing model references',()=>{
 const groupIds=new Set(NAV_GROUPS.map(g=>g.id))
 const directHrefs=new Set(NAV_DIRECT.map(x=>x.href))
 for(const item of NAV_ORDER){
  assert.ok(item.type==='group'?groupIds.has(item.id):directHrefs.has(item.href))
 }
 assert.equal(new Set(NAV_ORDER.map(x=>x.id??x.href)).size,NAV_ORDER.length)
})
test('all page section links have existing matching section IDs in source',()=>{
 // Every existing original hash link must target a real component or App section.
 const tree=[
  app,
  readFileSync(new URL('../src/ResearchAtlas.jsx',import.meta.url),'utf8'),
  ...[
   'SpiralGearLab.jsx','PhaseClosureLab.jsx','BodyShipResonanceLab.jsx',
   'BiologicalOscillatorBridge.jsx','BiomechanicalCrystalBridge.jsx','NI1Lab.jsx','NI1CollisionLab.jsx','BoundaryCrossingLab.jsx','BoundaryLineageLab.jsx','BoundaryCustodyLab.jsx',
   'ResonanceObservatory.jsx',
   'PhaseDynamicsLab.jsx','BalanceRecoveryLab.jsx','ResilienceAtlas.jsx',
   'RecoveryRobustnessLab.jsx','GeometryKeyholeLab.jsx','HornA1Lab.jsx',
   'DimensionalRecoveryLab.jsx','NoisyKeyholeLab.jsx',
   'IndependentSignalValidationLab.jsx','AdaptivePhaseKeyhole.jsx',
   'UnknownGearLab.jsx','ModelMismatchRecoveryLab.jsx',
   'DiscoveryLoop.jsx','QM1Lab.jsx','QM2Lab.jsx'
  ].map(name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8'))
 ].join('\n')
 for(const {href} of allNavigationItems()){
  if(!href.startsWith('#'))continue
  const id=href.slice(1)
  const exact=new RegExp('id=["\\u0027]'+id+'["\\u0027]')
  assert.match(tree,exact,'missing target: '+href)
 }
})
test('interactive navigation exposes escape, outside click, expanded and current states',()=>{
 for(const snippet of ['aria-expanded','aria-controls','aria-current','pointerdown',"'Escape'",'hashchange','closeMenus','onClick']){
  assert.ok(jsx.includes(snippet),'missing '+snippet)
 }
 assert.ok(jsx.includes('noopener noreferrer'),'external new-tab needs noopener')
})
test('CSS contains reliable narrow-screen menu and hidden submenu guard',()=>{
 for(const snippet of ['.lab-nav-mobile-toggle','.lab-nav-links.is-open','.lab-nav-dropdown[hidden]','focus-visible','max-height:calc(100dvh','@media(max-width:1150px)']){
  assert.ok(css.includes(snippet),'missing '+snippet)
 }
 assert.ok(!styles.includes('.nav nav a:not(:last-child)'),'legacy mobile hidden-links rule survives')
})
test('App installs one navigation component rather than old 26-link bar',()=>{
 assert.equal((app.match(/<LabNavigation\s*\/>/g)||[]).length,1)
 assert.equal((app.match(/<header className="nav">/g)||[]).length,0)
})
console.log('NBG-NAV '+count+'/'+count+' PASS · catalog, destinations, responsiveness and semantics')
