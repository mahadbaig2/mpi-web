import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log("Checking scans...");
  const { data: scans, error: scanErr } = await supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(2);
  console.log("Latest scans:", JSON.stringify(scans, null, 2));
  if (scanErr) console.error("Scans error:", scanErr);

  console.log("Checking reports...");
  const { data: reports, error: repErr } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(2);
  console.log("Latest reports:", JSON.stringify(reports, null, 2));
  if (repErr) console.error("Reports error:", repErr);
}

check();
