import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://hhjwymyipuussthhuelx.supabase.co';
const defaultKey = 'sb_publishable_7JvbYaveFbrnSHGZhvBqUA_GP26woKX';

let rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env?.VITE_SUPABASE_URL || defaultUrl;
let supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env?.VITE_SUPABASE_ANON_KEY || defaultKey;

if (rawUrl.includes('/rest/v1')) {
  rawUrl = rawUrl.split('/rest/v1')[0];
}
const supabaseUrl = rawUrl.replace(/\/+$/, '');

export const supabase = createClient(supabaseUrl || defaultUrl, supabaseAnonKey || defaultKey);
