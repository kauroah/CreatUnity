import {createClient} from './server';
import {profileFields, type Profile} from './profile';
export async function publishedCreators(limit=48){const sb=await createClient();const {data,error}=await sb.from('profiles').select(profileFields).eq('is_published',true).order('published_at',{ascending:false}).limit(limit);return {creators:(data??[]) as Profile[],error:error?.message??null};}
