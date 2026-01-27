import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key to bypass Row Level Security (RLS) for backend operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Missing Supabase credentials in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);