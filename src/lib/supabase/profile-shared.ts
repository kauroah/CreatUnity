export type Profile={id:string;full_name:string;role:string;city:string;bio:string;website:string|null;avatar_url:string|null;created_at:string;is_published:boolean;published_at:string|null};
export const profileFields='id,full_name,role,city,bio,website,avatar_url,created_at,is_published,published_at';
export function avatarPublicUrl(base:string, path:string|null){if(!path)return null;return `${base.replace(/\/$/,'')}/storage/v1/object/public/creator-avatars/${path.split('/').map(encodeURIComponent).join('/')}`}
