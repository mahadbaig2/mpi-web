"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  ArrowLeft,
  Download,
  FileBarChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Shield,
  Printer,
} from "lucide-react";

interface ModelPrediction {
  probability: number;
  prediction: string;
  risk_level: string;
  confidence: number;
  vessels?: {
    LAD: number;
    LCX: number;
    RCA: number;
  };
}

interface AnalysisResult {
  id: string;
  date: string;
  filename: string;
  predictions: {
    VGG16: ModelPrediction;
    ResNet50: ModelPrediction;
    DenseNet121: ModelPrediction;
    ensemble: ModelPrediction;
  };
  patient_info?: {
    patient_name: string;
    date_of_birth: string;
    gender: string;
    age: string;
    height: string;
    weight: string;
    bmi: string;
    history: string;
    indications: string;
    ordering_physician: string;
    stress_protocol: string;
    imaging_protocol: string;
  };
  report: string;
}

function GaugeChart({ value, size = 120, label, color }: { value: number; size?: number; label: string; color: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - value * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="8"
        />
        {/* Value ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="gauge-ring"
        />
      </svg>
      <div
        style={{
          marginTop: -size / 2 - 16,
          marginBottom: size / 2 - 24,
          fontSize: 22,
          fontWeight: 700,
          color,
        }}
      >
        {(value * 100).toFixed(1)}%
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const id = searchParams.get("id");

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function fetchResult() {
      setLoading(true);

      // 1. Check localStorage first (fast path)
      const stored = localStorage.getItem("cardioscan_history");
      if (stored) {
        try {
          const history: AnalysisResult[] = JSON.parse(stored);
          const found = history.find((h) => h.id === id);
          if (found) {
            setResult(found);
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }

      // 2. Fall back to Supabase
      try {
        const res = await fetch(`/api/results?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Results API failed:", errData);
          setErrorMessage(errData.error || "Failed to fetch from server");
          setNotFound(true);
        }
      } catch (err) {
        console.error("Network error:", err);
        setErrorMessage(err instanceof Error ? err.message : "Network error");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [id]);

  const handleDownload = () => {
    if (!result || !reportRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const p = result.patient_info || {
      patient_name: "Not Provided",
      date_of_birth: "N/A",
      gender: "N/A",
      age: "N/A",
      height: "N/A",
      weight: "N/A",
      bmi: "N/A",
      history: "None provided",
      indications: "None provided",
      ordering_physician: "N/A",
      stress_protocol: "N/A",
      imaging_protocol: "N/A"
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CardioScan AI Clinical Report - ${result.filename}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 20px; color: #1a1a1a; line-height: 1.5; font-size: 13px; }
          .header { background: #b91c1c; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 20px; font-weight: 800; }
          .report-title { background: #f3f4f6; border-top: 2px solid #1a1a1a; border-bottom: 2px solid #1a1a1a; text-align: center; font-weight: 800; padding: 6px; font-size: 16px; margin: 15px 0; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px 20px; padding-bottom: 10px; border-bottom: 1px solid #ddd; }
          .info-item { display: flex; gap: 5px; }
          .label { font-weight: 700; min-width: 90px; }
          .section-header { background: #f3f4f6; border: 1px solid #1a1a1a; font-weight: 800; padding: 3px 10px; font-size: 13px; margin: 15px 0 8px; text-transform: uppercase; }
          .content { padding: 0 5px; }
          .impression-box { border: 2px solid #1a1a1a; padding: 10px; margin: 20px 0; text-align: center; font-weight: 800; font-size: 15px; background: #f9fafb; }
          .disclaimer-box { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
          .ai-badge { border: 2px solid #b91c1c; color: #b91c1c; padding: 5px 15px; font-weight: 900; font-size: 14px; text-transform: uppercase; transform: rotate(-5deg); }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">CardioScan AI</div>
          <div style="font-size: 11px;">Nuclear Cardiology Report Engine v2.4</div>
        </div>

        <div class="report-title">MYOCARDIAL PERFUSION IMAGING FINAL REPORT</div>

        <div class="info-grid">
          <div class="info-item"><span class="label">Patient Name:</span><span>${p.patient_name}</span></div>
          <div class="info-item"><span class="label">Gender:</span><span>${p.gender}</span></div>
          <div class="info-item"><span class="label">Date of Study:</span><span>${new Date(result.date).toLocaleDateString()}</span></div>
          <div class="info-item"><span class="label">Date of Birth:</span><span>${p.date_of_birth}</span></div>
          <div class="info-item"><span class="label">Age:</span><span>${p.age}</span></div>
          <div class="info-item"><span class="label">Medical Record #:</span><span>${result.id.split('-')[0]}</span></div>
          <div class="info-item"><span class="label">Ordering Physician:</span><span>${p.ordering_physician}</span></div>
          <div class="info-item"><span class="label">Height:</span><span>${p.height} cm</span></div>
          <div class="info-item"><span class="label">Weight:</span><span>${p.weight} kg</span></div>
          <div class="info-item" style="grid-column: span 3;"><span class="label">History:</span><span>${p.history}</span></div>
          <div class="info-item" style="grid-column: span 3;"><span class="label">Indications:</span><span>${p.indications}</span></div>
        </div>

        ${result.report
          .replace(/## NUCLEAR IMAGING PROTOCOL/g, '<div class="section-header">NUCLEAR IMAGING PROTOCOL</div><div class="content">')
          .replace(/## STRESS PROTOCOL/g, '</div><div class="section-header">STRESS PROTOCOL</div><div class="content">')
          .replace(/## STRESS IMPRESSION/g, '</div><div class="section-header">STRESS IMPRESSION</div><div class="content">')
          .replace(/## IMAGING FINDINGS/g, '</div><div class="section-header">IMAGING FINDINGS</div><div class="content">')
          .replace(/## IMPRESSION/g, '</div><div class="impression-box">')
          .replace(/## KEY CLINICAL FINDINGS/g, '</div><div class="section-header">KEY CLINICAL FINDINGS</div><div class="content">')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n- /g, '<br>• ')
          .replace(/\n/g, '<br>')}
        </div>

        <div class="disclaimer-box">
          <div style="font-size: 11px; max-width: 60%;">
            <strong style="display: block; margin-bottom: 5px;">AI MEDICAL DISCLAIMER:</strong>
            This report was generated using an AI-assisted decision support system and must be reviewed and confirmed by a licensed nuclear cardiologist before clinical use. 
            Analysis is based on ensemble deep learning models (VGG16, ResNet50, DenseNet121). 
            All findings should be correlated with clinical symptoms and other diagnostic tests.
            <br><br>
            Digitally Generated: ${new Date().toLocaleString()}<br>
            Analysis Source: CardioScan Ensemble Engine v2.4.0
          </div>
          <div class="ai-badge">AI GENERATED</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!result) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <AlertTriangle size={48} style={{ color: "var(--accent-amber)" }} />
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Result not found</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {errorMessage ? `Error: ${errorMessage}` : "This analysis may have been deleted or doesn't exist."}
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ marginTop: 8 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const ensemble = result.predictions.ensemble;
  const riskColor =
    ensemble.risk_level === "High"
      ? "var(--accent-red)"
      : ensemble.risk_level === "Medium"
      ? "var(--accent-amber)"
      : "var(--accent-cyan)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Top bar */}
      <header
        className="glass"
        style={{
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Analysis Results</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{result.filename}</div>
          </div>
        </div>
        <button onClick={handleDownload} className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }}>
          <Download size={14} /> Download Report
        </button>
      </header>

      <div ref={reportRef} style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Ensemble result - REDESIGNED HERO */}
        <div
          className="glass-card"
          style={{
            padding: "48px 40px",
            textAlign: "center",
            marginBottom: 32,
            borderColor: riskColor,
            boxShadow: `0 0 40px ${riskColor}15`,
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Background Decorative Element */}
          <div style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${riskColor}10 0%, transparent 70%)`,
            filter: "blur(40px)",
            pointerEvents: "none"
          }} />

          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div style={{ height: 1, flex: 1, background: "var(--border-color)", opacity: 0.3 }}></div>
            <Activity size={16} /> CLINICAL ENSEMBLE SUMMARY
            <div style={{ height: 1, flex: 1, background: "var(--border-color)", opacity: 0.3 }}></div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
             <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: riskColor, lineHeight: 1, marginBottom: 4 }}>
                  {(ensemble.probability * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>PROBABILITY SCORE</div>
             </div>

             <div style={{ width: 1, height: 80, background: "var(--border-color)", opacity: 0.5 }}></div>

             <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  {ensemble.prediction === "Abnormal" ? (
                    <>
                      <AlertTriangle size={28} style={{ color: "var(--accent-red)" }} />
                      <span style={{ color: "var(--accent-red)" }}>Cardiological Abnormality</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={28} style={{ color: "var(--accent-cyan)" }} />
                      <span style={{ color: "var(--accent-cyan)" }}>Normal MPI Pattern</span>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                   <span className={`badge badge-${ensemble.risk_level.toLowerCase()}`} style={{ fontSize: 13, padding: "4px 16px" }}>
                    <Shield size={12} /> {ensemble.risk_level.toUpperCase()} RISK
                  </span>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Activity size={12} /> Confidence: {ensemble.confidence}%
                  </div>
                </div>
             </div>
          </div>
        </div>
        {/* Vessel Specific Analysis */}
        <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
             <Activity size={20} className="text-accent-cyan" />
             <h3 style={{ fontSize: 18, fontWeight: 700 }}>Coronary Artery Condition Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'LAD', name: 'Left Anterior Descending', value: ensemble.vessels?.LAD || 0 },
              { id: 'LCX', name: 'Left Circumflex', value: ensemble.vessels?.LCX || 0 },
              { id: 'RCA', name: 'Right Coronary Artery', value: ensemble.vessels?.RCA || 0 }
            ].map(vessel => {
              const statusColor = vessel.value >= 0.7 ? "var(--accent-red)" : vessel.value >= 0.4 ? "var(--accent-amber)" : "var(--accent-cyan)";
              return (
                <div key={vessel.id} style={{ padding: 20, background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: `1px solid ${statusColor}20` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{vessel.id}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vessel.name}</div>
                  <div style={{ height: 6, background: "var(--border-color)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${vessel.value * 100}%`, background: statusColor }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: statusColor }}>{(vessel.value * 100).toFixed(1)}%</span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: 0.8 }}>
                      {vessel.value >= 0.7 ? "Severe" : vessel.value >= 0.4 ? "Moderate" : "Normal"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual model results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {(["VGG16", "ResNet50", "DenseNet121"] as const).map((name) => {
            const pred = result.predictions[name as keyof typeof result.predictions] as ModelPrediction | undefined;
            if (!pred) return null; // Skip rendering if model failed to run inference

            const modelColor =
              name === "VGG16"
                ? "var(--accent-cyan)"
                : name === "ResNet50"
                ? "var(--accent-blue)"
                : "var(--accent-purple)";

            return (
              <div
                key={name}
                className="glass-card"
                style={{ padding: 24, textAlign: "center" }}
              >
                <GaugeChart
                  value={pred.probability}
                  size={100}
                  label={name}
                  color={modelColor}
                />
                <div style={{ marginTop: 12 }}>
                  <span className={`badge badge-${pred.risk_level.toLowerCase()}`}>
                    {pred.prediction} • {pred.risk_level}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                  Confidence: {pred.confidence}%
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Report - REDESIGNED PREMIUM PAPER LOOK */}
        <div className="clinical-report-container" style={{ marginBottom: 32 }}>
          <div className="clinical-report-header">
            <div style={{ fontWeight: 800, fontSize: 20 }}>CardioScan AI</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Nuclear Cardiology Report Engine v2.4</div>
          </div>

          <div className="clinical-report-title">MYOCARDIAL PERFUSION IMAGING FINAL REPORT</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 pb-4 mb-4 border-b border-gray-200 text-[13px] px-6">
            <div className="clinical-info-item"><span className="clinical-info-label">Patient Name:</span><span>{result.patient_info?.patient_name || "Not Provided"}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Gender:</span><span>{result.patient_info?.gender || "N/A"}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Date of Study:</span><span>{new Date(result.date).toLocaleDateString()}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Date of Birth:</span><span>{result.patient_info?.date_of_birth || "N/A"}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Age:</span><span>{result.patient_info?.age || "N/A"}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Medical Record #:</span><span>{result.id.split('-')[0]}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Ordering Physician:</span><span>{result.patient_info?.ordering_physician || "N/A"}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Height:</span><span>{result.patient_info?.height ? `${result.patient_info.height} cm` : "N/A"}</span></div>
            <div className="clinical-info-item"><span className="clinical-info-label">Weight:</span><span>{result.patient_info?.weight ? `${result.patient_info.weight} kg` : "N/A"}</span></div>
            <div className="clinical-info-item md:col-span-3"><span className="clinical-info-label">History:</span><span>{result.patient_info?.history || "None provided"}</span></div>
            <div className="clinical-info-item md:col-span-3"><span className="clinical-info-label">Indications:</span><span>{result.patient_info?.indications || "None provided"}</span></div>
          </div>

          <div
            className="medical-report-content"
            dangerouslySetInnerHTML={{
              __html: result.report
                .replace(/## NUCLEAR IMAGING PROTOCOL/g, '<div class="clinical-section-header">NUCLEAR IMAGING PROTOCOL</div><div class="clinical-section-content">')
                .replace(/## STRESS PROTOCOL/g, '</div><div class="clinical-section-header">STRESS PROTOCOL</div><div class="clinical-section-content">')
                .replace(/## STRESS IMPRESSION/g, '</div><div class="clinical-section-header">STRESS IMPRESSION</div><div class="clinical-section-content">')
                .replace(/## IMAGING FINDINGS/g, '</div><div class="clinical-section-header">IMAGING FINDINGS</div><div class="clinical-section-content">')
                .replace(/## IMPRESSION/g, '</div><div class="clinical-impression-box">')
                .replace(/## KEY CLINICAL FINDINGS/g, '</div><div class="clinical-section-header">KEY CLINICAL FINDINGS</div><div class="clinical-section-content">')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n- /g, '<br>• ')
                .replace(/\n/g, "<br>") + '</div>',
            }}
          />

          <div className="clinical-disclaimer-box">
            <div style={{ fontSize: 11, maxWidth: "70%", color: "#666" }}>
              <strong style={{ display: "block", marginBottom: 4, color: "#1a1a1a" }}>AI MEDICAL DISCLAIMER:</strong>
              This report was generated using an AI-assisted decision support system and must be reviewed and confirmed by a licensed nuclear cardiologist before clinical use. 
              Analysis is based on ensemble deep learning models (VGG16, ResNet50, DenseNet121). 
              All findings should be correlated with clinical symptoms and other diagnostic tests.
              <br /><br />
              Digitally Generated: {new Date().toLocaleString()} | Engine: CardioScan Ensemble v2.4.0
            </div>
            <div className="ai-verified-badge">AI GENERATED</div>
          </div>
        </div>

        {/* Meta info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <span>Report ID: {result.id}</span>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleDownload}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-cyan)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Printer size={12} /> Print / Save as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={32} className="animate-heartbeat" style={{ color: "var(--accent-cyan)" }} />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
