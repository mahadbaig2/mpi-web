import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface MigrationItem {
  id: string;
  date: string;
  filename: string;
  predictions: Record<string, unknown>;
  report?: string;
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server not configured with admin key" }, { status: 500 });
  }

  try {
    const { items, user_email }: { items: MigrationItem[]; user_email?: string } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const results = [];

    for (const item of items) {
      // Validate and convert legacy timestamp IDs to UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
      const targetId = isValidUUID ? item.id : crypto.randomUUID();

      // 1. Upsert Scan (service_role bypasses RLS)
      const { error: scanError } = await supabaseAdmin.from("scans").upsert({
        id: targetId,
        created_at: item.date,
        filename: item.filename,
        predictions: item.predictions,
        user_email: user_email || null,
        user_id: null,
        model_source: "Local Migration",
      });

      if (scanError) {
        console.error(`Scan insert failed for ${item.id}:`, scanError);
        results.push({ id: item.id, success: false, error: scanError.message });
        continue;
      }

      // 2. Upsert Report (if present)
      if (item.report) {
        const { error: reportError } = await supabaseAdmin.from("reports").upsert({
          scan_id: targetId,
          content: item.report,
          user_id: null,
        });

        if (reportError) {
          console.error(`Report insert failed for scan ${targetId}:`, reportError);
        }
      }

      results.push({ id: item.id, targetId, success: true });
    }

    const failed = results.filter(r => !r.success);
    return NextResponse.json({
      success: true,
      migrated: results.filter(r => r.success).length,
      failed: failed.length,
      errors: failed,
    });
  } catch (err) {
    console.error("Migration API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
