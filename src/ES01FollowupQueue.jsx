import {useState} from 'react'
import {compareES01ReviewerPackets} from './es01ReviewerDifference.js'
import {ES01_E8_ACTIONS,ES01_E8_MAX_BYTES,makeES01FollowupQueue} from './es01FollowupQueue.js'

const stateLabel={
  BOTH_BLANK:'Both blank',
  ONLY_A_HAS_TEXT:'Only packet A has a note',
  ONLY_B_HAS_TEXT:'Only packet B has a note',
  EXACT_TEXT_MATCH:'Exact text match (not independent agreement)',
  TEXT_DIFFERS:'Different text (not established scientific disagreement)',
}

export default function ES01FollowupQueue(){
  const [packets,setPackets]=useState(null)
  const [filenames,setFilenames]=useState([])
  const [error,setError]=useState('')
  const [entries,setEntries]=useState({})
  const comparison=packets?compareES01ReviewerPackets(...packets):null
  const update=(key,name,value)=>setEntries(prev=>({...prev,[key]:{...(prev[key]??{}),[name]:value}}))
  const inspect=async file=>{
    if(file.size>ES01_E8_MAX_BYTES)throw Error('Each JSON packet must be at most 256 KiB')
    const content=await file.text()
    if(new TextEncoder().encode(content).length>ES01_E8_MAX_BYTES)throw Error('One JSON packet exceeds 256 KiB')
    try{return JSON.parse(content)}
    catch{throw Error('One file is not valid JSON')}
  }
  const onFiles=async event=>{
    const files=Array.from(event.target.files??[])
    event.target.value=''
    setPackets(null);setEntries({});setError('');setFilenames(files.map(f=>f.name))
    if(!files.length)return
    if(files.length!==2){setError('Select exactly two E5 packets for the same study.');return}
    try{
      const next=await Promise.all(files.map(inspect))
      const result=compareES01ReviewerPackets(...next)
      if(result.status!=='STRUCTURAL_PAIR_ONLY'){
        setError(result.errors.join('; '));return
      }
      setPackets(next)
    }catch(e){setError(e.message??'Cannot inspect these files')}
  }
  const exportQueue=()=>{
    if(!packets||comparison?.status!=='STRUCTURAL_PAIR_ONLY')return
    try{
      const result=makeES01FollowupQueue(packets[0],packets[1],entries)
      const blob=new Blob([JSON.stringify(result,null,2)+'\n'],{type:'application/json;charset=utf-8'})
      const url=URL.createObjectURL(blob)
      const a=document.createElement('a')
      a.href=url
      a.download='ES01-E8-'+result.recordId+'-open-questions.json'
      document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)
    }catch(e){setError(e.message??'Could not export the draft queue')}
  }
  return <section id="es01-e8" className="es01-e8" aria-labelledby="es01-e8-title">
    <header className="es01-e8-head">
      <span className="es01-eyebrow">E8 · UNRESOLVED REVIEW QUESTIONS · NO AUTOMATED ADJUDICATION</span>
      <h4 id="es01-e8-title">Turn reviewer differences into a research follow-up queue.</h4>
      <p>Import two E5 reviewer packets, identify which source checks or methodological clarifications are needed, and export a local draft action queue. No reviewer is declared right, and no scientific claim is approved.</p>
    </header>
    <label className="es01-e8-picker" htmlFor="es01-e8-files">
      Choose two E5 JSON packets (256 KiB each)
      <input id="es01-e8-files" type="file" multiple accept=".json,application/json" onChange={onFiles} />
    </label>
    {(error||comparison)&&<div className="es01-e8-status" aria-live="polite">
      <strong>{error?'INTAKE REJECTED':'SOURCE MATCH ONLY · NO VERIFICATION'}</strong>
      {filenames.length>0&&<p>Selected: {filenames.join(' / ')}</p>}
      {error&&<p>{error}</p>}
      {comparison&&<p>{comparison.recordId} · {comparison.sourceTitle}. E4 status: HOLD_REVIEW_INCOMPLETE.</p>}
    </div>}
    {comparison?.status==='STRUCTURAL_PAIR_ONLY'&&<div className="es01-e8-workspace">
      {comparison.fields.map(field=><div className="es01-e8-item" key={field.key}>
        <div className="es01-e8-item-head"><strong>{field.label}</strong><span>{stateLabel[field.status]}</span></div>
        <label htmlFor={'es01-e8-action-'+field.key}>Next documentary action
          <select id={'es01-e8-action-'+field.key} value={entries[field.key]?.action??'NOT_SELECTED'}
            onChange={e=>update(field.key,'action',e.target.value)}>
            {ES01_E8_ACTIONS.map(action=><option value={action.id} key={action.id}>{action.label}</option>)}
          </select>
        </label>
        <label htmlFor={'es01-e8-question-'+field.key}>Open question for human review (optional)
          <textarea id={'es01-e8-question-'+field.key} maxLength={1200} rows={2}
            placeholder="What should an independent reader verify from the primary source?"
            value={entries[field.key]?.question??''}
            onChange={e=>update(field.key,'question',e.target.value)} />
        </label>
      </div>)}
      <p className="es01-e8-boundary">All six fields remain <strong>UNRESOLVED_NOT_EVALUATED</strong>, even when questions are filled. E8 omits the original reviewer-note text from its export and stores nothing on a server.</p>
      <div className="es01-e8-actions">
        <button type="button" onClick={exportQueue}>Export E8 open-questions JSON</button>
        <a href={comparison.sourceUrl} target="_blank" rel="noopener noreferrer">Check original source ↗</a>
      </div>
    </div>}
    <p className="es01-e8-footnote">Unsigned packets do not prove reviewer identity or independence. This software records follow-up tasks, not agreement, discovery or treatment evidence. <a href="https://github.com/MichaelWave369/NestedBubbleGear/blob/main/docs/ES01_E8_REVIEW_FOLLOWUPS.md" target="_blank" rel="noopener noreferrer">E8 methods and boundaries ↗</a></p>
  </section>
}
