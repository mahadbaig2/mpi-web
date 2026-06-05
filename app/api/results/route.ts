import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    const { data: scan, error } = await supabaseAdmin
      .from("scans")
      .select("*, reports(*)")
      .eq("id", id)
      .single();

    if (error || !scan) {
      console.error("Scan fetch error:", error, "Scan:", scan);
      return NextResponse.json({ error: "Scan not found", details: error }, { status: 404 });
    }

    const result = {
      id: scan.id,
      date: scan.created_at,
      filename: scan.filename,
      predictions: scan.predictions,
      patient_info: scan.patient_info,
      report: scan.reports?.[0]?.content || "",
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Results fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
