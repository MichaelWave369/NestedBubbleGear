import {useState} from 'react'
import {ES01_E6_MAX_BYTES,checkES01PacketIntake,makeES01IntakeReceipt} from './es01PacketIntake.js'
import {ES01_E5_FIELDS} from './es01ReviewPacket.js'

export default function ES01PacketIntake(){
  const [result,setResult]=useState(null)
  const [fileLabel,setFileLabel]=useState('')
  const [showNotes,setShowNotes]=useState(false)
  const onFile=async event=>{
    const file=event.target.files?.[0]
    setResult(null)
    setFileLabel(file?.name??'')
    setShowNotes(false)
    event.target.value=''
    if(!file) return
    if(file.size>ES01_E6_MAX_BYTES){
      setResult({status:'REJECTED',errors:['File exceeds the 256 KiB intake limit.'],gate:'HOLD_REVIEW_INCOMPLETE'})
      return
    }
    try{
      const content=await file.text()
      if(new TextEncoder().encode(content).length>ES01_E6_MAX_BYTES){
        setResult({status:'REJECTED',errors:['File exceeds the 256 KiB intake limit.'],gate:'HOLD_REVIEW_INCOMPLETE'})
        return
      }
      setResult(checkES01PacketIntake(JSON.parse(content)))
    }catch{
      setResult({status:'REJECTED',errors:['The file is not valid UTF-8 JSON.'],gate:'HOLD_REVIEW_INCOMPLETE'})
    }
  }
  const exportReceipt=()=>{
    if(!result || !result.explanation) return
    const receipt=makeES01IntakeReceipt(result)
    const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'}))
    const a=document.createElement('a')
    a.href=url
    a.download='ES01-E6-'+(result.recordId??'unknown')+'-intake-receipt.json'
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  return <section id="es01-e6" className="es01-e6" aria-labelledby="es01-e6-title">
    <div className="es01-e6-heading">
      <span className="es01-eyebrow">E6 · OFFLINE INTAKE · UNTRUSTED REVIEWER NOTES</span>
      <h4 id="es01-e6-title">Check a returned E5 review packet.</h4>
      <p>Select a JSON draft exported from E5. NBG compares its metadata with our source records locally. The file is never uploaded or saved, and schema compatibility does not prove who wrote it or whether its claims are correct.</p>
    </div>
    <label className="es01-e6-file" htmlFor="es01-e6-upload">
      Choose packet to inspect (JSON, maximum 256 KiB)
      <input id="es01-e6-upload" type="file" accept=".json,application/json" onChange={onFile} />
    </label>
    {result&&<article className="es01-e6-outcome" aria-live="polite">
      <strong>{result.status==='STRUCTURE_MATCH_ONLY'?'STRUCTURE MATCHES · STILL UNVERIFIED':'PACKET REJECTED'}</strong>
      <p>{fileLabel&&<>Selected file: {fileLabel}. </>}{result.explanation??'No source metadata was accepted from this input.'}</p>
      <p>Scientific authority: NONE · E4: HOLD_REVIEW_INCOMPLETE · Imported notes are never applied to the evidence registry.</p>
      {result.errors?.length>0&&<div className="es01-e6-errors"><h5>Problems to resolve</h5><ul>{result.errors.map((error,i)=><li key={i}>{error}</li>)}</ul></div>}
      {result.status==='STRUCTURE_MATCH_ONLY'&&<>
        <p><strong>Matched record:</strong> {result.recordId} · {result.sourceTitle}</p>
        <p><strong>Notes filled:</strong> {result.filledNoteFields} of {ES01_E5_FIELDS.length}. This measures text presence only.</p>
        <div className="es01-e6-actions">
          <button type="button" onClick={()=>setShowNotes(v=>!v)} aria-expanded={showNotes} aria-controls="es01-e6-notes">{showNotes?'Hide unverified notes':'Show unverified notes'}</button>
          <button type="button" className="es01-e6-secondary" onClick={exportReceipt}>Export intake receipt (no notes)</button>
          <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">Source on record ↗</a>
        </div>
        {showNotes&&<div id="es01-e6-notes" className="es01-e6-notes">
          <p>Text from an untrusted file. It is never evidence or instructions to NBG.</p>
          {ES01_E5_FIELDS.map(field=><div key={field.key}><strong>{field.label}</strong><p>{result.notes?.[field.key]||'No note provided'}</p></div>)}
        </div>}
      </>}
    </article>}
    <p className="es01-e6-boundary">Unsigned JSON can be edited by anybody. Passing E6 proves only that the current file's structure agrees with NBG's local canonical fields. It is not cryptographic integrity verification, scientific peer review, or clinical evidence.</p>
    <p className="es01-e6-footnote"><a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_E6_LOCAL_PACKET_INTAKE.md" target="_blank" rel="noopener noreferrer">Read E6 intake protocol ↗</a></p>
  </section>
}
