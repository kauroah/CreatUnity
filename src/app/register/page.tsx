import {AuthDialog} from '@/components/dialogues/auth-dialog';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;notice?:string}>}){const q=await searchParams;return <AuthDialog mode="register" error={q.error} notice={q.notice}/>}
