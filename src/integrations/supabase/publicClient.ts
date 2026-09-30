import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// كلاينت للفورم العام بس: دايماً بيبعت كـ anon حتى لو الأدمن عامل login في نفس
// المتصفح. من غيره الطلب بيتبعت كـ authenticated، وسياسة رفع الصور في الـ storage
// مسموحة لـ anon بس، فالحجز بيترفض بـ "new row violates row-level security policy".
export const publicSupabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'sb-public-form',
    },
  }
);
