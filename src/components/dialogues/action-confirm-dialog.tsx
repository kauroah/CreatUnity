'use client';
import {useState, type ReactNode} from 'react';
import {DialogShell} from './dialog-shell';
type Tone='paper'|'pink'|'blue';
export function ActionConfirmDialog({title,eyebrow,detail,action,button,trigger,tone='paper',danger=false,fields}:{title:string;eyebrow:string;detail:string;action:(formData:FormData)=>void|Promise<void>;button:string;trigger:string;tone?:Tone;danger?:boolean;fields?:Record<string,string>}){
 const [open,setOpen]=useState(false);
 return <><button type="button" className={danger?'phase-small-button':'arrow-link arrow-dark'} onClick={()=>setOpen(true)}>{trigger} ↗</button><DialogShell open={open} onClose={()=>setOpen(false)} tone={tone}><div className="cu-dialog-eyebrow">{eyebrow}</div><h2 className="cu-dialog-title">{title}</h2><p className="cu-dialog-lead">{detail}</p><form action={action} className="cu-dialog-form">{Object.entries(fields||{}).map(([k,v])=><input type="hidden" name={k} value={v} key={k}/>)}<div className="cu-dialog-choices"><button className="cu-dialog-secondary" type="button" onClick={()=>setOpen(false)}>KEEP CURRENT / CLOSE</button></div><button className={`cu-dialog-primary ${danger?'cu-dialog-primary--danger':''}`} type="submit"><span>{button}</span><span aria-hidden="true">↗</span></button></form></DialogShell></>;
}
export function StateDialog({title,eyebrow,detail,trigger,button='CONTINUE',tone='blue',onContinue}:{title:string;eyebrow:string;detail:string;trigger:string;button?:string;tone?:Tone;onContinue?:()=>void}){
 const [open,setOpen]=useState(false);return <><button type="button" className="phase-small-button" onClick={()=>setOpen(true)}>{trigger} ↗</button><DialogShell open={open} onClose={()=>setOpen(false)} tone={tone}><div className="cu-dialog-eyebrow">{eyebrow}</div><h2 className="cu-dialog-title">{title}</h2><p className="cu-dialog-lead">{detail}</p><button type="button" className="cu-dialog-primary" onClick={()=>{setOpen(false);onContinue?.()}}><span>{button}</span><span>↗</span></button></DialogShell></>;
}
