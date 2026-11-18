import {UpdatePasswordDialog} from '@/components/dialogues/reset-dialog';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;token?:string}>}){const {error,token}=await searchParams;return <UpdatePasswordDialog error={error} token={token}/>}
