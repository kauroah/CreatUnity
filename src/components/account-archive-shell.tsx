import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  ['MY DOSSIER','/account'],['MY WORK','/account/work'],['MY PROJECTS','/account/projects'],
  ['COLLABORATIONS','/account/collaborations'],['SAVED','/account/saved'],
  ['MESSAGES','/messages'],['NOTIFICATIONS','/notifications'],
  ['AVAILABILITY','/account/availability'],['SETTINGS','/account/settings'],
] as const;

export function AccountArchiveShell({eyebrow,title,active,children}: {
  eyebrow:string;title:string;active:string;children:ReactNode;
}) {
  return <main className="archive-page wrap">
    <div className="tiny-label archive-eyebrow">{eyebrow}</div>
    <h1 className="archive-title">{title}</h1>
    <div className="archive-layout">
      <aside className="archive-sidebar" aria-label="Account navigation">
        <nav>{links.map(([label,href])=><Link key={href} href={href}
          className={active===href?'active':''} aria-current={active===href?'page':undefined}>{label}</Link>)}</nav>
        <span className="tiny-label archive-dossier-label">CREATUNITY / PERSONAL ARCHIVE</span>
      </aside>
      <div className="archive-main">{children}</div>
    </div>
  </main>;
}

export function ArchiveEmpty({text,actionLabel,href}: {text:string;actionLabel:string;href:string}) {
  return <section className="archive-empty" aria-label="Empty archive">
    <div className="tiny-label">[ 00 / ARCHIVE EMPTY ]</div>
    <p>{text}</p>
    <div className="archive-rule" aria-hidden="true" />
    <Link className="archive-outline-action" href={href}>{actionLabel}<span aria-hidden="true">↗</span></Link>
  </section>;
}
