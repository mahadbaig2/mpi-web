import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client for use in the browser (Anon key)
const dummyUrl = "https://placeholder-id.supabase.co";
const dummyKey = "placeholder-key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables missing! Using placeholder values for build time.");
}

export const supabase = createClient(
  supabaseUrl || dummyUrl,
  supabaseAnonKey || dummyKey
);

// Client for use in the server (Service Role key) 
// We only initialize this if the key is present (Server-side only)
if (typeof window === "undefined" && (!supabaseUrl || !supabaseServiceKey)) {
  console.warn("Supabase Admin key missing. Server-side database operations may fail.");
}

export const supabaseAdmin = 
  typeof window === "undefined" && supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

