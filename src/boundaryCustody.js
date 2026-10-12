// NBG-BC3 v0.1.0: algebraic signing / custody toy, NEVER production cryptography.
// Public and private keys are tiny, fixed, and deliberately disclosed in this file.
// This is a finite policy experiment, not reliable signatures or real genomic evidence.
export const BC3_PROTOCOL = Object.freeze({
  id: 'NBG-BC3', version: '0.1.0', origin: 'SIMULATED', authority: 'NONE',
  question: 'Can a syntactically valid, multi-signer provenance chain still support a false lineage claim?',
  motivationDOI: '10.1126/science.aeh3441',
  limitation: 'Fixed, public, tiny teaching keys. Signature checks are algebraic only; issuer independence and measurement truth are not verified.',
})

export const BC3_MODES = Object.freeze([
  'NO_EVIDENCE', 'UNSIGNED_CLAIM', 'SIGNED_SINGLE', 'DUPLICATED_SINGLE',
  'TAMPERED_SINGLE', 'DUAL_HONEST', 'DUAL_CONFLICT',
  'DUAL_COORDINATED_FALSE', 'UNKNOWN_ISSUER',
])

// Two toy RSA-like moduli. No security is claimed or implied.
// A: p=61, q=53, n=3233, e=17, d=2753
// B: p=47, q=59, n=2773, e=17, d=157
export const BC3_PUBLIC_ROOTS = Object.freeze({
  A: Object.freeze({n:3233,e:17}),
  B: Object.freeze({n:2773,e:17}),
})
const TOY_PRIVATE_EXPONENT = Object.freeze({A:2753,B:157})
const mask = value => Number.isInteger(value) && value >= 0 && value <= 3
const assertMask = (name,value) => {
  if (!mask(value)) throw new RangeError(name + ' must be an integer in 0..3')
}
function modPow(base,exponent,modulus) {
  let result=1, factor=base%modulus, remaining=exponent
  while (remaining > 0) {
    if (remaining%2===1) result=(result*factor)%modulus
    factor=(factor*factor)%modulus
    remaining=Math.floor(remaining/2)
  }
  return result
}
export function toySign(issuer,claim) {
  assertMask('claim',claim)
  const root=BC3_PUBLIC_ROOTS[issuer]
  if (!root) throw new RangeError('Unknown toy signer')
  return modPow(claim,TOY_PRIVATE_EXPONENT[issuer],root.n)
}
export function toyVerify(issuer,claim,signature) {
  const root=BC3_PUBLIC_ROOTS[issuer]
  if (!root || !mask(claim) || !Number.isInteger(signature) || signature<0 || signature>=root.n) return false
  return modPow(signature,root.e,root.n) === claim
}
export const makeBC3World = ({source,edit}) => {
  assertMask('source',source)
  assertMask('edit',edit)
  return {truth:{source,edit},payload:source^edit}
}
export const enumerateBC3Worlds = () =>
  [0,1,2,3].flatMap(source => [0,1,2,3].map(edit=>makeBC3World({source,edit})))

function signed(issuer,claim) { return {issuer,claim,signature:toySign(issuer,claim)} }
export function observeBC3(world,mode='NO_EVIDENCE') {
  if (!BC3_MODES.includes(mode)) throw new RangeError('Unknown BC3 scenario')
  if (!world || JSON.stringify(world)!==JSON.stringify(makeBC3World(world.truth)))
    throw new TypeError('Inconsistent model world')
  const edit=world.truth.edit, falseEdit=edit^1
  const a=signed('A',edit), b=signed('B',edit)
  const forgedA=signed('A',falseEdit), forgedB=signed('B',falseEdit)
  let records=[]
  if (mode==='UNSIGNED_CLAIM') records=[{issuer:'A',claim:edit,signature:null}]
  if (mode==='SIGNED_SINGLE') records=[a]
  if (mode==='DUPLICATED_SINGLE') records=[a,{...a}]
  if (mode==='TAMPERED_SINGLE') records=[{...a,claim:falseEdit}]
  if (mode==='DUAL_HONEST') records=[a,b]
  if (mode==='DUAL_CONFLICT') records=[forgedA,b]
  if (mode==='DUAL_COORDINATED_FALSE') records=[forgedA,forgedB]
  if (mode==='UNKNOWN_ISSUER') records=[a,{issuer:'C',claim:edit,signature:17}]
  return {payload:world.payload,records}
}
function validateView(view) {
  if (!view || typeof view !== 'object' || Array.isArray(view)
    || Object.keys(view).sort().join(',') !== 'payload,records')
    throw new TypeError('BC3 observer accepts only payload and records')
  assertMask('payload',view.payload)
  if (!Array.isArray(view.records) || view.records.length>8)
    throw new TypeError('Invalid evidence bundle')
  for (const item of view.records) {
    if (!item || typeof item!=='object' || Array.isArray(item) ||
      Object.keys(item).sort().join(',')!=='claim,issuer,signature' ||
      typeof item.issuer!=='string') throw new TypeError('Invalid evidence record')
    assertMask('claim',item.claim)
    if (item.signature !== null && (!Number.isInteger(item.signature) || item.signature<0))
      throw new TypeError('Invalid signature format')
  }
}
// Evaluates ONLY the observer-facing bundle. No hidden ground truth, signing secret,
// original edit, or author-intent flag enters this function.
export function adjudicateBC3(view) {
  validateView(view)
  const fallback=[0,1,2,3]
  const refusal=(status,extra={})=>({
    status, admittedSource:null, candidates:fallback, quorum:false,
    acceptedRoots:0, duplicatesCollapsed:0, ...extra,
  })
  if (!view.records.length) return refusal('REFUSE_NO_EVIDENCE')
  for (const row of view.records) {
    if (!BC3_PUBLIC_ROOTS[row.issuer]) return refusal('REFUSE_UNKNOWN_ISSUER')
    if (row.signature===null) return refusal('REFUSE_UNSIGNED')
    if (!toyVerify(row.issuer,row.claim,row.signature)) return refusal('REFUSE_INVALID_SIGNATURE')
  }
  const byIssuer=new Map()
  let duplicatesCollapsed=0
  for (const row of view.records) {
    const earlier=byIssuer.get(row.issuer)
    if (earlier) {
      if (earlier.claim!==row.claim || earlier.signature!==row.signature) {
        return refusal('REFUSE_CONFLICT', {candidates:[], acceptedRoots:byIssuer.size, duplicatesCollapsed})
      }
      duplicatesCollapsed++
    } else byIssuer.set(row.issuer,row)
  }
  const records=[...byIssuer.values()]
  const claims=new Set(records.map(row=>row.claim))
  if (claims.size!==1) return refusal('REFUSE_CONFLICT',{
    candidates:[],acceptedRoots:records.length,duplicatesCollapsed,
  })
  const claimedEdit=records[0].claim
  const soleCandidate=view.payload^claimedEdit
  if (records.length<2) return refusal('REFUSE_QUORUM',{
    candidates:[soleCandidate],acceptedRoots:records.length,duplicatesCollapsed,
    mathematicalSource:soleCandidate,
  })
  return {
    status:'ACCEPT_TOY_QUORUM',admittedSource:soleCandidate,
    candidates:[soleCandidate],quorum:true,
    acceptedRoots:records.length,duplicatesCollapsed,
    mathematicalSource:soleCandidate,
  }
}
export function analyzeBC3() {
  const worlds=enumerateBC3Worlds()
  return {
    worlds:worlds.length,
    evaluations:worlds.length*BC3_MODES.length,
    rows:BC3_MODES.map(mode=>{
      const outcomes=worlds.map(world=>{
        const observer=adjudicateBC3(observeBC3(world,mode))
        return {observer,truth:world.truth}
      })
      const admitted=outcomes.filter(x=>x.observer.quorum)
      return {
        mode,total:outcomes.length,
        accepted:admitted.length,
        correct:admitted.filter(x=>x.observer.admittedSource===x.truth.source).length,
        falseAccepted:admitted.filter(x=>x.observer.admittedSource!==x.truth.source).length,
        refused:outcomes.length-admitted.length,
        statuses:[...new Set(outcomes.map(x=>x.observer.status))],
        duplicateCollapsed:outcomes.every(x=>x.observer.duplicatesCollapsed === (mode==='DUPLICATED_SINGLE'?1:0)),
      }
    }),
  }
}
export function buildBC3Receipt(config={source:0,edit:0,mode:'NO_EVIDENCE'}) {
  if (!config || typeof config!=='object' || Array.isArray(config) ||
    Object.keys(config).sort().join(',')!=='edit,mode,source') throw new TypeError('Explicit BC3 config required')
  const world=makeBC3World(config)
  const observation=observeBC3(world,config.mode)
  const verdict=adjudicateBC3(observation)
  return {
    protocol:BC3_PROTOCOL,origin:'SIMULATED',authority:'NONE',
    selected:{
      mode:config.mode,observation,verdict,
      // Scoring truth deliberately excluded from adjudicateBC3 input.
      scoringTruth:world.truth,
      correctWhenAccepted:verdict.quorum ? verdict.admittedSource===world.truth.source : null,
    },
    census:analyzeBC3(),
    interpretation:'Toy signature validity and credential quorum do not establish independent measurements or truth. Two mutually valid forged records can still pass.',
  }
}
