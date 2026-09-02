import { createClient } from '@supabase/supabase-js';

// Anon-key client — safe to use in the browser. RLS only allows SELECT with this key.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
