// Supabase connection utility
// This file handles connecting to Supabase PostgreSQL database

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.'
  );
}

// Create and export Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

