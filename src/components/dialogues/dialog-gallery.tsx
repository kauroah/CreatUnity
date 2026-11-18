'use client';
import {useState} from 'react';import {DialogShell} from './dialog-shell';
type Record = {title:string;eyebrow:string;detail:string;button:string;tone:'paper'|'pink'|'blue';kind?:'form'|'status'|'danger'|'preview'};
export const records:Record[]=[
{title:'WELCOME BACK.',eyebrow:'ACCESS / SIGN IN',detail:'Your next collaboration starts here.',button:'SIGN IN',tone:'paper',kind:'form'},
{title:'START YOUR FILE.',eyebrow:'ACCESS / NEW DOSSIER',detail:'A name. A role. A point of view.',button:'CREATE DOSSIER',tone:'paper',kind:'form'},
{title:'RESET ACCESS.',eyebrow:'ACCESS / RESET',detail:'We will send a private reset link.',button:'SEND RESET LINK',tone:'paper',kind:'form'},
{title:'CHECK YOUR EMAIL.',eyebrow:'ACCESS / SENT',detail:'A link is on its way to your inbox. It expires in 30 minutes.',button:'BACK TO SIGN IN',tone:'blue',kind:'status'},
{title:'BUILD A TEAM.',eyebrow:'TO / CREATOR DOSSIER',detail:'Your work feels right for this story.',button:'SEND INVITATION',tone:'pink',kind:'form'},
{title:'INVITATION FILED.',eyebrow:'PROJECT → DOSSIER',detail:'You can follow the reply in Collaborations.',button:'VIEW COLLABORATIONS',tone:'pink',kind:'status'},
{title:'APPLY TO PROJECT.',eyebrow:'OPEN CALL / PROJECT 048',detail:'Share a portfolio piece and why this opportunity speaks to you.',button:'SEND APPLICATION',tone:'blue',kind:'form'},
{title:'YOU’RE IN THE FILE.',eyebrow:'APPLICATION / SUBMITTED',detail:'Your message reached the project owner. We will notify you of a reply.',button:'VIEW APPLICATION',tone:'blue',kind:'status'},
{title:'START A CONVERSATION.',eyebrow:'CREATOR / MESSAGE',detail:'A good idea deserves a message.',button:'SEND MESSAGE',tone:'paper',kind:'form'},
{title:'SHARE THIS FILE.',eyebrow:'WORK / PUBLIC LINK',detail:'Only the public work page will be shared.',button:'COPY LINK',tone:'paper'},
{title:'SAVED TO ARCHIVE.',eyebrow:'PERSONAL COLLECTION',detail:'Find the work in your account whenever the idea comes back.',button:'OPEN SAVED',tone:'pink',kind:'status'},
{title:'YOUR PLACE IN THE SCENE.',eyebrow:'EVENT / AFTER THE SHOW',detail:'28 NOV / 18:00 / MOSCOW',button:'CONTINUE TO CHECKOUT',tone:'paper',kind:'form'},
{title:'COMPLETE YOUR PASS.',eyebrow:'ORDER / SECURE CHECKOUT',detail:'Payment must be completed through an authorized payment provider.',button:'PAY & GET PASS',tone:'paper',kind:'form'},
{title:'YOU’RE ON THE LIST.',eyebrow:'ADMISSION / CONFIRMED',detail:'Your pass is in your email.',button:'OPEN MY PASS',tone:'pink',kind:'status'},
{title:'PAYMENT NOT COMPLETE.',eyebrow:'ORDER / STILL RESERVED',detail:'Try another payment method. If charged, contact support with your order number.',button:'TRY PAYMENT AGAIN',tone:'paper',kind:'status'},
{title:'LEARN BY MAKING.',eyebrow:'WORKSHOP / ENROLLMENT',detail:'Your first fashion editorial begins here.',button:'CONTINUE TO PAYMENT',tone:'blue',kind:'form'},
{title:'MAKE ROOM TO CREATE.',eyebrow:'WORKSHOP / ENROLLED',detail:'Your programme and first brief will arrive by email.',button:'VIEW PROGRAMME',tone:'blue',kind:'status'},
{title:'ACTIVITY RECORD.',eyebrow:'TODAY / NEW',detail:'Invitations, messages, and project updates appear here.',button:'VIEW ALL NOTIFICATIONS',tone:'paper'},
{title:'ALL CAUGHT UP.',eyebrow:'NOTIFICATIONS / 00 NEW',detail:'For now, follow your curiosity.',button:'EXPLORE THE COMMUNITY',tone:'paper',kind:'status'},
{title:'NO MATCH THIS TIME.',eyebrow:'SEARCH / 00 RESULTS',detail:'Try a broader role or city and see who turns up.',button:'CLEAR FILTERS',tone:'paper',kind:'status'},
{title:'A SMALL CORRECTION.',eyebrow:'FORM / CHECK FIELDS',detail:'Check highlighted fields and try again.',button:'CONTINUE',tone:'paper',kind:'form'},
{title:'CONNECTION INTERRUPTED.',eyebrow:'UPLOAD / RETRY',detail:'Your input is saved. Reconnect and try again.',button:'RETRY UPLOAD',tone:'paper',kind:'status'},
{title:'REMOVE THIS DRAFT?',eyebrow:'WORK / DRAFT',detail:'This draft will leave your archive. Published work remains available.',button:'REMOVE DRAFT',tone:'paper',kind:'danger'},
{title:'READY TO GO PUBLIC?',eyebrow:'WORK / PRE-PUBLICATION CHECK',detail:'Cover, description, and credits are included. You can edit after publishing.',button:'PUBLISH WORK',tone:'paper',kind:'preview'},
{title:'THE WORK IS OUT.',eyebrow:'WORK / PUBLISHED',detail:'Your work is in your dossier and the public archive. Give the team their credits.',button:'OPEN WORK',tone:'pink',kind:'status'},
{title:'TAKE A PAUSE.',eyebrow:'ACCOUNT / SIGN OUT',detail:'Your drafts and saved work will be here when you return.',button:'SIGN OUT',tone:'paper',kind:'danger'},
{title:'YOUR COOKIE SETTINGS.',eyebrow:'PRIVACY / PREFERENCES',detail:'Required cookies support sign-in and remember your preferences.',button:'SAVE PREFERENCES',tone:'paper',kind:'form'},
{title:'EDIT YOUR IDENTITY.',eyebrow:'DOSSIER / PROFILE DETAILS',detail:'Name, role, and city define your public dossier.',button:'SAVE DOSSIER',tone:'paper',kind:'form'},
{title:'YOUR NEXT OPENING.',eyebrow:'DOSSIER / AVAILABILITY',detail:'Set your status and the dates when you can collaborate.',button:'UPDATE AVAILABILITY',tone:'pink',kind:'form'},
{title:'THE PROJECT IS CALLING.',eyebrow:'PROJECT / INVITATION',detail:'Your approach feels right for the second chapter.',button:'ACCEPT & OPEN BRIEF',tone:'blue',kind:'status'},
{title:'CHANGES ARE FILED.',eyebrow:'DOSSIER / SAVED',detail:'Your public profile is up to date. Your case number stays the same.',button:'VIEW MY DOSSIER',tone:'pink',kind:'status'},
{title:'LINK COPIED.',eyebrow:'PUBLIC FILE / WORK',detail:'The public link is ready to share. Private messages and drafts are never included.',button:'BACK TO WORK',tone:'paper',kind:'status'}
];
export function DialogGallery(){const [index,setIndex]=useState<number|null>(null);const active=index===null?null:records[index];return <main className="wrap listing-page"><div className="eyebrow">CREATUNITY / DESIGN SYSTEM / TRANSACTION RECORDS</div><h1>32 DIALOGUE STATES.</h1><p className="listing-intro">Interactive reference gallery based on Revision 02. Previews do not perform transactions.</p><div className="cu-gallery">{records.map((r,i)=><button type="button" key={i} className={`cu-gallery-tile cu-gallery-tile--${r.tone}`} onClick={()=>setIndex(i)}><span>{String(i+1).padStart(2,'0')} / TRANSACTION RECORD</span><strong>{r.title}</strong><small>{r.eyebrow}</small><span className="cu-gallery-open">PREVIEW ↗</span></button>)}</div>{active&&<DialogShell open={index!==null} onClose={()=>setIndex(null)} tone={active.tone} label={`CREATUNITY / TRANSACTION RECORD / ${String((index||0)+1).padStart(2,'0')}`}><div className="cu-dialog-eyebrow">{active.eyebrow}</div><h2 className="cu-dialog-title">{active.title}</h2><p className="cu-dialog-lead">{active.detail}</p>{active.kind==='form'&&<div className="cu-dialog-demo-fields"><div>NAME / SUBJECT</div><div>DETAILS / MESSAGE</div></div>}{active.kind==='status'&&<div className="cu-dialog-stamp"><span>CREAT</span><strong>{String((index||0)+1).padStart(2,'0')}</strong><span>FILED</span></div>}<button type="button" className={`cu-dialog-primary ${active.kind==='danger'?'cu-dialog-primary--danger':''}`} onClick={()=>setIndex(null)}><span>{active.button} / PREVIEW</span><span>↗</span></button><p className="cu-dialog-footnote">Design preview only — this button closes the preview.</p></DialogShell>}</main>}
