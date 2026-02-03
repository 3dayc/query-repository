import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // Only warn in dev console, don't crash app immediately to allow UI layout preview
    console.warn('Supabase URL or Anon Key is missing. Check .env.local');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
