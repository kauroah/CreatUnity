import {ResetDialog} from '@/components/dialogues/reset-dialog';
export default async function Page({searchParams}:{searchParams:Promise<{sent?:string;error?:string}>}){const params=await searchParams;return <ResetDialog sent={params.sent==='1'} error={params.error}/>;}
