import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If credentials are missing, we create a dummy client or handle it gracefully
// to prevent the entire app from crashing on start.
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url';

if (!isConfigured) {
  console.warn('Supabase is not configured. Running in local-only mode.');
}

// Export a configured client or a placeholder that won't throw immediately
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder'
);

export const hasSupabaseConfig = !!isConfigured;
