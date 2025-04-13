import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import config from "../config.json"

// These environment variables need to be set in your Vercel project
const supabaseUrl = config.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = config.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl as string, supabaseAnonKey as string)

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}
