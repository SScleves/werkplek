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

export const SUPABASE_URL = 'https://efwwkiwrdfuwrsufyxzo.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd3draXdyZGZ1d3JzdWZ5eHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTEyMTgsImV4cCI6MjA5Njc4NzIxOH0.p3VAHvyng6q98C_n4kNppt-VQI5lbdL5HIzbaeM-A6E'

export const cloudEnabled = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
