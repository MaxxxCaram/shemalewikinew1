import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qtuzpswxzengqoqqwtpt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Public directory — no session/auto-refresh needed. Disabling auto-refresh of
// the auth token avoids the "Navigator LockManager lock" uncaught error that
// Supabase throws on visibility change (navigator.locks contention) and which
// can freeze the main thread when multiple tabs are open.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
