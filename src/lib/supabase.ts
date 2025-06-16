import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Check if URL is still a placeholder
if (supabaseUrl === 'your-project-url' || supabaseUrl.includes('your-project')) {
  throw new Error('VITE_SUPABASE_URL is set to a placeholder value. Please update your .env file with your actual Supabase project URL (e.g., https://your-project-id.supabase.co)');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`VITE_SUPABASE_URL is not a valid URL: "${supabaseUrl}". Please ensure it follows the format: https://your-project-id.supabase.co`);
}

// Check if anon key is still a placeholder
if (supabaseAnonKey === 'your-anon-key' || supabaseAnonKey.includes('your-anon')) {
  throw new Error('VITE_SUPABASE_ANON_KEY is set to a placeholder value. Please update your .env file with your actual Supabase anonymous key.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);