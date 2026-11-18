'use client';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {createClient as createBrowserClient} from '@/lib/supabase/browser';
import {Menu,X,ArrowUpRight} from 'lucide-react';
const nav=[['PEOPLE','/people'],['WORK','/work'],['MAGAZINE','/magazine'],['EVENTS','/events'],['EDUCATION','/education']];
export function Logo({inverse=false}:{inverse?:boolean}){return <Link href="/" aria-label="CREATUNITY home" className={'wordmark brand-logo '+(inverse?'inverse':'')}><Image src="/brand/creatunity-logo.png" alt="CREATUnity" width={500} height={145} priority className="brand-logo-image" /></Link>}
export function Header(){
  const [open,setOpen]=useState(false);
  const [hasUnreadActivity,setHasUnreadActivity]=useState(false);
  const path=usePathname();
  useEffect(()=>{
    const sb=createBrowserClient();
    let alive=true;
    let activeUser:string|null=null;
    const update=async()=>{
      const response=await fetch('/api/auth/me',{cache:'no-store'});
      if(!response.ok)throw new Error('Could not read the current account.');
      const {user}=await response.json() as {user:{id:string}|null};
      if(!alive)return;
      activeUser=user?.id ?? null;
      if(!activeUser){setHasUnreadActivity(false);return;}
      const {count,error}=await sb.from('notifications').select('id',{count:'exact',head:true}).eq('recipient_user_id',activeUser).is('read_at',null);
      if(alive && !error)setHasUnreadActivity((count??0)>0);
    };
    void update();
    const channel=sb.channel('header-unread-activity').on('postgres_changes',{event:'*',schema:'public',table:'notifications'},()=>{void update();}).subscribe();
    return ()=>{alive=false;void sb.removeChannel(channel)};
  },[path]);
  return <header className="header wrap">
    <Logo/>
    <nav className={'main-nav '+(open?'nav-open':'')} aria-label="Main navigation">{nav.map(([label,href])=><Link onClick={()=>setOpen(false)} aria-current={path===href?'page':undefined} className={path===href?'current':''} href={href} key={href}>{label}</Link>)}</nav>
    <nav className="nav-end" aria-label="Account navigation">
      <Link href="/search" aria-current={path==='/search'?'page':undefined}>SEARCH</Link>
      <Link href="/account" className="profile-nav-link" aria-current={path.startsWith('/account')?'page':undefined}>PROFILE{hasUnreadActivity&&<span className="profile-unread-dot" aria-label="Unread activity" title="Unread activity"/>}</Link>
    </nav>
    <button className="mobile-menu" onClick={()=>setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>{open?<X size={21}/>:<Menu size={21}/>}</button>
  </header>;
}
export function Footer(){return <footer className="footer"><div className="wrap"><div className="footer-main"><Logo inverse/><div><h2>YOUR NEXT COLLABORATION<br/>STARTS WITH A NAME.</h2><Link href="/people" className="footer-link">FIND YOUR PEOPLE <ArrowUpRight size={15}/></Link></div></div><div className="footer-bottom"><span>CREATUNITY.WORLD / 2026</span><div>{nav.map(([label,href])=><Link href={href} key={href}>{label}</Link>)}</div><span>TERMS / PRIVACY</span></div></div></footer>}
export function ArrowLink({href,children,dark=false,className=''}:{href:string;children:React.ReactNode;dark?:boolean;className?:string}){return <Link href={href} className={`arrow-link ${dark?'arrow-dark':''} ${className}`}><span>{children}</span><ArrowUpRight size={17} strokeWidth={1.5}/></Link>}
export function Eyebrow({children}:{children:React.ReactNode}){return <div className="eyebrow">{children}</div>}
