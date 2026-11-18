import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{
 const origin=process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,'');
 return {rules:[{userAgent:'*',allow:'/',disallow:['/account/','/editorial/','/messages/','/notifications','/checkout/','/auth/','/login','/register','/projects/create']}],...(origin?{sitemap:`${origin}/sitemap.xml`}:{})};
}
