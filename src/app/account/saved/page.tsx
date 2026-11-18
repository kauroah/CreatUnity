import {redirect} from 'next/navigation';
import {getMyProfile} from '@/lib/supabase/profile';
import {AccountArchiveShell,ArchiveEmpty} from '@/components/account-archive-shell';
export const dynamic='force-dynamic';
export default async function Saved(){const {user}=await getMyProfile();if(!user)redirect('/login');return <AccountArchiveShell eyebrow="EMPTY STATE / SAVED" title="NOTHING SAVED." active="/account/saved"><ArchiveEmpty text="Сохрани то, к чему захочется вернуться." actionLabel="EXPLORE PEOPLE" href="/people"/></AccountArchiveShell>}
