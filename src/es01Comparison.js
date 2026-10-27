// ES-01 E1: conservative, explicit comparison gate for literature metadata.
// NOT a predictive model, potency ranking or clinical efficacy calculator.
export const ES01_STUDY_CONTEXT = Object.freeze({
  'ES01-LSD-JRT': {setting:'Preclinical: cortical cells and rodents', endpointDomains:['plasticity','animal behavior'], indicationEstablished:false},
  'ES01-CAN-CBD': {setting:'Regulatory: human seizure indications', endpointDomains:['clinical efficacy'], indicationEstablished:true},
  'ES01-OPI-DFNZ': {setting:'Preclinical: receptor experiments and rodents', endpointDomains:['analgesia','adverse physiology'], indicationEstablished:false},
  'ES01-PSI-L5': {setting:'Preclinical: cell-specific mouse intervention', endpointDomains:['plasticity','animal behavior'], indicationEstablished:false},
  'ES01-DMT-1A': {setting:'Preclinical: structural and rodent studies', endpointDomains:['animal behavior'], indicationEstablished:false},
  'ES01-MDMA-RMDDMA': {setting:'Preclinical: cells and rodents', endpointDomains:['plasticity','animal behavior'], indicationEstablished:false},
  'ES01-MDA-COMP': {setting:'Controlled human acute-effects crossover', endpointDomains:['acute subjective effects','autonomic outcomes'], indicationEstablished:false},
  'ES01-KET-HNK': {setting:'Healthy-human Phase 1 pharmacology and safety', endpointDomains:['tolerability','dissociation'], indicationEstablished:false},
  'ES01-MDMA-MDA-MET': {setting:'Human pooled pharmacokinetic and pharmacodynamic studies', endpointDomains:['exposure','acute subjective effects'], indicationEstablished:false},
  'ES01-KET-ESK': {setting:'Regulatory: human depression indication and known risks', endpointDomains:['clinical efficacy','dissociation'], indicationEstablished:true},
})

export function compareES01Records(left,right) {
  if (!left || !right || !ES01_STUDY_CONTEXT[left.id] || !ES01_STUDY_CONTEXT[right.id])
    throw new TypeError('ES-01 comparison requires two indexed evidence records')
  const a=ES01_STUDY_CONTEXT[left.id],b=ES01_STUDY_CONTEXT[right.id]
  if (left.id===right.id) return Object.freeze({
    admissibility:'SAME_RECORD', supported:'This is a single source record, not an independent replication.',
    blockers:['Selecting a record twice cannot establish independent confirmation.'],
    nextMeasurement:'Find an independent replication or matched comparator study.', sharedDomains:[...a.endpointDomains], sameFamily:true,
  })
  const sharedDomains=a.endpointDomains.filter(x=>b.endpointDomains.includes(x))
  const blockers=[]
  const sameSource=left.source.url===right.source.url
  if (!sameSource) blockers.push('Different primary sources: no study-matched effect size or causal head-to-head inference.')
  if (left.evidenceTier!==right.evidenceTier) blockers.push('Different evidence tiers: clinical, human acute, safety and preclinical outcomes cannot be promoted across tiers.')
  if (left.family!==right.family) blockers.push('Different substance families: no shared potency, therapeutic success or safety scale is established.')
  if (sharedDomains.length===0) blockers.push('No matching high-level endpoint domain is tagged; outcome equivalence is not established.')
  else blockers.push('Shared endpoint labels describe broad constructs, not necessarily identical instruments, timing or assays.')
  if (!a.indicationEstablished || !b.indicationEstablished)
    blockers.push('At least one record has no established human therapeutic indication in its cited study.')
  const qualitative = left.family===right.family ?
    'You can compare source metadata and generate hypotheses within this family, but not rank treatment benefit or harm.' :
    'You can compare mechanisms and evidence gaps across families, but cannot rank treatment benefit or harm.'
  return Object.freeze({
    admissibility:'CONTEXT_ONLY', supported:qualitative, blockers,
    sharedDomains, sameFamily:left.family===right.family,
    nextMeasurement:'A pre-specified, appropriately controlled study with matched population, exposure, outcome definitions and time windows, plus direct benefit and harm measures.',
  })
}
