import {useMemo,useState} from 'react'
import evidence from './es01Evidence.json'
import {ES01_E5_FIELDS,makeES01ReviewPacket} from './es01ReviewPacket.js'

export default function ES01ReviewHandoff() {
  const [selectedId,setSelectedId]=useState(evidence.records[0].id)
  const [notesById,setNotesById]=useState({})
  const [showPreview,setShowPreview]=useState(false)
  const notes=notesById[selectedId]??{}
  const packet=useMemo(()=>makeES01ReviewPacket(selectedId,notes),[selectedId,notes])
  const source=evidence.records.find(r=>r.id===selectedId)
  const update=(key,value)=>setNotesById(prev=>({...prev,[selectedId]:{...(prev[selectedId]??{}),[key]:value}}))
  const exportPacket=()=>{
    const data=JSON.stringify(packet,null,2)+'\n'
    const blob=new Blob([data],{type:'application/json;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download='ES01-E5-'+selectedId+'-review-draft.json'
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  return <section id="es01-e5" className="es01-e5" aria-labelledby="es01-e5-title">
    <div className="es01-e5-heading">
      <span className="es01-eyebrow">E5 · OFFLINE REVIEWER HANDOFF · DRAFT ONLY</span>
      <h4 id="es01-e5-title">Build a source-bound review packet.</h4>
      <p>Choose a study, annotate the six evidence gaps, then export a structured JSON draft for independent review. No login, uploads, automated judgments, or modification of NBG's published evidence.</p>
    </div>
    <label className="es01-e5-chooser" htmlFor="es01-e5-source">Source and research question
      <select id="es01-e5-source" value={selectedId} onChange={e=>{setSelectedId(e.target.value);setShowPreview(false)}}>
        {evidence.records.map(r=><option key={r.id} value={r.id}>{r.family} · {r.compound}</option>)}
      </select>
    </label>
    <div className="es01-e5-alert">
      <strong>DRAFT_UNVERIFIED · E4 gate remains HOLD</strong>
      <p>These are editable reviewer notes, not completed source extractions or independent scientific verification. Blank notes may be exported so missing work stays visible.</p>
    </div>
    <div className="es01-e5-fields">
      {ES01_E5_FIELDS.map(field=><label key={field.key} htmlFor={'es01-e5-'+field.key}>
        <strong>{field.label}</strong>
        <span>{field.hint}</span>
        <textarea id={'es01-e5-'+field.key} rows={3} maxLength={4000}
          value={notes[field.key]??''} placeholder="Not reviewed / no note yet"
          onChange={e=>update(field.key,e.target.value)} />
      </label>)}
    </div>
    <div className="es01-e5-outcome" aria-live="polite">
      <strong>{packet.intake.filledCount} of {packet.intake.totalCount} note fields filled</strong>
      <p>Draft completeness only. No review status changes, clinical conclusions, or inferred efficacy.</p>
      {packet.intake.blankFields.length>0&&<p>Unfilled: {packet.intake.blankFields.map(k=>ES01_E5_FIELDS.find(f=>f.key===k).label).join(' · ')}</p>}
    </div>
    <div className="es01-e5-actions">
      <button type="button" onClick={exportPacket}>Export draft JSON</button>
      <button type="button" className="es01-e5-secondary" onClick={()=>setShowPreview(x=>!x)} aria-expanded={showPreview} aria-controls="es01-e5-preview">
        {showPreview?'Hide packet preview':'Preview JSON packet'}
      </button>
      <a href={source.source.url} target="_blank" rel="noopener noreferrer">Primary source ↗</a>
    </div>
    {showPreview&&<div id="es01-e5-preview" className="es01-e5-preview">
      <p>Preview shows the exact locally generated export. No transmission occurs.</p>
      <pre>{JSON.stringify(packet,null,2)}</pre>
    </div>}
    <p className="es01-e5-footnote">Notes are kept only in this browser tab while the page is open. Export your draft before leaving; E5 does not save it to GitHub or change source research records. <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_E5_REVIEW_HANDOFF.md" target="_blank" rel="noopener noreferrer">Read handoff method ↗</a></p>
  </section>
}
