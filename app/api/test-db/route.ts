import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!supabaseAdmin) return new NextResponse("No admin", { status: 500 });
  
  const { data: scans, error: scanErr } = await supabaseAdmin.from("scans").select("*").order("created_at", { ascending: false }).limit(2);
  const { data: reports, error: repErr } = await supabaseAdmin.from("reports").select("*").order("created_at", { ascending: false }).limit(2);

  const out = JSON.stringify({
    scans: scans || scanErr,
    reports: reports || repErr
  }, null, 2);

  return new NextResponse(out, { headers: { 'Content-Type': 'text/plain' } });
}
