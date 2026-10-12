import {useEffect,useRef,useState} from 'react'
import {NAV_DIRECT,NAV_GROUPS,NAV_ORDER,groupForHash} from './labNavigation.js'
import './labNavigation.css'

const currentHash=()=>typeof window==='undefined'?'#top':window.location.hash||'#top'

// Deliberately click-operated: no hover-only menus or inaccessible tiny links.
// The native button + anchor sequence supports mouse, touch and keyboard.
export default function LabNavigation(){
 const [openGroup,setOpenGroup]=useState(null)
 const [mobileOpen,setMobileOpen]=useState(false)
 const [activeHash,setActiveHash]=useState(currentHash)
 const root=useRef(null)
 const trigger=useRef(null)
 const mobileTrigger=useRef(null)
 const groupById=Object.fromEntries(NAV_GROUPS.map(group=>[group.id,group]))
 const directByHref=Object.fromEntries(NAV_DIRECT.map(link=>[link.href,link]))

 useEffect(()=>{
  const sync=()=>setActiveHash(currentHash())
  window.addEventListener('hashchange',sync)
  return ()=>window.removeEventListener('hashchange',sync)
 },[])

 useEffect(()=>{
  if(!openGroup&&!mobileOpen)return
  const outside=event=>{
   if(root.current&&!root.current.contains(event.target)){
    setOpenGroup(null)
    setMobileOpen(false)
   }
  }
  const escape=event=>{
   if(event.key!=='Escape')return
   event.preventDefault()
   setOpenGroup(null)
   setMobileOpen(false)
   ;(mobileOpen?mobileTrigger:trigger).current?.focus()
  }
  document.addEventListener('pointerdown',outside)
  document.addEventListener('keydown',escape)
  return ()=>{
   document.removeEventListener('pointerdown',outside)
   document.removeEventListener('keydown',escape)
  }
 },[openGroup,mobileOpen])

 const closeMenus=()=>{setOpenGroup(null);setMobileOpen(false)}
 const goTo=href=>{
  if(href.startsWith('#'))setActiveHash(href)
  closeMenus()
 }
 const toggleGroup=(id,event)=>{
  trigger.current=event.currentTarget
  setOpenGroup(previous=>previous===id?null:id)
 }
 const renderDirect=link=>{
  const external=!!link.external
  return <a key={link.href} className="lab-nav-link"
   href={link.href} onClick={()=>goTo(link.href)}
   aria-current={activeHash===link.href?'location':undefined}
   {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})}>
   {link.label}{external&&<span aria-hidden="true"> ↗</span>}
  </a>
 }
 const renderGroup=group=>{
  const expanded=openGroup===group.id
  const selected=groupForHash(activeHash)===group.id
  return <div key={group.id} className={'lab-nav-group'+(selected?' has-current':'')}>
   <button type="button" className="lab-nav-trigger" aria-expanded={expanded}
    aria-controls={'lab-nav-panel-'+group.id} onClick={event=>toggleGroup(group.id,event)}>
    {group.label}<span className="lab-nav-chevron" aria-hidden="true">⌄</span>
   </button>
   <div className="lab-nav-dropdown" id={'lab-nav-panel-'+group.id} hidden={!expanded}>
    <span className="lab-nav-dropdown-heading">{group.label} · {group.items.length} destinations</span>
    {group.items.map(item=><a key={item.href} href={item.href}
      className="lab-nav-item" aria-current={activeHash===item.href?'location':undefined}
      onClick={()=>goTo(item.href)}>{item.label}<span aria-hidden="true">↗</span></a>)}
   </div>
  </div>
 }

 return <header className="nav lab-header" ref={root}>
  <a className="brand lab-brand" href="#top" onClick={()=>goTo('#top')}>
   <span>Φ</span> NBG Research Lab
  </a>
  <button ref={mobileTrigger} type="button" className="lab-nav-mobile-toggle" aria-expanded={mobileOpen}
   aria-controls="lab-nav-links" onClick={event=>{
    trigger.current=event.currentTarget
    setMobileOpen(previous=>!previous)
    setOpenGroup(null)
   }}>
   <span aria-hidden="true">{mobileOpen?'×':'☰'}</span> {mobileOpen?'Close':'Explore'}
  </button>
  <nav id="lab-nav-links" className={'lab-nav-links'+(mobileOpen?' is-open':'')}
   aria-label="Primary research navigation">
   {NAV_ORDER.map(item=>{
    if(item.type==='group')return renderGroup(groupById[item.id])
    return renderDirect(directByHref[item.href])
   })}
  </nav>
 </header>
}
