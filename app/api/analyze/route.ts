import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictions, filename, scan_id, user_email, patient_info } = body;

    if (!predictions) {
      return NextResponse.json({ error: "No predictions provided" }, { status: 400 });
    }

    // Generate the deterministic report
    const report = generateRuleBasedReport(predictions, patient_info);

    // Save report to Supabase with user_email
    try {
      if (scan_id && supabaseAdmin) {
        const { error: insertError } = await supabaseAdmin.from("reports").insert({
          scan_id,
          user_email: user_email || null,
          user_id: null,
          content: report
        });

        if (insertError) {
          console.error("Database report save error object:", insertError);
        }
      }
    } catch (dbError) {
      console.error("Database report save failed exception:", dbError);
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate analysis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateRuleBasedReport(predictions: any, patientInfo: any): string {
  const ensemble = predictions.ensemble || { probability: 0, prediction: "Normal", risk_level: "Low", confidence: 0, vessels: { LAD: 0, LCX: 0, RCA: 0 } };
  
  const ladProb = ensemble.vessels?.LAD || 0;
  const lcxProb = ensemble.vessels?.LCX || 0;
  const rcaProb = ensemble.vessels?.RCA || 0;

  const findings = [];
  const territories = [];

  if (ladProb > 0.5) {
    findings.push("Perfusion abnormality involving the anterior wall and apex territory (LAD distribution).");
    territories.push("Anterior Wall / LAD");
  }
  if (lcxProb > 0.5) {
    findings.push("Decreased tracer uptake in the lateral wall territory (LCX distribution).");
    territories.push("Lateral Wall / LCX");
  }
  if (rcaProb > 0.5) {
    findings.push("Significant perfusion defect involving the inferior wall and basal segments (RCA distribution).");
    territories.push("Inferior Wall / RCA");
  }

  if (findings.length === 0) {
    findings.push("Normal myocardial perfusion pattern throughout the left ventricle.");
  }

  const impressionLine = ensemble.prediction === "Abnormal" 
    ? `Findings suspicious for stress-induced myocardial ischemia ${territories.length > 0 ? `in ${territories.join(" and ")} territories` : ""}.`
    : "Negative for stress-induced myocardial ischemia. Normal LV perfusion.";

  const report = `## NUCLEAR IMAGING PROTOCOL
${patientInfo?.imaging_protocol || "Tc-99m Gated SPECT Myocardial Perfusion Imaging"} performed.
Rest and stress images acquired according to standard institutional gated SPECT protocols. 
Tracer: Tc-99m Sestamibi.

## STRESS PROTOCOL
STRESS METHOD: ${patientInfo?.stress_protocol || "Pharmacologic Stress"}.
Continuous ECG monitoring performed during stress phase. Patient's clinical response and hemodynamics were monitored.

## STRESS IMPRESSION
The stress test results correlate with a ${ensemble.prediction === "Abnormal" ? "positive" : "negative"} AI-assisted perfusion analysis. 
${ensemble.prediction === "Abnormal" ? "Model consensus indicates significant perfusion defects under stress conditions." : "Model consensus indicates preserved perfusion during peak stress."}

## IMAGING FINDINGS
STUDY QUALITY: Adequate for interpretation.

PERFUSION FINDINGS:
${findings.map(f => `• ${f}`).join("\n")}

QUANTITATIVE AI ANALYSIS:
• LAD Territory Probability: ${(ladProb * 100).toFixed(1)}%
• LCX Territory Probability: ${(lcxProb * 100).toFixed(1)}%
• RCA Territory Probability: ${(rcaProb * 100).toFixed(1)}%

Overall Classification: ${ensemble.prediction}
Risk Stratification: ${ensemble.risk_level} Risk
Model Confidence: ${ensemble.confidence}%

## IMPRESSION
${impressionLine}

## KEY CLINICAL FINDINGS
• AI Ensemble Model identifies ${ensemble.prediction === "Abnormal" ? "abnormal" : "normal"} myocardial perfusion pattern.
• Defect territories identified based on vessel-specific deep learning branch analysis.
• Correlation with clinical history (${patientInfo?.history || "None"}) and indications (${patientInfo?.indications || "None"}) is recommended.`;

  return report;
}

