import { useMemo, useState } from 'react'
import {
  RELATION_OPTIONS,
  STATUS_OPTIONS,
  TEMPORAL_BASE_DIGEST,
  ambiguityQueue,
  buildTemporalExport,
  compareTemporalViews,
  deriveTemporalView,
  provenanceBundle,
} from './temporalKeyhole.js'
import {
  T8_FROZEN_DECISIONS,
  applyQueueDecision,
  buildQueueExport,
  deriveQueueStatus,
  queueRows,
} from './evidenceReviewQueue.js'
import {
  buildGovernanceExport,
  compareGovernanceKeyholes,
  governanceKeyhole,
  governanceTimeline,
} from './governanceKeyholes.js'
import {
  COUNTERFACTUAL_OPTIONS,
  buildCounterfactualExport,
  counterfactualComparison,
  firstOutcomeDivergence,
} from './counterfactualGovernance.js'
import {
  buildSensitivityAtlas,
  buildSensitivityExport,
  minimalRejectedSingletons,
} from './governanceSensitivity.js'

const stack = [
  { mark: 'B', name: 'NBG', title: 'Domains + interfaces', text: 'Defines where state lives, how domains nest, and where constrained interfaces exist.' },
  { mark: '→', name: 'Conveyor', title: 'Between-step state', text: 'Treats transport itself as a first-class object carrying symbol, frame, polarity, residue, flux, and provenance.' },
  { mark: 'G', name: 'Gear', title: 'Ordered recurrence', text: 'Captures cycle current and ordered transformation. Same ingredients can produce different outcomes when order matters.' },
  { mark: 'A', name: 'Altermath', title: 'Causal structure behind zero', text: 'Studies distinctions erased by a coarse cancellation map but retained in future behavior.' },
  { mark: '◉', name: 'Keyholes', title: 'Observer projections', text: 'Specifies what a given observer can distinguish now, and what a deeper probe may reveal later.' },
  { mark: 'Φ', name: 'Φ-System', title: 'Convergence control', text: 'Separates fixed, periodic, steady-throughput, behavioral, and provenance convergence.' },
  { mark: '#', name: 'Ledger', title: 'Replayable provenance', text: 'Records how state was produced so identical outputs need not imply identical causal histories.' },
]

const experiments = [
  { id:'AH2', title:'Latent causal residue', checks:'29/29', tests:'6/6', verdict:'PASS_AH2', hash:'55e243b9e78a5884284a54bf431537af6d1d1793da3601cddb5b2e31bc10d7f3', result:'Present observational equivalence does not determine whether a hidden difference is inert, erased, or latent.', info:'I(X₀;T|Y₀) = log₂(6) = 2.584962500721155 bits' },
  { id:'AH3', title:'Boundary-transferred residue', checks:'89/89', tests:'7/7', verdict:'PASS_AH3', hash:'13143744580f1f44cf482b59a457effacc6b043a2eabeb12c83f37f079ccc86f', result:'An explicit boundary relation r = p·s carries the missing predictive bit and supports exact ancestry recovery.', info:'I(p;T|parent) = 1 bit' },
  { id:'AH4', title:'Two-interface holonomy', checks:'44/44', tests:'8/8', verdict:'PASS_AH4', hash:'e5b9ebea0b9e30b52dae3fc9167ccb1da021df872f1aa3dafb676d77ec1a69bf', result:'Two return paths share the same visible endpoint and path product while retaining different hidden phase.', info:'I(endpoint;T)=0 · I(path product;T)=0 · I(phase;T)=1 bit' },
  { id:'AH5', title:'Noncommuting order', checks:'36/36', tests:'8/8', verdict:'PASS_AH5', hash:'88df41892f5d16068cb323657275ad8ec6dcb0c7951ed9f0c278ab0f991d4141', result:'Same interfaces and same coarse endpoint retain different causal residue when the interface order changes.', info:'I(order;T|Y) = 1 bit · unordered inventory = 0 bits' },
  { id:'AH6', title:'Closed commutator loop', checks:'41/41', tests:'9/9', verdict:'PASS_AH6', hash:'912a0c2df491480fe632dc03ae5f00bff7a133da2cc9d687b5f7b8c05e3aa5fb', result:'A closed loop returns the declared observable while leaving nonzero full-state loop residue.', info:'π(Lx)=π(x) while Lx≠x' },
  { id:'AH7', title:'Oriented cancellation', checks:'65/65', tests:'9/9', verdict:'PASS_AH7', hash:'7b2afc2b9e5d8c1a4c6762e352e22fb4ddaa04d7ee98a7c4b79ab24c3976666c', result:'CW and CCW loops are coarse-identical, retain different residues, and exactly cancel under inverse composition.', info:'T = S·R · exact inverse cancellation' },
  { id:'AH8', title:'Plaquette transport', checks:'63/63', tests:'10/10', verdict:'PASS_AH8', hash:'bccba3c5dbeb43ef6f55cedcac20d622d3e75e157a6ff9a206f00abc7ef1e603', result:'Two local plaquettes are individually nontrivial while the complete outer boundary is exactly trivial.', info:'K_L≠0 · K_R≠0 · K_outer=0' },
  { id:'AH9', title:'Basepoint transport', checks:'106/106', tests:'10/10', verdict:'PASS_AH9', hash:'9c1280b6d63bb0164d305a4e7e4c99a3601512c5c57f064be07200933782bb29', result:'Local loop operators based at different vertices compose correctly only after transport to a common basepoint.', info:'G∂=(TBT⁻¹)A · naive BA is valid iff TB=BT' },
  { id:'AH10', title:'Three-plaquette transport', checks:'158/158', tests:'11/11', verdict:'PASS_AH10', hash:'596a4295a05381b0cb24224b98157787859e70925e40623a67d4ab16879f5df0', result:'Three local loops reconstruct the direct outer boundary exactly when cumulative connector paths are retained; both transported parenthesizations agree.', info:'G∂=(T₁T₂)C(T₁T₂)⁻¹(T₁BT₁⁻¹)A · naive CBA succeeds 1/16' },
  { id:'AH11', title:'Minimal connector memory', checks:'34/34', tests:'12/12', verdict:'PASS_AH11', hash:'8838f3ac961079f17b1e39cd6d9ab8b288119584388448da56721bfd867f37cc', result:'Full path history compresses to a task-specific causal residue that preserves the global operator exactly.', info:'H(G|RΓ)=0 · H(G|P₂)=0.25 bits · same entropy, different sufficiency' },
  { id:'AH12', title:'Task-dependent memory', checks:'35/35', tests:'13/13', verdict:'PASS_AH12', hash:'6bb16f7c3d61202a50c885e3e70c399f7a871f59929143ebb9ceba839669ae4c', result:'The coarsest sufficient retained residue changes when the permitted future query family changes.', info:'Q_G→13 classes · Q_ALL→15 classes · H(H₂|RΓ)=0.25 bits' },
  { id:'AH13', title:'Authorized query memory', checks:'41/41', tests:'15/15', verdict:'PASS_AH13', hash:'8c204d74ae76c1ae783759060b377fa4044145c7405dc680b88d790fb9cd4e76', result:'Restricted roles retain coarser sufficient memory than full capability memory while preserving every authorized answer.', info:'CAPABILITY ≠ AUTHORITY · selected role memory has zero excess unauthorized leakage above the correlation floor' },
  { id:'AH14', title:'Revocation + memory downgrade', checks:'43/43', tests:'15/15', verdict:'PASS_AH14', hash:'921d4e091984fb8d3122d35d2e25f05d436eff2dd9659dd90ea3e968bdb0aa0e', result:'Full-capability memory deterministically downgrades to role-specific memory while preserving authorized answers; an old-state hash receipt defeats minimization in the tiny enumerable domain.', info:'permission revoked ≠ memory downgraded ≠ secure erasure · H(revoked|new)>0 · H(revoked|new,old-hash)=0' },
  { id:'AH15', title:'Revocation chains', checks:'21/21', tests:'15/15', verdict:'PASS_AH15', hash:'69aee683f5ce416169dab5c7aa51d8b157cda6fab08002c16f568ff4e5bb47dd', result:'Monotone downgrade is path-independent, while lateral reauthorization can be blocked after prior forgetting; intermediate receipts can preserve distinctions later revoked.', info:'FULL→P₂→H₃ = FULL→H₃ · H(P₂|RΓ)=0.25 · H(P₂|H₃,R_mid)=0' },
  { id:'AH16', title:'External authority reauthorization', checks:'43/43', tests:'15/15', verdict:'PASS_AH16', hash:'3314bc18b7c21dee9acee4134b008fab4136de06ec32eb5387d1a7331fdb8c70', result:'A higher-authority store resolves local reauthorization barriers while releasing only the newly authorized role memory instead of full capability state.', info:'H(Qnew|Dlocal)>0 · H(Qnew|Dlocal,Descrow)=0 · minimal handoff has zero excess leakage' },
  { id:'AH17', title:'Split authority parallax', checks:'28/28', tests:'13/13', verdict:'PASS_AH17_QUALIFIED', hash:'8198df521b365e42df6e9d1930cf6891885ad576d4d34b0a36893204e14baabe', result:'Two individually insufficient authority Keyholes jointly reconstruct the newly authorized distinction; only the target-role residue is released.', info:'H(Q|local,E₁)>0 · H(Q|local,E₂)>0 · H(Q|local,E₁,E₂)=0' },
  { id:'AH18', title:'Quorum topology', checks:'51/51', tests:'14/14', verdict:'PASS_AH18_QUALIFIED', hash:'93a22673cc736da2374212f29dfde2ea70163cfe6faeb9dac92e1e023cfa2f68', result:'Equal-sized authority coalitions can have different reconstruction power; quorum depends on coalition information topology, not just member count.', info:'capable pairs {E₁,E₂},{E₂,E₃} · {E₁,E₃} insufficient · coalition CAPABILITY ≠ AUTHORITY' },
  { id:'AH19', title:'Authority access structures', checks:'65/65', tests:'15/15', verdict:'PASS_AH19_QUALIFIED', hash:'8c54b738c032f9439ee70b27cbc40ab2ad2e988c71f36bbbd3964a53e289fd60', result:'The complete coalition lattice is enumerated task-by-task, recovering upward-closed capability families, exact minimal coalitions, mandatory cores, and stricter policy subfamilies.', info:'A_Q={C:H(Q|Dlocal,C)=0} · full tasks core={E₂} · coarse alarm core=∅' },
  { id:'AH20', title:'Keyhole criticality + resilience', checks:'68/68', tests:'15/15', verdict:'PASS_AH20_QUALIFIED', hash:'0ef62e3bda4ed70b4034536261742e7799b897715b2f56bc0144a59685202060', result:'Minimal failure cuts expose the difference between mathematical redundancy and the narrower resilience of policy-authorized coalition families.', info:'full capability cuts {E₂},{E₁,E₃} · policy can add singleton cuts · Rcap(p)≠Rpolicy(p)' },
  { id:'AH21', title:'Policy hardening synthesis', checks:'64/64', tests:'16/16', verdict:'PASS_AH21_QUALIFIED', hash:'21c2384c3859c3e7b2025bad565464d465a7cba175537f31b5a88a588e29de29', result:'Policy fragility is repaired by exhaustive constrained synthesis of the smallest legal coalition expansion that removes policy-created singleton cuts.', info:'one coalition added per task · alarm 0.900→0.981→0.990 while singleton E₁ remains denied' },
  { id:'AH22', title:'Costed Pareto policy synthesis', checks:'44/44', tests:'15/15', verdict:'PASS_AH22_QUALIFIED', hash:'0949fe80fa8efcb700495f470b13067a5d3eddda8890df63f865a8b28d90f257', result:'Governance cost, fragility, and reliability are exposed as a Pareto frontier instead of collapsed into one opaque optimization score.', info:'alarm frontier cost/reliability: 0→0.900 · 1→0.981 · 5→0.990 · expensive ≠ forbidden' },
  { id:'AH23', title:'Robust Pareto under uncertainty', checks:'41/41', tests:'15/15', verdict:'PASS_AH23_QUALIFIED', hash:'e08c6fe8b99005266b27b050d2cff40abe40441086106d0e904ecf60147116d4', result:'The AH22 policy frontier is stress-tested across six common failure-rate scenarios using worst-case reliability and maximum regret without changing frontier membership.', info:'p=0.05…0.30 · alarm worst R: 0.700→0.847→0.910 · no frontier membership reversal' },
  { id:'AH24', title:'Heterogeneous + correlated failure', checks:'36/36', tests:'15/15', verdict:'PASS_AH24_QUALIFIED', hash:'3332f110ed88725aa85cc78c7adcf1894ed2fa0c202dc2bc4c4d6ec2150294e9', result:'Coalition rankings reverse when hazards move between Keyholes, while matched component marginals hide a large common-cause penalty to redundancy.', info:'E1-fragile: P23>P12 · E3-fragile: P12>P23 · P_BOTH 0.84816→0.7182 under matched-marginal correlation' },
  { id:'AH25', title:'Failure-domain discovery', checks:'30/30', tests:'15/15', verdict:'PASS_AH25_QUALIFIED', hash:'b69abe7de90d36e51761ae84b000c42fbe30ce076256f8514fd60f3ada92b826', result:'Joint failure traces expose hidden coupling that identical marginal dashboards erase, while sparse data is allowed to remain insufficient evidence.', info:'same marginals 0.24/0.24 · observed dual R 0.84816 vs 0.71820 · refusal state preserved' },
  { id:'AH26', title:'Sequential failure auditing', checks:'24/24', tests:'15/15', verdict:'PASS_AH26_QUALIFIED', hash:'e50134c237b39c915f7b6de9d1e2b33810654bd3a6d3bb7bd59e6db7455bd6e9', result:'Raw evidence and governed warning state are separated by a deterministic persistence rule, preventing one-batch escalation and clearing.', info:'raw: insufficient→compatible→common→common→compatible→compatible · governed activation B4 / clear B6' },
  { id:'AH27', title:'Horizon-indexed evidence memory', checks:'25/25', tests:'15/15', verdict:'PASS_AH27_QUALIFIED', hash:'04887caffce20956cb152c8c1b1a0f025173d22dfef5416f91a8741d506f5480', result:'Lifetime, recent-window, and discounted memories answer different temporal queries; identical lifetime aggregates can conceal different recent-hazard states.', info:'same lifetime table · H_A recent=compatible · H_B recent=common-mode · R_{Q,τ}(Γ)' },
  { id:'AH28', title:'Multi-horizon evidence governance', checks:'23/23', tests:'15/15', verdict:'PASS_AH28_QUALIFIED', hash:'796f37bb9f6d1254f466f600b2bc715c1b4260e689fcd63c4da6cec3aba3f531', result:'Evidence claims are horizon-scoped: lifetime, recent, and adaptive memories can disagree, and missing-horizon requests are refused rather than silently defaulted.', info:'v0.1.0 failed 22/23 · v0.1.1 qualified · recent-risk / lifetime-risk / horizon-conflict arbitration · no unqualified SAFE semantics' },
  { id:'AH29', title:'Horizon authorization + least privilege', checks:'23/23', tests:'15/15', verdict:'PASS_AH29_QUALIFIED', hash:'2a956faf23276108ee34f3b6bc06381577c0ad95ea426b6985bd353f48fe8f04', result:'Evidence capability and evidence authority are separated by role-scoped horizon releases, with explicit refusal receipts and finite residual-uncertainty checks.', info:'H(M|AUDITOR)=0.393555 bits · H(M|TRI)=0 · Q_MULTI denied yet derivable from three authorized singles' },
  { id:'AH30', title:'Derivation-closed authority', checks:'31/31', tests:'15/15', verdict:'PASS_AH30_QUALIFIED', hash:'bf5afaf15f8c14cb819f327135191ab9c3e3f0fd20db0543dc4b1ccd6a34b664', result:'Direct grants are closed under deterministic derivation before denies are audited; a constrained synthesizer finds the smallest release reduction that makes a deny informationally meaningful.', info:'TRI: direct {L,R,A}, effective {L,R,A,M} · preserve L+R → remove A · H(M|L,R)=0.393555 bits' },
  { id:'AH31', title:'Collusion closure & coalition authority', checks:'26/26', tests:'15/15', verdict:'PASS_AH31_QUALIFIED', hash:'ee575cf98954b50814013b8d37d9b905d74781c52b2d71d44b4979578dee6562', result:'Individually derivation-safe actors can pool authorized horizon releases into effective Q_MULTI authority; the complete coalition access structure and cut sets are enumerated exactly.', info:'16 coalitions · 5 dangerous · minimal {Adaptive,Auditor} / {Historian,Operator,Adaptive} · mandatory core Adaptive · 0/9 coverage-preserving configs grand-safe' },
  { id:'AH32', title:'Coalition-safe release design', checks:'30/30', tests:'15/15', verdict:'PASS_AH32_QUALIFIED', hash:'0e160f2b5cd75d9859f03bca97e28e813174ad0ebf610693c403dd2d28518a5a', result:'Task-sufficient coarsening preserves every frozen actor task while preventing exact Q_MULTI reconstruction by the unrestricted grand coalition.', info:'32 designs · 8 safe · unique minimum coarsens both lifetime carriers · residual 0.285714 bits' },
  { id:'AH33', title:'Task richness / privacy frontier', checks:'39/39', tests:'15/15', verdict:'PASS_AH33_QUALIFIED', hash:'2561ffdd7b59e2d364036d963a7448c47f492e77bdda3a74a158034e49b0c046', result:'Richer authorized task partitions monotonically consume grand-coalition residual uncertainty; FULL_STATUS makes the frozen Q_MULTI target exactly reconstructible.', info:'10 panels · 243 designs · safe counts COMMON/TRIAGE/FULL = 106/4/0 · privacy 1.160964→0.4→0 bits' },
  { id:'AH34', title:'Mixed task profiles & privacy budgets', checks:'49/49', tests:'15/15', verdict:'PASS_AH34_QUALIFIED', hash:'c55b9d7514258070e44772b7a4aa255a41f10960c3805dfa1c403310e8ce6f97', result:'Mixed per-grant task upgrades expose a non-smooth privacy landscape: some upgrades are free, while specific distinction combinations abruptly reconstruct the denied target.', info:'243 profiles · 106 positive / 137 zero privacy · min collapse score 3 · max safe score 7 · ε=0.4 gives 2 co-optima' },
  { id:'AH35', title:'Upgrade access structures', checks:'29/29', tests:'15/15', verdict:'PASS_AH35_QUALIFIED', hash:'f1747ecd8ec7d2ebecc4a1645b00ba77d13313474c9ec6473e681c32448e653f', result:'Privacy-critical task refinements form an upward-closed access structure with exact minimal collapse paths and cut sets; structure-aware denies preserve richer safe task allocations than a scalar richness cap.', info:'v0.1.0 failed ordering-only 28/29 · 10 minimal collapse sets · 12 cuts · min cut {H_L:T,U_L:T} · max safe richness 6 under 2-atom cut' },
  { id:'AH36', title:'Dynamic revocation + privacy restoration', checks:'31/31', tests:'15/15', verdict:'PASS_AH36_QUALIFIED', hash:'6beec0a30dbcf30599f0b40acfa5069de60cbef9d2674b55ff6892698a1c2efd', result:'Revocation changes prospective authority before it changes already-materialized disclosure; explicit downgrade restores current-view privacy while the append-only historical ledger remains fully informative.', info:'authority/current/ledger privacy diverge at revocation · fresh observer 0.4 bits · historical observer 0 bits' },
  { id:'AH37', title:'Epoch-scoped forward privacy', checks:'18/18', tests:'15/15', verdict:'PASS_AH37_QUALIFIED', hash:'4d86623914433a211f0c58de0d619207ba302c260c961b3944efde6baf0487a7', result:'Epoch rotation creates a forward privacy boundary for fresh observers only when old panel-dependent disclosure stays behind the boundary; a deterministic public digest can reopen the old distinctions in the tiny enumerable domain.', info:'fresh E1 0.4 bits · legacy 0 · public SHA256(E0)+E1 0 · metadata-only seal+E1 0.4 · 9 digest classes' },
  { id:'AH38', title:'Hiding commitments + key scope', checks:'24/24', tests:'15/15', verdict:'PASS_AH38_QUALIFIED', hash:'642f6314feeabb88e5de561fa079dbf3b53de4fc979b321bc7e158f496e3858c', result:'Public verifier artifacts can reopen old distinctions when their candidate domains are enumerable; mediated verification preserves the fresh observer boundary by releasing only a panel-independent result.', info:'fresh/mediated 0.4 bits · public digest/salt 0 · 8-key HMAC 0 · 8-salt digest 0 · large-key entropy claim REFUSED' },
  { id:'AH39', title:'Delayed key disclosure + authenticator history', checks:'26/26', tests:'15/15', verdict:'PASS_AH39_QUALIFIED', hash:'201995fa332e80b7c4f9aa9a17721ed24a1b028217809185ac20905ea40d4340', result:'Key authority changes compose with authenticator history: later key disclosure does not recreate a withheld tag, while releasing that panel-dependent tag into key-bearing history collapses the frozen target.', info:'fresh 0.4 · public tag pre/post key 0 · key + mediated VERIFIED with tag withheld 0.4 · late tag release 0 · key-revoke history persists' },
  { id:'AH40', title:'Split verification authority + threshold declassification', checks:'27/27', tests:'15/15', verdict:'PASS_AH40_QUALIFIED', hash:'64d327e566d4f9dcf5df7a3d4c81da6cd944b99a40a20eedd533cc721cb5d16b', result:'A 2-of-3 verifier quorum can establish old-epoch validity without publishing the old evidence; only the separate 3-of-3 declassification action releases Epoch 0 and collapses the public observer privacy boundary.', info:'VERIFY_ONLY 4/8 coalitions @ 0.4 bits · DECLASSIFY 1/8 @ 0 bits · full coalition verify-only still 0.4 · debug tag control 0' },
  { id:'AH41', title:'Verifier compromise + role fusion', checks:'29/29', tests:'15/15', verdict:'PASS_AH41_QUALIFIED', hash:'99625d4003a6d7c98ac1a57aee4a3f5857e4fb348d819967bba08128ed1d3133', result:'Logical quorum counts can overstate independent physical control: fusing seats A+B drops verification from two principals to one and strict declassification from three principals to two.', info:'thresholds verify 2→1 · strict declass 3→2 · weak control 2→1 · p=.1 verify R .972→.900 · strict declass R .729→.810' },
  { id:'AH42', title:'Independence certification + hidden common control', checks:'44/44', tests:'16/16', verdict:'PASS_AH42_QUALIFIED', hash:'9b30f815b1d4885e79e39c5aa4fb7a0ccf01862a6845074d935c7ac4093e4725', result:'Independence is treated as an evidence-bearing claim: complete distinct root-control evidence certifies three domains, observed A+B sharing exposes hidden common control, and incomplete evidence refuses optimistic quorum claims.', info:'3 seats + 3 names in every scenario · certified roots -> thresholds 2/3 · shared A+B -> 1/2 · incomplete evidence -> INDEPENDENCE_UNVERIFIED' },
  { id:'AH43', title:'Independence evidence decay + certificate expiry', checks:'30/30', tests:'15/15', verdict:'PASS_AH43_QUALIFIED', hash:'0cb2df772e4e5e0b49a423134f998fd82226e7840360039a309ed12d5f0ecb41', result:'Independence evidence now has a freshness horizon: stale certificates stop advertising old quorum claims, while the hidden-fusion control proves that a policy-fresh certificate can briefly outlive a changed control topology.', info:'TTL=2 · hidden fusion at t2 while cert still fresh · actual thresholds 2/3→1/2 · t3 STALE refusal · t4 SHARED_CONTROL_OBSERVED · TTL sensitivity 0/0/1/2' },
  { id:'AH44', title:'Event-driven independence revocation + change detection', checks:'35/35', tests:'15/15', verdict:'PASS_AH44_QUALIFIED', hash:'2ca9bd2c0446c7e845b8fe98b589fbaa008872fafb8c6d0d7c3a2d0b79640c6e', result:'Trusted immediate change events revoke a stale independence claim at the same epoch as hidden A+B fusion, eliminating the frozen false-advertisement window without pretending to know the replacement topology.', info:'TTL-only 1 false epoch · trusted immediate 0 · delayed/missing/untrusted 1 · false positive 2 conservative refusal epochs · next phase meta-qualification' },
]


const bubbleFamilies = [
  { id: 'nested', mark: '◎', name: 'Nested', subtitle: 'Domains inside domains', equation: 'B₀ ⊃ B₁ ⊃ B₂', text: 'Tracks ancestry, coarse/fine state, and which distinctions survive projection across nesting levels.', evidence: 'Core NBG architecture' },
  { id: 'boundary', mark: 'Σ', name: 'Boundary', subtitle: 'Interface as state', equation: 'B = (X, Σ)', text: 'Treats the boundary itself as an active encoder, eraser, polarity carrier, or adaptive transport surface.', evidence: 'AH3 · boundary transfer' },
  { id: 'gear', mark: 'G', name: 'Gear', subtitle: 'Recurrence + circulation', equation: 'BJ = 0,  J ≠ 0', text: 'Represents persistent cycle-space current and ordered recurrent transformation.', evidence: 'AH5–AH44' },
  { id: 'keyhole', mark: '◉', name: 'Keyhole', subtitle: 'Observer-limited domain', equation: 'O = P(X)', text: 'Makes observability explicit: the full system may contain distinctions collapsed by the current projection.', evidence: 'Observer hierarchy' },
  { id: 'altermath', mark: 'A', name: 'Altermath', subtitle: 'Causal structure behind cancellation', equation: 'P(X)=P(X′),  X ≉ X′', text: 'Captures systems that look equivalent now but respond differently to an admissible future interaction.', evidence: 'AH2–AH21' },
  { id: 'flux', mark: 'J', name: 'Dynamic / Flux', subtitle: 'Stable through motion', equation: 'Ẋ = 0,  J ≠ 0', text: 'Separates dead equilibrium from nonequilibrium steady state maintained by persistent throughput.', evidence: 'ALTM-F branch · planned' },
  { id: 'symbolic', mark: '→', name: 'Symbolic / Conveyor', subtitle: 'State between states', equation: 'Xᵢ → Zᵢⱼ → Xⱼ', text: 'Gives the transport packet its own symbol, frame, polarity, residue, timing, flux, and provenance.', evidence: 'Conveyor calculus · under development' },
  { id: 'experimental', mark: 'E', name: 'Experimental', subtitle: 'One cage, one trick', equation: 'model → control → receipt', text: 'Minimal finite constructions designed to isolate one claim with controls and frozen expected outcomes.', evidence: 'AH experiment ladder' },
  { id: 'speculative', mark: '?', name: 'Speculative Physical', subtitle: 'Possible downstream mapping', equation: 'formalism ≠ evidence', text: 'Horizon, cosmology, and black/white polarity applications live here until separately modeled and empirically justified.', evidence: 'Claim firewall applies' },
]

const zoo = [
  ['Zoo-01', 'Hidden Twin', 'Same observation now; later probe separates the states.', 'AH2'],
  ['Zoo-02', 'Boundary Courier', 'Parent information crosses an explicit interface as latent residue.', 'AH3'],
  ['Zoo-03', 'Order Matters', 'Same interfaces, different order, different full result.', 'AH5'],
  ['Zoo-04', 'Closed But Changed', 'The observable closes around a loop while the full state does not.', 'AH6'],
  ['Zoo-05', 'CW / CCW', 'Opposite loop orientations hide different residues and cancel exactly.', 'AH7'],
  ['Zoo-06', 'Two Plaquettes', 'Local loops stay nontrivial while the outer boundary cancels.', 'AH8'],
  ['Zoo-07', 'Active Zero', 'Same steady snapshot; one system carries hidden cycle current.', 'ALTM-F'],
  ['Zoo-08', 'False Dashboard', 'Visible output stabilizes while hidden dynamics violate the task regime.', 'Φ-System'],
  ['Zoo-09', 'Conveyor Memory', 'The present token matches while ordered path history differs.', 'Conveyor'],
  ['Zoo-10', 'Self-Sculpting Interface', 'Flux reshapes the interface that controls future flux.', 'Proposed'],
]

const keyholes = [
  {
    label: 'O₀ · Snapshot',
    visible: 'Node state only',
    hides: 'Flux, path, cycle, provenance',
    line: 'P₀(Ω) = X',
    insight: 'Two systems can look identical even while one is actively circulating.'
  },
  {
    label: 'O₁ · Flux',
    visible: 'Node state + current',
    hides: 'Ordered path + loop history',
    line: 'P₁(Ω) = (X, J)',
    insight: 'Steady state no longer means “nothing is happening.”'
  },
  {
    label: 'O₂ · Path',
    visible: 'Current + ordered transformations',
    hides: 'Global cycle topology',
    line: 'P₂(Ω) = (X, J, MΓ)',
    insight: 'AB and BA can be distinguishable even with the same ingredients.'
  },
  {
    label: 'O₃ · Cycle',
    visible: 'Closed-loop residue / Gear state',
    hides: 'Full provenance ledger',
    line: 'P₃(Ω) = (X, J, Mγ, Rγ)',
    insight: 'A loop can close observationally while the full state does not.'
  },
  {
    label: 'O₄ · Ledger',
    visible: 'State + process + provenance',
    hides: 'Only what the declared model never records',
    line: 'P₄(Ω) = receipt chain',
    insight: 'Same output can still have a different causal history.'
  },
]

function Formula({ children }) {
  return <div className="formula">{children}</div>
}

function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

function shortHash(value) {
  if (!value || value === 'GENESIS') return value || '—'
  return `${value.slice(0, 10)}…${value.slice(-8)}`
}

function TemporalClaimCard({ item, selected, onSelect }) {
  return (
    <button
      className={selected ? 'temporal-card selected' : 'temporal-card'}
      onClick={() => onSelect(item.recordId)}
    >
      <div className="temporal-card-top">
        <span>{item.recordId}</span>
        <em>{item.originKind.replaceAll('_', ' ')}</em>
      </div>
      <div className="temporal-edge">
        <strong>{item.subject}</strong>
        <span>{item.relation}</span>
        <strong>{item.object}</strong>
      </div>
      <div className="temporal-status-row">
        <div>
          <small>SOURCE STATUS</small>
          <b>{item.sourceStatus}</b>
        </div>
        <div>
          <small>REVIEW STATUS</small>
          <b>{item.reviewStatus}</b>
        </div>
      </div>
      <div className="temporal-card-foot">
        <span>{item.ambiguity ? 'AMBIGUOUS' : 'RESOLVED VIEW'}</span>
        <span>{item.appliedEventIds.length ? item.appliedEventIds.join(' · ') : 'NO REVIEW EVENTS'}</span>
      </div>
    </button>
  )
}

function App() {
  const [depth, setDepth] = useState(0)
  const [bubbleIndex, setBubbleIndex] = useState(0)
  const [experimentIndex, setExperimentIndex] = useState(0)
  const [temporalCutoffA, setTemporalCutoffA] = useState(1)
  const [temporalCutoffB, setTemporalCutoffB] = useState(4)
  const [temporalStatuses, setTemporalStatuses] = useState([])
  const [temporalRelations, setTemporalRelations] = useState([])
  const [showAnalyst, setShowAnalyst] = useState(false)
  const [selectedTemporalRecord, setSelectedTemporalRecord] = useState('C1')
  const [evidenceQueueDecisions, setEvidenceQueueDecisions] = useState(T8_FROZEN_DECISIONS)
  const [governanceKnownA, setGovernanceKnownA] = useState(5)
  const [governanceValidA, setGovernanceValidA] = useState(5)
  const [governanceKnownB, setGovernanceKnownB] = useState(10)
  const [governanceValidB, setGovernanceValidB] = useState(10)
  const [counterfactualOption, setCounterfactualOption] = useState('REMOVE_DEACTIVATE')
  const [counterfactualKnown, setCounterfactualKnown] = useState(10)
  const [counterfactualValid, setCounterfactualValid] = useState(10)
  const [sensitivityKnown, setSensitivityKnown] = useState(10)
  const [sensitivityValid, setSensitivityValid] = useState(10)
  const active = keyholes[depth]
  const activeBubble = bubbleFamilies[bubbleIndex]
  const activeExperiment = experiments[experimentIndex]

  const totalChecks = useMemo(
    () => experiments.reduce((sum, row) => sum + Number(row.checks.split('/')[0]), 0),
    [],
  )

  const temporalLeft = useMemo(
    () =>
      deriveTemporalView(temporalCutoffA, {
        statuses: temporalStatuses,
        relations: temporalRelations,
        includeAnalystHypotheses: showAnalyst,
      }),
    [temporalCutoffA, temporalStatuses, temporalRelations, showAnalyst],
  )

  const temporalRight = useMemo(
    () =>
      deriveTemporalView(temporalCutoffB, {
        statuses: temporalStatuses,
        relations: temporalRelations,
        includeAnalystHypotheses: showAnalyst,
      }),
    [temporalCutoffB, temporalStatuses, temporalRelations, showAnalyst],
  )

  const temporalComparison = useMemo(
    () => compareTemporalViews(temporalLeft, temporalRight),
    [temporalLeft, temporalRight],
  )

  const selectedBundle = useMemo(
    () =>
      provenanceBundle(
        selectedTemporalRecord,
        Math.max(temporalCutoffA, temporalCutoffB),
      ),
    [selectedTemporalRecord, temporalCutoffA, temporalCutoffB],
  )

  const temporalAmbiguities = useMemo(
    () => ambiguityQueue(temporalCutoffB),
    [temporalCutoffB],
  )

  const changedTemporalIds = temporalComparison
    .filter((row) => row.changed)
    .map((row) => row.recordId)

  const evidenceQueue = useMemo(
    () => queueRows(evidenceQueueDecisions),
    [evidenceQueueDecisions],
  )

  const evidenceQueueDerived = useMemo(
    () => deriveQueueStatus(evidenceQueueDecisions),
    [evidenceQueueDecisions],
  )

  const governanceLeft = useMemo(
    () => governanceKeyhole(governanceKnownA, governanceValidA),
    [governanceKnownA, governanceValidA],
  )

  const governanceRight = useMemo(
    () => governanceKeyhole(governanceKnownB, governanceValidB),
    [governanceKnownB, governanceValidB],
  )

  const governanceComparison = useMemo(
    () => compareGovernanceKeyholes(governanceLeft, governanceRight),
    [governanceLeft, governanceRight],
  )

  const governanceEvents = useMemo(() => governanceTimeline(), [])

  const counterfactualView = useMemo(
    () => counterfactualComparison(counterfactualOption, counterfactualKnown, counterfactualValid),
    [counterfactualOption, counterfactualKnown, counterfactualValid],
  )

  const counterfactualDivergence = useMemo(
    () => firstOutcomeDivergence(counterfactualOption),
    [counterfactualOption],
  )

  const counterfactualMeta = useMemo(
    () => COUNTERFACTUAL_OPTIONS.find((row) => row.id === counterfactualOption),
    [counterfactualOption],
  )

  const sensitivityAtlas = useMemo(
    () => buildSensitivityAtlas(sensitivityKnown, sensitivityValid),
    [sensitivityKnown, sensitivityValid],
  )

  const sensitivityMinimal = useMemo(
    () => minimalRejectedSingletons(sensitivityKnown, sensitivityValid),
    [sensitivityKnown, sensitivityValid],
  )

  const sensitivityCounts = useMemo(
    () => ({
      outcome: sensitivityAtlas.rows.filter((row) => row.targetClass === 'OUTCOME_CHANGING').length,
      policy: sensitivityAtlas.rows.filter((row) => row.targetClass === 'POLICY_CHANGING').length,
      targetInert: sensitivityAtlas.rows.filter((row) => row.targetClass === 'TARGET_INERT').length,
      ledgerOnly: sensitivityAtlas.rows.filter((row) => row.temporalClass === 'LEDGER_ONLY_INERT').length,
    }),
    [sensitivityAtlas],
  )

  function reviewEvidenceCapture(captureId, decision) {
    setEvidenceQueueDecisions((current) =>
      applyQueueDecision(current, captureId, decision),
    )
  }

  function exportEvidenceQueue() {
    const payload = buildQueueExport(evidenceQueueDecisions)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'nbg-t8-evidence-review-queue.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportSensitivityAtlas() {
    const payload = buildSensitivityExport(sensitivityKnown, sensitivityValid)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nbg-t13-governance-sensitivity-k${sensitivityKnown}-t${sensitivityValid}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportCounterfactualGovernance() {
    const payload = buildCounterfactualExport(
      counterfactualOption,
      counterfactualKnown,
      counterfactualValid,
    )
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nbg-t12-${counterfactualOption.toLowerCase()}-k${counterfactualKnown}-t${counterfactualValid}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportGovernanceComparison() {
    const payload = buildGovernanceExport(governanceLeft, governanceRight)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nbg-t11-governance-keyholes-k${governanceKnownA}-k${governanceKnownB}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportTemporalComparison() {
    const payload = buildTemporalExport(temporalLeft, temporalRight)
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nbg-temporal-keyholes-k${temporalCutoffA}-k${temporalCutoffB}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top"><span>Φ</span> NBG Research Lab</a>
        <nav>
          <a href="#stack">Stack</a>
          <a href="#atlas">Bubble Atlas</a>
          <a href="#keyholes">Keyholes</a>
          <a href="#temporal">Temporal</a>
          <a href="#experiments">Experiments</a>
          <a href="#claims">Claims</a>
          <a href="https://github.com/MichaelWave369/NestedBubbleGear">GitHub ↗</a>
        </nav>
      </header>

      <section id="top" className="hero">
        <div className="hero-grid" />
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="eyebrow">ENTER THE FIELD · NESTED BUBBLE/GEAR</div>
        <h1>What survives<br /><em>the apparent zero?</em></h1>
        <p className="lede">
          A reproducible research program for hidden causal residue, interface transport,
          ordered composition, observer keyholes, and local-to-global structure.
        </p>
        <Formula>
          <span>P(X) = P(X′)</span>
          <strong>but</strong>
          <span>∃ w : P(ρ(w)X) ≠ P(ρ(w)X′)</span>
        </Formula>
        <div className="hero-actions">
          <a className="button primary" href="#experiments">Explore the evidence ladder</a>
          <a className="button ghost" href="#keyholes">Open the keyhole</a>
        </div>
        <div className="stats">
          <div><strong>AH2→AH44</strong><span>frozen experiment ladder</span></div>
          <div><strong>{totalChecks}</strong><span>frozen acceptance checks passed</span></div>
          <div><strong>7</strong><span>layers in the current stack</span></div>
        </div>
      </section>

      <section className="section intro">
        <div className="section-label">THE CORE IDEA</div>
        <div className="two-col">
          <h2>Identical now does not mean behaviorally equivalent.</h2>
          <div>
            <p>
              NBG asks what happens when a coarse observer merges states that a future,
              admissible interaction can later distinguish. The project treats boundaries,
              transport, path order, closed loops, and observation as explicit mathematical objects.
            </p>
            <p className="muted">
              The experiments are finite toy models. They earn the next mathematical question.
              They do not turn speculative cosmology into evidence by sheer enthusiasm.
            </p>
          </div>
        </div>
      </section>

      <section id="stack" className="section">
        <div className="section-label">THE STACK</div>
        <h2>One architecture, seven jobs.</h2>
        <div className="stack-grid">
          {stack.map((item, i) => (
            <article className="stack-card" key={item.name}>
              <div className="stack-top"><span className="stack-mark">{item.mark}</span><span>0{i + 1}</span></div>
              <h3>{item.name}</h3>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>


      <section id="atlas" className="section atlas-section">
        <div className="section-label">BUBBLE ATLAS</div>
        <div className="two-col atlas-heading">
          <div>
            <h2>Not every bubble is a sphere.<br />Every bubble has a job.</h2>
            <p className="muted">
              “Bubble” is the domain abstraction. Pick a family to see what structure it isolates and where it currently sits in the research stack.
            </p>
          </div>
          <div className="atlas-active">
            <div className="atlas-glyph">{activeBubble.mark}</div>
            <span className="pill">{activeBubble.subtitle}</span>
            <h3>{activeBubble.name} Bubble</h3>
            <code>{activeBubble.equation}</code>
            <p>{activeBubble.text}</p>
            <small>{activeBubble.evidence}</small>
          </div>
        </div>

        <div className="atlas-grid">
          {bubbleFamilies.map((bubble, i) => (
            <button
              key={bubble.id}
              className={i === bubbleIndex ? 'atlas-card active' : 'atlas-card'}
              onClick={() => setBubbleIndex(i)}
            >
              <span className="atlas-card-mark">{bubble.mark}</span>
              <strong>{bubble.name}</strong>
              <small>{bubble.subtitle}</small>
            </button>
          ))}
        </div>

        <div className="zoo-head">
          <div>
            <span className="section-label">BUBBLE ZOO</span>
            <h3>One cage. One trick.</h3>
          </div>
          <a className="text-link" href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/BUBBLE_ZOO.md">Full zoo notes ↗</a>
        </div>

        <div className="zoo-grid">
          {zoo.map(([id, name, behavior, rung]) => (
            <article className="zoo-card" key={id}>
              <div className="zoo-card-top"><span>{id}</span><em>{rung}</em></div>
              <h4>{name}</h4>
              <p>{behavior}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="keyholes" className="section keyhole-section">
        <div className="section-label">INTERACTIVE KEYHOLE</div>
        <div className="two-col">
          <div>
            <h2>Change the observer.<br />Change what counts as “the same.”</h2>
            <p className="muted">Widen the aperture to reveal structure hidden by shallower projections.</p>
            <div className="depth-buttons">
              {keyholes.map((k, i) => (
                <button
                  key={k.label}
                  className={i === depth ? 'active' : ''}
                  onClick={() => setDepth(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="keyhole-panel">
            <div className="keyhole-visual">
              <div className="keyhole-ring">
                <div className="keyhole-core">Φ</div>
              </div>
              <div className="scan-lines" />
            </div>
            <div className="keyhole-copy">
              <span className="pill">{active.label}</span>
              <h3>{active.visible}</h3>
              <code>{active.line}</code>
              <dl>
                <div><dt>Visible</dt><dd>{active.visible}</dd></div>
                <div><dt>Still hidden</dt><dd>{active.hides}</dd></div>
              </dl>
              <p>{active.insight}</p>
            </div>
          </div>
        </div>
      </section>


      <section id="temporal" className="section temporal-section">
        <div className="section-label">NBG-T6 · TEMPORAL KEYHOLE EXPLORER</div>
        <div className="section-heading-row temporal-heading">
          <div>
            <h2>Move the knowledge cutoff.<br />Watch history change without rewriting it.</h2>
            <p className="muted temporal-intro">
              This explorer renders the frozen NBG-T5 synthetic witness. Source records stay immutable;
              review events enter only when their known-time becomes visible.
            </p>
          </div>
          <span className="status">VIEW ≠ LEDGER · FILTER ≠ EDIT</span>
        </div>

        <div className="temporal-controls">
          <div className="cutoff-control">
            <div className="control-head">
              <span>LEFT KEYHOLE</span>
              <strong>k{temporalCutoffA}</strong>
            </div>
            <input
              aria-label="Left knowledge cutoff"
              type="range"
              min="1"
              max="4"
              step="1"
              value={temporalCutoffA}
              onChange={(event) => setTemporalCutoffA(Number(event.target.value))}
            />
            <small>Ledger head · {shortHash(temporalLeft.ledgerHead)}</small>
          </div>

          <div className="cutoff-control">
            <div className="control-head">
              <span>RIGHT KEYHOLE</span>
              <strong>k{temporalCutoffB}</strong>
            </div>
            <input
              aria-label="Right knowledge cutoff"
              type="range"
              min="1"
              max="4"
              step="1"
              value={temporalCutoffB}
              onChange={(event) => setTemporalCutoffB(Number(event.target.value))}
            />
            <small>Ledger head · {shortHash(temporalRight.ledgerHead)}</small>
          </div>

          <button
            className={showAnalyst ? 'overlay-toggle active' : 'overlay-toggle'}
            onClick={() => setShowAnalyst((value) => !value)}
          >
            <span>ANALYST HYPOTHESIS</span>
            <strong>{showAnalyst ? 'VISIBLE' : 'HIDDEN'}</strong>
          </button>
        </div>

        <div className="temporal-filters">
          <div>
            <span className="filter-label">EVIDENCE STATUS</span>
            <div className="filter-buttons">
              <button
                className={temporalStatuses.length === 0 ? 'active' : ''}
                onClick={() => setTemporalStatuses([])}
              >
                ALL
              </button>
              {STATUS_OPTIONS.map((statusName) => (
                <button
                  key={statusName}
                  className={temporalStatuses.includes(statusName) ? 'active' : ''}
                  onClick={() =>
                    setTemporalStatuses((current) => toggleValue(current, statusName))
                  }
                >
                  {statusName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="filter-label">RELATION TYPE</span>
            <div className="filter-buttons">
              <button
                className={temporalRelations.length === 0 ? 'active' : ''}
                onClick={() => setTemporalRelations([])}
              >
                ALL
              </button>
              {RELATION_OPTIONS.map((relationName) => (
                <button
                  key={relationName}
                  className={temporalRelations.includes(relationName) ? 'active' : ''}
                  onClick={() =>
                    setTemporalRelations((current) => toggleValue(current, relationName))
                  }
                >
                  {relationName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="temporal-keyhole-grid">
          <div className="temporal-keyhole-column">
            <div className="temporal-column-head">
              <div>
                <span className="pill">KEYHOLE k{temporalCutoffA}</span>
                <strong>{temporalLeft.items.length} visible records</strong>
              </div>
              <code>{temporalLeft.viewFingerprint}</code>
            </div>
            <div className="temporal-card-list">
              {temporalLeft.items.length ? (
                temporalLeft.items.map((item) => (
                  <TemporalClaimCard
                    key={item.recordId}
                    item={item}
                    selected={item.recordId === selectedTemporalRecord}
                    onSelect={setSelectedTemporalRecord}
                  />
                ))
              ) : (
                <div className="temporal-empty">No records pass the current Keyhole filters.</div>
              )}
            </div>
          </div>

          <div className="temporal-keyhole-column">
            <div className="temporal-column-head">
              <div>
                <span className="pill">KEYHOLE k{temporalCutoffB}</span>
                <strong>{temporalRight.items.length} visible records</strong>
              </div>
              <code>{temporalRight.viewFingerprint}</code>
            </div>
            <div className="temporal-card-list">
              {temporalRight.items.length ? (
                temporalRight.items.map((item) => (
                  <TemporalClaimCard
                    key={item.recordId}
                    item={item}
                    selected={item.recordId === selectedTemporalRecord}
                    onSelect={setSelectedTemporalRecord}
                  />
                ))
              ) : (
                <div className="temporal-empty">No records pass the current Keyhole filters.</div>
              )}
            </div>
          </div>
        </div>

        <div className="temporal-delta">
          <span>DERIVED CHANGE SET</span>
          <strong>{changedTemporalIds.length ? changedTemporalIds.join(' · ') : 'NO DERIVED DIFFERENCE'}</strong>
          <small>
            Comparison marks view differences only. It does not create evidence, reviewer actions, or causal edges.
          </small>
        </div>

        <div className="temporal-review-grid">
          <article className="provenance-panel">
            <div className="panel-head">
              <span>PROVENANCE BUNDLE</span>
              <strong>{selectedTemporalRecord}</strong>
            </div>
            {selectedBundle ? (
              <>
                <dl>
                  <div><dt>Layer</dt><dd>{selectedBundle.baseRecord.provenance.layer}</dd></div>
                  <div><dt>Locator</dt><dd>{selectedBundle.baseRecord.provenance.sourceLocator}</dd></div>
                  <div><dt>Lineage</dt><dd>{selectedBundle.baseRecord.provenance.sourceLineage}</dd></div>
                  <div><dt>Base status</dt><dd>{selectedBundle.baseRecord.sourceStatus}</dd></div>
                  <div><dt>Base digest</dt><dd>{shortHash(TEMPORAL_BASE_DIGEST)}</dd></div>
                </dl>
                <div className="review-events">
                  <small>VISIBLE REVIEW EVENTS</small>
                  {selectedBundle.reviewEvents.length ? selectedBundle.reviewEvents.map((event) => (
                    <div className="review-event" key={event.eventId}>
                      <strong>{event.eventId} · {event.eventType}</strong>
                      <span>known @ k{event.knownTime}</span>
                      <p>{event.reason}</p>
                      <code>{shortHash(event.eventHash)}</code>
                    </div>
                  )) : <p className="muted">No review event targets this record at the selected maximum cutoff.</p>}
                </div>
                <code className="bundle-fingerprint">{selectedBundle.bundleFingerprint}</code>
              </>
            ) : (
              <p className="muted">Select a claim card to inspect its immutable source record and review trail.</p>
            )}
          </article>

          <article className="ambiguity-panel">
            <div className="panel-head">
              <span>AMBIGUITY QUEUE @ k{temporalCutoffB}</span>
              <strong>{temporalAmbiguities.length}</strong>
            </div>
            {temporalAmbiguities.length ? (
              temporalAmbiguities.map((item) => (
                <button key={item.recordId} onClick={() => setSelectedTemporalRecord(item.recordId)}>
                  <strong>{item.recordId}</strong>
                  <span>{item.subject} → {item.object}</span>
                  <small>Requires explicit reviewer event</small>
                </button>
              ))
            ) : (
              <div className="ambiguity-clear">
                <span>✓</span>
                <strong>No unresolved synthetic labels at this cutoff.</strong>
                <small>The immutable base record may still preserve the original UNKNOWN value.</small>
              </div>
            )}
          </article>

          <article className="export-panel">
            <div className="panel-head">
              <span>GOVERNED EXPORT</span>
              <strong>NBG-T6</strong>
            </div>
            <p>
              Export both current Keyholes with the frozen base records, review ledger,
              base SHA-256 digest, ledger heads, and deterministic view fingerprints.
            </p>
            <dl>
              <div><dt>Base SHA-256</dt><dd>{shortHash(TEMPORAL_BASE_DIGEST)}</dd></div>
              <div><dt>Left head</dt><dd>{shortHash(temporalLeft.ledgerHead)}</dd></div>
              <div><dt>Right head</dt><dd>{shortHash(temporalRight.ledgerHead)}</dd></div>
            </dl>
            <button className="button primary temporal-export" onClick={exportTemporalComparison}>
              Export current comparison
            </button>
            <small>Browser fingerprints are display checks, not replacements for the frozen SHA-256 receipts.</small>
          </article>
        </div>

        <div className="evidence-queue-shell">
          <div className="section-label">NBG-T8 · EVIDENCE REVIEW QUEUE</div>
          <div className="section-heading-row evidence-queue-heading">
            <div>
              <h2>Capture first. Decide later.</h2>
              <p className="muted">
                The browser shows the frozen T8 review queue. Live capture is operator-triggered by the
                read-only CLI; retrieval alone never changes the source claim.
              </p>
            </div>
            <span className="status">RETRIEVED ≠ ACCEPTED</span>
          </div>

          <div className="evidence-queue-summary">
            <div>
              <small>SOURCE STATUS</small>
              <strong>{evidenceQueueDerived.sourceStatus}</strong>
            </div>
            <div>
              <small>SESSION REVIEW STATUS</small>
              <strong>{evidenceQueueDerived.reviewStatus}</strong>
            </div>
            <div>
              <small>SUPPORT GROUPS</small>
              <strong>{evidenceQueueDerived.supportGroups.join(' · ') || 'NONE'}</strong>
            </div>
            <div>
              <small>OPPOSE GROUPS</small>
              <strong>{evidenceQueueDerived.opposeGroups.join(' · ') || 'NONE'}</strong>
            </div>
          </div>

          <div className="evidence-queue-list">
            {evidenceQueue.map((row) => (
              <article className={row.drift ? 'evidence-queue-row drift' : 'evidence-queue-row'} key={row.captureId}>
                <div className="evidence-queue-top">
                  <div>
                    <strong>{row.captureId}</strong>
                    <span>{row.stance} · {row.independenceGroup}</span>
                  </div>
                  <div className="evidence-badges">
                    <span>{row.retrievalStatus}</span>
                    <span className={row.queueState.toLowerCase()}>{row.queueState}</span>
                    {row.drift && <span className="drift-badge">DRIFT DETECTED</span>}
                  </div>
                </div>
                <code>{row.locator}</code>
                <small>{row.contentSha256 ? shortHash(row.contentSha256) : 'NO CONTENT DIGEST'}</small>

                {row.retrievalStatus === 'CAPTURED' && (
                  <div className="evidence-review-actions">
                    <button
                      className={row.queueState === 'ACCEPT' ? 'active accept' : 'accept'}
                      onClick={() => reviewEvidenceCapture(row.captureId, 'ACCEPT')}
                    >
                      ACCEPT
                    </button>
                    <button
                      className={row.queueState === 'REJECT' ? 'active reject' : 'reject'}
                      onClick={() => reviewEvidenceCapture(row.captureId, 'REJECT')}
                    >
                      REJECT
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="evidence-queue-footer">
            <div>
              <strong>Operator capture boundary</strong>
              <p>
                <code>python scripts/nbgt8_capture.py --url … --allow-host …</code>
              </p>
              <small>
                The CLI persists the receipt and captured bytes before review. Static-site buttons above
                are session-only projections and export a review proposal; they do not rewrite the frozen ledger.
              </small>
            </div>
            <button className="button primary" onClick={exportEvidenceQueue}>
              Export review queue
            </button>
          </div>

        <div className="governance-shell">
          <div className="section-label">NBG-T11 · GOVERNANCE KEYHOLES</div>
          <div className="section-heading-row governance-heading">
            <div>
              <h2>Policies have history too.</h2>
              <p className="muted">
                Compare what governance rule was valid in the modeled world with what policy history
                was actually knowable at the selected cutoff. Later amendments do not leak backward.
              </p>
            </div>
            <span className="status">POLICY ≠ TRUTH · LATER ≠ EARLIER</span>
          </div>

          <div className="governance-controls-grid">
            <article className="governance-control-card">
              <div className="panel-head">
                <span>LEFT GOVERNANCE KEYHOLE</span>
                <strong>known k{governanceKnownA} · valid t{governanceValidA}</strong>
              </div>
              <label>
                <span>KNOWN-TIME CUTOFF</span>
                <input
                  aria-label="Left governance known-time cutoff"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={governanceKnownA}
                  onChange={(event) => setGovernanceKnownA(Number(event.target.value))}
                />
              </label>
              <label>
                <span>VALID TIME</span>
                <input
                  aria-label="Left governance valid time"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={governanceValidA}
                  onChange={(event) => setGovernanceValidA(Number(event.target.value))}
                />
              </label>
            </article>

            <article className="governance-control-card">
              <div className="panel-head">
                <span>RIGHT GOVERNANCE KEYHOLE</span>
                <strong>known k{governanceKnownB} · valid t{governanceValidB}</strong>
              </div>
              <label>
                <span>KNOWN-TIME CUTOFF</span>
                <input
                  aria-label="Right governance known-time cutoff"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={governanceKnownB}
                  onChange={(event) => setGovernanceKnownB(Number(event.target.value))}
                />
              </label>
              <label>
                <span>VALID TIME</span>
                <input
                  aria-label="Right governance valid time"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={governanceValidB}
                  onChange={(event) => setGovernanceValidB(Number(event.target.value))}
                />
              </label>
            </article>
          </div>

          <div className="governance-keyhole-grid">
            {[['LEFT', governanceLeft], ['RIGHT', governanceRight]].map(([side, view]) => (
              <article className="governance-keyhole-card" key={side}>
                <div className="governance-keyhole-top">
                  <div>
                    <span>{side} KEYHOLE</span>
                    <strong>{view.selectedPolicyVersionId || 'NO ACTIVE POLICY'}</strong>
                  </div>
                  <code>{view.keyholeFingerprint}</code>
                </div>
                <div className="governance-outcome">
                  <small>GOVERNANCE OUTCOME</small>
                  <strong>{view.governanceOutcome}</strong>
                </div>
                <dl>
                  <div><dt>Mode</dt><dd>{view.selectedPolicyMode || '—'}</dd></div>
                  <div><dt>Ledger head</dt><dd>{view.ledgerHead}</dd></div>
                  <div><dt>Visible policies</dt><dd>{view.visiblePolicyVersionIds.join(' · ') || 'NONE'}</dd></div>
                </dl>
                <div className="governance-status-list">
                  {Object.entries(view.policyStatuses).map(([policyId, statusName]) => (
                    <div key={policyId}>
                      <span>{policyId}</span>
                      <strong className={statusName.toLowerCase()}>{statusName}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="governance-delta">
            <div>
              <small>SELECTED POLICY CHANGED</small>
              <strong>{governanceComparison.selectedPolicyChanged ? 'YES' : 'NO'}</strong>
            </div>
            <div>
              <small>OUTCOME CHANGED</small>
              <strong>{governanceComparison.governanceOutcomeChanged ? 'YES' : 'NO'}</strong>
            </div>
            <div>
              <small>LEDGER HEAD CHANGED</small>
              <strong>{governanceComparison.ledgerHeadChanged ? 'YES' : 'NO'}</strong>
            </div>
          </div>

          <div className="governance-ledger">
            <div className="panel-head">
              <span>APPEND-ONLY POLICY LEDGER</span>
              <strong>{governanceEvents.length} frozen events</strong>
            </div>
            <div className="governance-event-list">
              {governanceEvents.map((event) => (
                <div className="governance-event" key={event.eventId}>
                  <strong>{event.eventId}</strong>
                  <span>{event.type}</span>
                  <small>known k{event.knownTime} · valid t{event.validTime} · {event.target}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="governance-footer">
            <div>
              <strong>Anti-hindsight governance</strong>
              <p>
                A policy may be valid for an earlier modeled time yet remain invisible to an observer
                whose knowledge cutoff predates its registration. Emergency activation and deactivation
                are also replayed against valid time rather than retroactively flattening history.
              </p>
              <small>No Governance Keyhole output is an objective truth claim. It is a replayable policy result.</small>
            </div>
            <button className="button primary" onClick={exportGovernanceComparison}>
              Export Governance Keyholes
            </button>
          </div>
        </div>

        <div className="counterfactual-shell">
          <div className="section-label">NBG-T12 · COUNTERFACTUAL GOVERNANCE</div>
          <div className="section-heading-row counterfactual-heading">
            <div>
              <h2>Fork the policy history.<br />Never confuse it with the observed one.</h2>
              <p className="muted">
                T12 keeps the observed governance ledger immutable, then derives an explicitly marked
                counterfactual branch by removing, delaying, or altering one frozen policy event.
              </p>
            </div>
            <span className="status">OBSERVED ≠ COUNTERFACTUAL</span>
          </div>

          <div className="counterfactual-option-grid">
            {COUNTERFACTUAL_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={counterfactualOption === option.id ? 'counterfactual-option active' : 'counterfactual-option'}
                onClick={() => setCounterfactualOption(option.id)}
              >
                <strong>{option.label}</strong>
                <span>{option.operation}</span>
                <small>{option.description}</small>
              </button>
            ))}
          </div>

          <div className="counterfactual-controls">
            <label>
              <span>KNOWN-TIME CUTOFF · k{counterfactualKnown}</span>
              <input
                aria-label="Counterfactual known-time cutoff"
                type="range"
                min="1"
                max="12"
                step="1"
                value={counterfactualKnown}
                onChange={(event) => setCounterfactualKnown(Number(event.target.value))}
              />
            </label>
            <label>
              <span>VALID TIME · t{counterfactualValid}</span>
              <input
                aria-label="Counterfactual valid time"
                type="range"
                min="1"
                max="12"
                step="1"
                value={counterfactualValid}
                onChange={(event) => setCounterfactualValid(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="counterfactual-compare-grid">
            <article className="counterfactual-card observed">
              <div className="counterfactual-card-head">
                <span>OBSERVED LEDGER</span>
                <code>{counterfactualView.observed.ledgerFingerprint}</code>
              </div>
              <strong>{counterfactualView.observed.selectedPolicyVersionId || 'NO ACTIVE POLICY'}</strong>
              <div className="counterfactual-outcome">
                <small>GOVERNANCE OUTCOME</small>
                <b>{counterfactualView.observed.governanceOutcome}</b>
              </div>
              <small>{counterfactualView.observed.visibleEventIds.length} visible policy events</small>
            </article>

            <article className="counterfactual-card branch">
              <div className="counterfactual-card-head">
                <span>COUNTERFACTUAL BRANCH</span>
                <code>{counterfactualView.counterfactual.ledgerFingerprint}</code>
              </div>
              <strong>{counterfactualView.counterfactual.selectedPolicyVersionId || 'NO ACTIVE POLICY'}</strong>
              <div className="counterfactual-outcome">
                <small>GOVERNANCE OUTCOME</small>
                <b>{counterfactualView.counterfactual.governanceOutcome}</b>
              </div>
              <small>{counterfactualView.counterfactual.visibleEventIds.length} visible branch events</small>
            </article>
          </div>

          <div className="counterfactual-delta">
            <div>
              <small>POLICY CHANGED</small>
              <strong>{counterfactualView.policyChanged ? 'YES' : 'NO'}</strong>
            </div>
            <div>
              <small>OUTCOME CHANGED</small>
              <strong>{counterfactualView.outcomeChanged ? 'YES' : 'NO'}</strong>
            </div>
            <div>
              <small>ALTERED EVENT</small>
              <strong>{counterfactualMeta?.targetEventId}</strong>
            </div>
            <div>
              <small>FIRST OUTCOME DIVERGENCE</small>
              <strong>
                {counterfactualDivergence
                  ? `k${counterfactualDivergence.knownCutoff} / t${counterfactualDivergence.validTime}`
                  : 'NONE IN WINDOW'}
              </strong>
            </div>
          </div>

          <div className="counterfactual-receipt">
            <div>
              <strong>{counterfactualView.branchId}</strong>
              <p>
                {counterfactualMeta?.operation} · target {counterfactualMeta?.targetEventId}.
                The observed ledger remains the reference product; this branch is a synthetic model intervention.
              </p>
              <code>{counterfactualView.comparisonFingerprint}</code>
              <small>COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY</small>
            </div>
            <button className="button primary" onClick={exportCounterfactualGovernance}>
              Export counterfactual branch
            </button>
          </div>
        </div>

        <div className="sensitivity-shell">
          <div className="section-label">NBG-T13 · GOVERNANCE SENSITIVITY ATLAS</div>
          <div className="section-heading-row sensitivity-heading">
            <div>
              <h2>Not every changed ledger event matters.</h2>
              <p className="muted">
                T13 enumerates the frozen intervention grammar and separates target outcome leverage,
                policy-only leverage, temporal leverage, and changes that are merely different bytes.
              </p>
            </div>
            <span className="status">SENSITIVITY ≠ CAUSAL ATTRIBUTION</span>
          </div>

          <div className="sensitivity-controls">
            <label>
              <span>TARGET KNOWN TIME · k{sensitivityKnown}</span>
              <input
                aria-label="Sensitivity target known time"
                type="range"
                min="1"
                max="12"
                step="1"
                value={sensitivityKnown}
                onChange={(event) => setSensitivityKnown(Number(event.target.value))}
              />
            </label>
            <label>
              <span>TARGET VALID TIME · t{sensitivityValid}</span>
              <input
                aria-label="Sensitivity target valid time"
                type="range"
                min="1"
                max="12"
                step="1"
                value={sensitivityValid}
                onChange={(event) => setSensitivityValid(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="sensitivity-summary">
            <div><small>OUTCOME-CHANGING</small><strong>{sensitivityCounts.outcome}</strong></div>
            <div><small>POLICY-ONLY @ TARGET</small><strong>{sensitivityCounts.policy}</strong></div>
            <div><small>TARGET-INERT</small><strong>{sensitivityCounts.targetInert}</strong></div>
            <div><small>LEDGER-ONLY INERT</small><strong>{sensitivityCounts.ledgerOnly}</strong></div>
          </div>

          <div className="sensitivity-table-wrap">
            <table className="sensitivity-table">
              <thead>
                <tr>
                  <th>INTERVENTION</th>
                  <th>TARGET EVENT</th>
                  <th>TARGET CLASS</th>
                  <th>TEMPORAL CLASS</th>
                  <th>POLICY</th>
                  <th>OUTCOME</th>
                  <th>FIRST OUTCOME DIVERGENCE</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityAtlas.rows.map((row) => (
                  <tr key={row.interventionId}>
                    <td>
                      <strong>{row.label}</strong>
                      <small>{row.interventionId}</small>
                    </td>
                    <td><code>{row.targetEventId}</code></td>
                    <td><span className={row.targetClass.toLowerCase()}>{row.targetClass}</span></td>
                    <td><span>{row.temporalClass}</span></td>
                    <td>
                      <small>{row.observedPolicy || 'NONE'}</small>
                      <b>→</b>
                      <small>{row.counterfactualPolicy || 'NONE'}</small>
                    </td>
                    <td>
                      <small>{row.observedOutcome}</small>
                      <b>→</b>
                      <small>{row.counterfactualOutcome}</small>
                    </td>
                    <td>
                      {row.firstOutcomeDivergence
                        ? <strong>k{row.firstOutcomeDivergence.knownCutoff} / t{row.firstOutcomeDivergence.validTime}</strong>
                        : <span>NONE</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sensitivity-minimal">
            <div>
              <span>MINIMAL SETS FOR TARGET OUTCOME = REJECTED</span>
              <strong>
                {sensitivityMinimal.minimalCardinality
                  ? \`cardinality \${sensitivityMinimal.minimalCardinality}\`
                  : 'UNREACHABLE IN FROZEN GRAMMAR'}
              </strong>
            </div>
            <div className="minimal-set-list">
              {sensitivityMinimal.interventionIds.map((id) => <code key={id}>{id}</code>)}
            </div>
          </div>

          <div className="sensitivity-negative-control">
            <div>
              <strong>Negative controls matter too.</strong>
              <p>
                A payload-only edit changes the branch ledger fingerprint but changes no selected policy
                and no governance outcome anywhere in the frozen replay window. A different ledger is not
                automatically a causally relevant difference.
              </p>
              <small>SENSITIVITY_ATLAS_NOT_CAUSAL_ATTRIBUTION</small>
            </div>
            <button className="button primary" onClick={exportSensitivityAtlas}>
              Export sensitivity atlas
            </button>
          </div>
        </div>
        </div>
      </section>

      <section id="experiments" className="section">
        <div className="section-label">FROZEN EXPERIMENT LADDER</div>
        <div className="section-heading-row">
          <h2>Each rung has to earn the next one.</h2>
          <span className="status">REPLAYABLE · CONTROLLED · HASHED</span>
        </div>

        <div className="experiment-layout">
          <div className="experiment-list">
            {experiments.map((exp, i) => (
              <button
                className={i === experimentIndex ? 'experiment active' : 'experiment'}
                key={exp.id}
                onClick={() => setExperimentIndex(i)}
              >
                <div className="experiment-index">{String(i + 2).padStart(2, '0')}</div>
                <div>
                  <h3>{exp.id}</h3>
                  <p>{exp.title}</p>
                </div>
                <div className="pass-cell"><span>PASS</span><strong>{exp.checks}</strong><small>checks</small></div>
                <div className="pass-cell"><strong>{exp.tests}</strong><small>unit tests</small></div>
              </button>
            ))}
          </div>

          <aside className="experiment-dossier">
            <div className="dossier-top">
              <span className="pill">{activeExperiment.verdict}</span>
              <span>REPLAY EXACT</span>
            </div>
            <h3>{activeExperiment.id} · {activeExperiment.title}</h3>
            <p>{activeExperiment.result}</p>
            <code>{activeExperiment.info}</code>
            <div className="hash-block">
              <small>FROZEN PACKAGE SHA-256</small>
              <strong>{activeExperiment.hash}</strong>
            </div>
            <a className="text-link" href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/experiments/AH2-AH44_DOSSIERS.md">
              Open frozen result dossiers ↗
            </a>
          </aside>
        </div>

        <div className="progression">
          <span>latent residue</span><i>→</i>
          <span>boundary transfer</span><i>→</i>
          <span>path order</span><i>→</i>
          <span>loop residue</span><i>→</i>
          <span>orientation</span><i>→</i>
          <span>plaquettes</span><i>→</i>
          <span>basepoint transport</span><i>→</i>
          <span>three-plaquette transport</span><i>→</i>
          <span>minimal memory</span><i>→</i>
          <span>task-dependent memory</span><i>→</i>
          <span>authorized memory</span><i>→</i>
          <span>revocation + downgrade</span>
        </div>
      </section>

      <section className="section concepts">
        <div className="section-label">THREE USEFUL EQUATIONS</div>
        <div className="equation-grid">
          <article>
            <span className="num">01</span>
            <h3>Altermath witness</h3>
            <Formula><span>X ~<sub>P</sub> X′</span><strong>and</strong><span>X ≉ X′</span></Formula>
            <p>Indistinguishable through the current keyhole, distinguishable under some admissible future operation.</p>
          </article>
          <article>
            <span className="num">02</span>
            <h3>Gear current</h3>
            <Formula><span>BJ = 0</span><strong>while</strong><span>J ≠ 0</span></Formula>
            <p>No net accumulation can coexist with a nonzero cycle-space current.</p>
          </article>
          <article>
            <span className="num">03</span>
            <h3>Observable loop closure</h3>
            <Formula><span>π(Lx) = π(x)</span><strong>while</strong><span>Lx ≠ x</span></Formula>
            <p>The declared observable can return even when the full state retains loop residue.</p>
          </article>
        </div>
      </section>

      <section id="claims" className="section claims">
        <div className="section-label">CLAIM FIREWALL</div>
        <h2>Keep the fun. Keep the epistemology.</h2>
        <div className="claim-grid">
          <article className="claim demonstrated">
            <span>DEMONSTRATED</span>
            <h3>Finite toy-model results</h3>
            <p>Hidden residue, boundary transfer, noncommuting order, closed-loop residue, inverse cancellation, local/global plaquette cancellation, basepoint-aware local-to-global composition, and three-plaquette transported associativity.</p>
          </article>
          <article className="claim formal">
            <span>UNDER DEVELOPMENT</span>
            <h3>Formal machinery</h3>
            <p>Flux Altermath, conveyor calculus, keyhole hierarchy, cycle-space Gears, and local-to-global transport composition.</p>
          </article>
          <article className="claim speculative">
            <span>SPECULATIVE</span>
            <h3>Physical interpretation</h3>
            <p>Horizons, cosmological nesting, black/white interface polarity, and any claim about fundamental spacetime remain hypotheses.</p>
          </article>
        </div>
      </section>

      <section className="section manifesto">
        <div>
          <span className="section-label">CURRENT NORTH STAR</span>
          <blockquote>
            “The Gear is the circulation that survives when accumulation cancels.”
          </blockquote>
        </div>
        <div className="manifesto-note">
          <p>
            The project is deliberately built as an executable ladder rather than a single grand theory.
            Frozen protocols, negative controls, exact enumeration, and explicit failure classes come first.
          </p>
        </div>
      </section>

      <footer>
        <div><span className="footer-phi">Φ</span><strong>Nested Bubble/Gear</strong></div>
        <p>Experimental mathematics · reproducible toy models · claim firewall intact.<br />Code: MIT · Research content: CC BY 4.0</p>
        <div className="footer-links">
          <a href="https://github.com/MichaelWave369/NestedBubbleGear">Repository</a>
          <a href="https://zenodo.org/communities/enter-the-field-phi369/records">Zenodo Community</a>
          <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/LICENSE_POLICY.md">Licensing</a>
        </div>
      </footer>
    </main>
  )
}

export default App
