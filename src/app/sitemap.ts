import type {MetadataRoute} from 'next';
import {createPublicClient} from '@/lib/supabase/server';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const origin=process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,'');if(!origin)return [];
 const pages=['','people','work','magazine','events','education','projects'];
 const entries:MetadataRoute.Sitemap=pages.map(path=>({url:`${origin}/${path}`,changeFrequency:'weekly',priority:path===''?1:0.6}));
 try{
  const sb=createPublicClient();
  const catalog=[['magazine_articles','magazine'],['fashion_events','events'],['workshops','education']] as const;
  for(const [table,route] of catalog){const {data,error}=await sb.from(table).select('slug').eq('is_published',true).limit(1000);if(!error&&data)for(const row of data)entries.push({url:`${origin}/${route}/${encodeURIComponent(row.slug)}`,changeFrequency:'monthly',priority:0.5});}
 }catch{/* Site can still expose static URLs when database is temporarily unavailable. */}
 return entries;
}
