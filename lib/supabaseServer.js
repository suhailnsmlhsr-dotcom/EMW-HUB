import { createClient } from '@supabase/supabase-js';

// Service-role client — only ever used inside API routes (server), never sent to the browser.
export function supabaseServer() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
