import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, cloudEnabled } from '../cloudConfig'

// Only create a real client when configured. The placeholder URL keeps the
// module importable in local-only mode without throwing.
export const supabase: SupabaseClient = createClient(
  cloudEnabled() ? SUPABASE_URL : 'http://localhost:54321',
  cloudEnabled() ? SUPABASE_ANON_KEY : 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'flowdeck-auth',
    },
  },
)
