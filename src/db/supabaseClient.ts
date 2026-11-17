import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smpmyhqppfryvhsyzuzu.supabase.co';
const supabaseKey = 'sb_publishable_RcjM7DwIkSAk_WuX5Bxowg_baUgHd6s';

export const supabase = createClient(supabaseUrl, supabaseKey);
