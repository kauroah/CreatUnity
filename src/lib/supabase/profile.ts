import { createClient } from './server';
import { getCurrentUser, type AppUser } from '@/lib/auth';
import { profileFields } from './profile-shared';
import type { Profile } from './profile-shared';

export { profileFields, avatarPublicUrl } from './profile-shared';
export type { Profile } from './profile-shared';

export async function getMyProfile(): Promise<{ user: AppUser | null; profile: Profile | null }> {
  const user = await getCurrentUser();
  if (!user) return { user: null, profile: null };
  const sb = await createClient();
  const { data, error } = await sb.from('profiles').select(profileFields).eq('id', user.id).maybeSingle();
  if (error) {
    console.error('Failed to load dossier:', error.message);
    return { user, profile: null };
  }
  return { user, profile: (data as Profile | null) };
}
