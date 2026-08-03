import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  ENV.supabaseUrl,
  ENV.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type Database = any;
