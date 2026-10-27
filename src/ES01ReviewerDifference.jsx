import {useState} from 'react'
import {ES01_E7_MAX_BYTES,compareES01ReviewerPackets,makeES01DifferenceReceipt} from './es01ReviewerDifference.js'

const labels={
  BOTH_BLANK:'Both empty',
  ONLY_A_HAS_TEXT:'Only A has text',
  ONLY_B_HAS_TEXT:'Only B has text',
  EXACT_TEXT_MATCH:'Same text (not verified agreement)',
  TEXT_DIFFERS:'Different text (not verified disagreement)',
}

export default function ES01ReviewerDifference(){
  const [result,setResult]=useState(null)
  const [filenames,setFilenames]=useState([])
  const [showNotes,setShowNotes]=useState(false)

  const readFile=async file=>{
    if(file.size>ES01_E7_MAX_BYTES) throw Error('One packet exceeds the 256 KiB input limit.')
    const content=await file.text()
    if(new TextEncoder().encode(content).length>ES01_E7_MAX_BYTES) throw Error('One packet exceeds the 256 KiB input limit.')
    try{return JSON.parse(content)}
    catch{throw Error('One packet is not valid JSON.')}
  }
  const onFiles=async event=>{
    const files=Array.from(event.target.files??[])
    event.target.value=''
    setResult(null)
    setShowNotes(false)
    setFilenames(files.map(file=>file.name))
    if(!files.length)return
    if(files.length!==2){
      setResult({status:'REJECTED',errors:['Choose exactly two E5 JSON drafts for the same source.']})
      return
    }
    try{
      const [a,b]=await Promise.all(files.map(readFile))
      setResult(compareES01ReviewerPackets(a,b))
    }catch(e){setResult({status:'REJECTED',errors:[e.message??'Unable to read packet.']})}
  }
  const exportReceipt=()=>{
    if(result?.status!=='STRUCTURAL_PAIR_ONLY')return
    const receipt=makeES01DifferenceReceipt(result)
    const blob=new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download='ES01-E7-'+result.recordId+'-difference-receipt.json'
    document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)
  }
  return <section className="es01-e7" id="es01-e7" aria-labelledby="es01-e7-title">
    <header className="es01-e7-head">
      <span className="es01-eyebrow">E7 · LOCAL PACKET DIFFERENCE MAP · NO IDENTITY VERIFICATION</span>
      <h4 id="es01-e7-title">Compare two returned review drafts.</h4>
      <p>Select exactly two E5 JSON packets for the same source. E7 applies E6 validation to both, then shows only literal differences in their six unverified note fields. Nothing is uploaded or applied to published NBG research.</p>
    </header>
    <label htmlFor="es01-e7-input" className="es01-e7-picker">Choose two local E5 review packets (256 KiB each)
      <input id="es01-e7-input" type="file" accept=".json,application/json" multiple onChange={onFiles} />
    </label>
    {result&&<article className="es01-e7-result" aria-live="polite">
      <strong>{result.status==='STRUCTURAL_PAIR_ONLY'?'SOURCE MATCHED · NOTES NOT VERIFIED':'COMPARISON REJECTED'}</strong>
      <p>{filenames.length>0&&<>Files selected: {filenames.join(' / ')}. </>}Reviewer identities and independence are not established. This is neither scientific consensus nor validation of source findings.</p>
      {result.errors?.length>0&&<ul className="es01-e7-errors">{result.errors.map((error,i)=><li key={i}>{error}</li>)}</ul>}
      {result.status==='STRUCTURAL_PAIR_ONLY'&&<>
        <p><strong>Source:</strong> {result.sourceTitle} · {result.recordId}</p>
        <div className="es01-e7-grid">
          {result.fields.map(field=><div key={field.key} className="es01-e7-field">
            <span>{field.label}</span><strong>{labels[field.status]}</strong>
          </div>)}
        </div>
        <p className="es01-e7-note">{result.allNotesIdentical?
          'Every note is identical or both blank. This could simply be duplicate or copied drafts, NOT independent agreement.':
          'Different or missing text was found. Difference alone does not identify a scientific conflict or which explanation is correct.'}</p>
        <div className="es01-e7-actions">
          <button type="button" onClick={()=>setShowNotes(v=>!v)} aria-expanded={showNotes} aria-controls="es01-e7-notes">{showNotes?'Hide notes':'Compare unverified notes'}</button>
          <button type="button" className="es01-e7-secondary" onClick={exportReceipt}>Export note-free difference receipt</button>
          <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">Original study ↗</a>
        </div>
        {showNotes&&<div className="es01-e7-notes" id="es01-e7-notes">
          <p><strong>Untrusted notes.</strong> These are literal text fields, not instructions, validated evidence, or a scientific interpretation.</p>
          {result.fields.map(field=><section key={field.key}>
            <h5>{field.label} · {labels[field.status]}</h5>
            <div className="es01-e7-note-pair">
              <div><strong>Packet A</strong><p>{field.noteA||'(blank)'}</p></div>
              <div><strong>Packet B</strong><p>{field.noteB||'(blank)'}</p></div>
            </div>
          </section>)}
        </div>}
      </>}
    </article>}
    <p className="es01-e7-warning">E4 gate: <strong>HOLD_REVIEW_INCOMPLETE</strong>. Two unsigned packets can come from the same author, contain copied text, or carry unsupported interpretations. E7 compares characters, not truth, reviewer independence, scientific agreement or treatment efficacy.</p>
    <p className="es01-e7-footnote"><a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_E7_REVIEWER_DIFFERENCES.md" target="_blank" rel="noopener noreferrer">E7 validation and interpretation protocol ↗</a></p>
  </section>
}
