'use client';
import {useEffect,useRef,useId,type ReactNode} from 'react';
import {X} from 'lucide-react';
export function DialogShell({open,onClose,children,tone='paper',label='CREATUNITY / TRANSACTION RECORD',titleId}:{open:boolean;onClose:()=>void;children:ReactNode;tone?:'paper'|'pink'|'blue';label?:string;titleId?:string}){
 const ref=useRef<HTMLDialogElement>(null);const fallbackId=useId();
 useEffect(()=>{const node=ref.current;if(!node)return;if(open&&!node.open)node.showModal();if(!open&&node.open)node.close();},[open]);
 return <dialog ref={ref} className={`cu-dialog cu-dialog--${tone}`} aria-labelledby={titleId||fallbackId} onClose={onClose} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="cu-dialog-inner"><div className="cu-dialog-top"><span>{label}</span><button type="button" onClick={onClose} aria-label="Close dialog" className="cu-dialog-close"><X size={18} strokeWidth={1.5}/></button></div><div className="cu-dialog-content" id={titleId||fallbackId}>{children}</div></div></dialog>;
}
export function DialogButton({children,disabled=false,type='submit'}:{children:ReactNode;disabled?:boolean;type?:'submit'|'button'}){return <button type={type} className="cu-dialog-primary" disabled={disabled}><span>{children}</span><span aria-hidden="true">↗</span></button>}
