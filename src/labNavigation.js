// NBG navigation contract: every previously visible route remains accessible.
// Groups are deliberately compact so the fixed header does not become a sitemap.
export const NAV_GROUPS=Object.freeze([
  {
    id:'labs',label:'Core Labs',items:[
      {label:'Bubble Atlas',href:'#atlas'},
      {label:'Spiral Gears',href:'#spiral-gears'},
      {label:'Phase & Closure',href:'#phase-closure'},
      {label:'Body Ship',href:'#body-ship'},
      {label:'Bio Bridge',href:'#biological-bridge'},
      {label:'Boundary Crossing',href:'#boundary-crossing'},
      {label:'Lineage Recovery',href:'#boundary-lineage'},
      {label:'Observatory',href:'#resonance-observatory'},
      {label:'Phase Dynamics',href:'#phase-dynamics'},
      {label:'Validation',href:'#independent-validation'},
    ]
  },
  {
    id:'recovery',label:'Recovery',items:[
      {label:'Balance & Recovery',href:'#balance-recovery'},
      {label:'Resilience Atlas',href:'#resilience-atlas'},
      {label:'Recovery Boundaries',href:'#recovery-robustness'},
      {label:'Model Recovery',href:'#model-recovery'},
      {label:'Discovery Loop',href:'#discovery-loop'},
    ]
  },
  {
    id:'geometry',label:'Geometry',items:[
      {label:'Geometry Keyhole',href:'#geometry-keyhole'},
      {label:'Dimensional Recovery',href:'#dimensional-recovery'},
      {label:'Noisy Keyhole',href:'#noisy-keyhole'},
    ]
  },
  {
    id:'keyholes',label:'Keyholes',items:[
      {label:'Keyholes Overview',href:'#keyholes'},
      {label:'Adaptive Phase',href:'#adaptive-phase'},
      {label:'Unknown Gear',href:'#unknown-gear'},
      {label:'QM1 Mining',href:'#qm1'},
      {label:'QM2 Trials',href:'#qm2'},
    ]
  },
])

export const NAV_DIRECT=Object.freeze([
  {label:'Stack',href:'#stack'},
  {label:'Temporal',href:'#temporal'},
  {label:'Experiments',href:'#experiments'},
  {label:'Claims',href:'#claims'},
  {label:'GitHub',href:'https://github.com/MichaelWave369/NestedBubbleGear',external:true},
])

// Fixed order determines visual reading order and keyboard tab order.
export const NAV_ORDER=Object.freeze([
  {type:'direct',href:'#stack'},
  {type:'group',id:'labs'},
  {type:'group',id:'recovery'},
  {type:'group',id:'geometry'},
  {type:'group',id:'keyholes'},
  {type:'direct',href:'#temporal'},
  {type:'direct',href:'#experiments'},
  {type:'direct',href:'#claims'},
  {type:'direct',href:'https://github.com/MichaelWave369/NestedBubbleGear'},
])

export const allNavigationItems=()=>[
  ...NAV_DIRECT,
  ...NAV_GROUPS.flatMap(group=>group.items),
]

export function groupForHash(hash){
  return NAV_GROUPS.find(group=>group.items.some(item=>item.href===hash))?.id??null
}
