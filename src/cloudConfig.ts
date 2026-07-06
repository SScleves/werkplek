// ---------------------------------------------------------------------------
// Cloud sync configuration.
//
// Paste the two values from your Supabase project here:
//   Supabase dashboard → Project Settings → API
//   • Project URL   → SUPABASE_URL
//   • anon public   → SUPABASE_ANON_KEY   (safe to commit — RLS protects data)
//
// Leave them blank to run FlowDeck in purely-local mode (no login, no sync).
// ---------------------------------------------------------------------------

// 2026-07-07: previous Supabase project (efwwkiwrdfuwrsufyxzo) was deleted upstream —
// login could never succeed, so the app runs LOCAL-ONLY until a new project exists.
// To restore sync: new supabase.com project → run supabase/schema.sql → paste URL + anon key here.
export const SUPABASE_URL = ''
export const SUPABASE_ANON_KEY = ''

export const cloudEnabled = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
