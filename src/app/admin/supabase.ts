import { Database } from '@/types/supabase'
import { createClient } from '@supabase/supabase-js'

/**
 * Keeps the admin sign-in apart from the anonymous session used to host and
 * play, so signing in here doesn't take over games running in this browser.
 */
export const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storageKey: 'supaquiz-admin-auth', detectSessionInUrl: false } }
)
