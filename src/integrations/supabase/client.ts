import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// المفاتيح تُقرأ من متغيرات البيئة (.env) — لا تكتب المفاتيح هنا مباشرة
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://yebsphjbjdtsidykthzj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYnNwaGpiamR0c2lkeWt0aHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMjYwMzcsImV4cCI6MjA3MTgwMjAzN30.wDn0YrjJleY5y5VXxaRZvM16ztu63ZNvdRF2S9JAY8c';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
