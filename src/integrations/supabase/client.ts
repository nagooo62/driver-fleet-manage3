import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// المفاتيح تُقرأ من متغيرات البيئة (.env) فقط — لا fallback إنتاجي في الكود
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

if (!DEMO_MODE && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error(
    'متغيرات البيئة ناقصة: VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY مطلوبة خارج الوضع التجريبي — انسخ .env.example إلى .env واملأ القيم',
  );
}

// في الوضع التجريبي لا يُجرى أي اتصال فعلي — قيم وهمية صالحة الشكل فقط لإنشاء العميل
export const supabase = createClient<Database>(
  SUPABASE_URL ?? 'https://demo.invalid.supabase.co',
  SUPABASE_PUBLISHABLE_KEY ?? 'demo-anon-key',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
