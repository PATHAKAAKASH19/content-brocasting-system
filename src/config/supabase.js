import { createClient } from "@supabase/supabase-js";
import config from "./config.js";

const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase credentials missing! Check your .env file");
  process.exit(1);
}


const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("Supabase client initialized");

export default supabase;
