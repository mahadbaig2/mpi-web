import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const { data: scans, error: fetchError } = await supabaseAdmin
      .from("scans")
      .select("*, reports(*)")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Fetch scans failed:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(scans);
  } catch (err) {
    console.error("Scans API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const email = searchParams.get("email");

  if (!id || !email) {
    return NextResponse.json({ error: "Scan id and email are required" }, { status: 400 });
  }

  try {
    const { data: scan, error: fetchError } = await supabaseAdmin
      .from("scans")
      .select("id")
      .eq("id", id)
      .eq("user_email", email)
      .single();

    if (fetchError || !scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    await supabaseAdmin.from("reports").delete().eq("scan_id", id);

    const { error: deleteError } = await supabaseAdmin
      .from("scans")
      .delete()
      .eq("id", id)
      .eq("user_email", email);

    if (deleteError) {
      console.error("Delete scan failed:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Scans DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
