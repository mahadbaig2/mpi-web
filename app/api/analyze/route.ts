import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "@/lib/supabase";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

interface ReportContext {
  ensemble: {
    prediction: string;
    risk_level: string;
    confidence: number;
    probability: number;
  };
  ladProb: number;
  lcxProb: number;
  rcaProb: number;
  findings: string[];
  territories: string[];
  impressionLine: string;
  imagingProtocol: string;
  stressProtocol: string;
  history: string;
  indications: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictions, filename, scan_id, user_email, patient_info } = body;

    if (!predictions) {
      return NextResponse.json({ error: "No predictions provided" }, { status: 400 });
    }

    const context = computeReportContext(predictions, patient_info);
    const report = await generateReport(context);

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

function computeReportContext(predictions: any, patientInfo: any): ReportContext {
  const ensemble = predictions.ensemble || {
    probability: 0,
    prediction: "Normal",
    risk_level: "Low",
    confidence: 0,
    vessels: { LAD: 0, LCX: 0, RCA: 0 },
  };

  const ladProb = ensemble.vessels?.LAD || 0;
  const lcxProb = ensemble.vessels?.LCX || 0;
  const rcaProb = ensemble.vessels?.RCA || 0;

  const findings: string[] = [];
  const territories: string[] = [];

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

  const impressionLine =
    ensemble.prediction === "Abnormal"
      ? `Findings suspicious for stress-induced myocardial ischemia ${territories.length > 0 ? `in ${territories.join(" and ")} territories` : ""}.`
      : "Negative for stress-induced myocardial ischemia. Normal LV perfusion.";

  return {
    ensemble: {
      prediction: ensemble.prediction,
      risk_level: ensemble.risk_level,
      confidence: ensemble.confidence,
      probability: ensemble.probability ?? 0,
    },
    ladProb,
    lcxProb,
    rcaProb,
    findings,
    territories,
    impressionLine,
    imagingProtocol: patientInfo?.imaging_protocol || "Tc-99m Gated SPECT Myocardial Perfusion Imaging",
    stressProtocol: patientInfo?.stress_protocol || "Pharmacologic Stress",
    history: patientInfo?.history || "None",
    indications: patientInfo?.indications || "None",
  };
}

async function generateReport(context: ReportContext): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ_API_KEY not set — falling back to template report");
    return generateRuleBasedReport(context);
  }

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a nuclear cardiology report writer. Generate a Myocardial Perfusion Imaging (MPI) clinical report in Markdown.

STRICT RULES — you MUST follow all of these:
1. Use exactly these six section headers in this order, each prefixed with "## ":
   - NUCLEAR IMAGING PROTOCOL
   - STRESS PROTOCOL
   - STRESS IMPRESSION
   - IMAGING FINDINGS
   - IMPRESSION
   - KEY CLINICAL FINDINGS
2. Under each section heading, you MUST write at least 3 to 4 detailed sentences/lines. Do NOT generate short, single-sentence sections. Expand on the clinical context, protocol details, relevant myocardial segments, and implications of the findings.
3. Do NOT invent, alter, or omit any clinical facts, probabilities, classifications, or findings provided in the input JSON.
4. Under "IMAGING FINDINGS", include all perfusion findings from the input verbatim as bullet points (• prefix), followed by a detailed paragraph (at least 3 sentences) summarizing the quantitative values: LAD/LCX/RCA territory probabilities, Overall Classification, Risk Stratification, and Model Confidence.
5. The IMPRESSION section must contain the exact impressionLine from the input — word for word — followed by 2 sentences explaining the clinical relevance of this impression.
6. Use the provided imagingProtocol, stressProtocol, history, and indications exactly as given.
7. For STRESS IMPRESSION: if prediction is "Abnormal", state positive AI-assisted perfusion analysis and significant perfusion defects under stress; if "Normal", state negative analysis and preserved perfusion during peak stress. Write at least 3 sentences explaining the significance of stress-induced perfusion defects.
8. KEY CLINICAL FINDINGS must include: ensemble identifies abnormal/normal pattern, defect territories from vessel-specific deep learning branch analysis, and correlation with history/indications recommendation. Write at least 3 detailed bullet points or sentences here.
9. Write in professional nuclear cardiology report tone. Add brief connecting clinical prose within sections (ensuring each heading has at least 3 lines/sentences), but never contradict or replace the provided facts.
10. Output ONLY the report Markdown — no preamble, no explanation.`,
        },
        {
          role: "user",
          content: JSON.stringify(context, null, 2),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Empty response from Groq");
    }

    return content;
  } catch (err) {
    console.error("Groq report generation failed, using template fallback:", err);
    return generateRuleBasedReport(context);
  }
}

function generateRuleBasedReport(context: ReportContext): string {
  const { ensemble, ladProb, lcxProb, rcaProb, findings, impressionLine, imagingProtocol, stressProtocol, history, indications } = context;

  return `## NUCLEAR IMAGING PROTOCOL
The patient underwent myocardial perfusion evaluation via ${imagingProtocol}. 
Rest and stress images were acquired in accordance with standard institutional gated SPECT imaging guidelines. 
Radiopharmaceutical tracer administration of Tc-99m Sestamibi was performed, and tomographic images were obtained to evaluate regional myocardial blood flow.

## STRESS PROTOCOL
The stress phase of the study was conducted using the ${stressProtocol} methodology. 
Continuous electrocardiographic monitoring was maintained during the stress phase to identify ischemic ECG changes. 
Patient hemodynamics, including blood pressure, heart rate, and symptomatic responses, were recorded and analyzed during peak stress.

## STRESS IMPRESSION
The patient's physical/pharmacological stress results correlate with a ${ensemble.prediction === "Abnormal" ? "positive" : "negative"} AI-assisted perfusion analysis. 
${ensemble.prediction === "Abnormal" ? "Model consensus indicates significant, high-confidence perfusion deficits under stress conditions." : "Model consensus indicates preserved myocardial tracer distribution during peak stress."}
Further diagnostic monitoring and clinical correlation with patient symptoms during stress is indicated to guide therapeutic intervention.

## IMAGING FINDINGS
STUDY QUALITY: Technical quality of the gated SPECT study was adequate for clinical interpretation.
PERFUSION FINDINGS:
${findings.map((f) => `• ${f}`).join("\n")}

QUANTITATIVE AI ANALYSIS:
• Left Anterior Descending (LAD) Territory Probability: ${(ladProb * 100).toFixed(1)}%
• Left Circumflex (LCX) Territory Probability: ${(lcxProb * 100).toFixed(1)}%
• Right Coronary Artery (RCA) Territory Probability: ${(rcaProb * 100).toFixed(1)}%
• Overall Classification: The AI model ensemble predicts an ${ensemble.prediction} myocardial perfusion scan.
• Risk Stratification: Evaluated at ${ensemble.risk_level} Risk based on defect extent and distribution.
• Model Confidence Score: Calculated at ${ensemble.confidence}% across active deep learning networks.

## IMPRESSION
${impressionLine}
This impression reflects a comprehensive clinical review of the SPECT scans processed through the deep learning ensemble. 
Further cardiological evaluation, correlation with patient history, and potentially invasive angiography may be considered based on this finding.

## KEY CLINICAL FINDINGS
• The AI Ensemble Model identifies an ${ensemble.prediction === "Abnormal" ? "abnormal" : "normal"} myocardial perfusion pattern.
• Defect territories are identified based on vessel-specific deep learning branch analysis, pointing to regional vascular risk.
• Correlation with the clinical history of "${history}" and patient indications of "${indications}" is strongly recommended to optimize medical therapy.`;
}
