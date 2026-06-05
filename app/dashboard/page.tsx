"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Heart,
  Upload,
  Brain,
  LogOut,
  History,
  Loader2,
  X,
  AlertCircle,
  AlertTriangle,
  FileImage,
  Activity,
  Zap,
  TrendingUp,
  Shield,
  FileText,
  User
} from "lucide-react";

// New Components
import StatCard from "./components/StatCard";
import ModelStatus from "./components/ModelStatus";
import RecentScans from "./components/RecentScans";

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
  report: string;
}

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

interface PatientInfo {
  patient_name: string;
  date_of_birth: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
  bmi: string;
  history: string;
  indications: string;
  stress_protocol: string;
  imaging_protocol: string;
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restFileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [dragActiveRest, setDragActiveRest] = useState(false);
  const [stressFile, setStressFile] = useState<File | null>(null);
  const [restFile, setRestFile] = useState<File | null>(null);
  const [stressPreviewUrl, setStressPreviewUrl] = useState<string | null>(null);
  const [restPreviewUrl, setRestPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "history">("overview");
  const [syncing, setSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    patient_name: "",
    date_of_birth: "",
    gender: "",
    age: "",
    height: "",
    weight: "",
    bmi: "",
    history: "",
    indications: "",
    stress_protocol: "Pharmacologic (Dobutamine)",
    imaging_protocol: "Tc-99m Gated SPECT",
  });

  // Load history from Supabase and sync with localStorage
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setSyncing(true);

      try {
        // 1. Auto-migrate any local offline data first (fire and forget)
        const local = localStorage.getItem("cardioscan_history");
        if (local) {
          const localHistory: AnalysisResult[] = JSON.parse(local);
          if (localHistory.length > 0) {
            fetch("/api/migrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: localHistory, user_email: user.email }),
            })
            .then(async res => {
              if (res.ok) {
                const result = await res.json();
                if (result.migrated > 0) {
                  localStorage.removeItem("cardioscan_history");
                }
              }
            })
            .catch(e => console.warn("Auto-sync (migrate) failed:", e));
          }
        }

        // 2. Fetch scans filtered by current user's email via API Proxy
        if (!user.email) {
          console.warn("No user email available for scan fetch");
          setSyncing(false);
          return;
        }

        const res = await fetch(`/api/scans?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || "Failed to fetch scan history");
        }
        const scans = await res.json();

        // 3. Map Supabase data — filter out any rows with missing predictions
        const supabaseHistory: AnalysisResult[] = (scans || [])
          .filter((scan: any) => scan.predictions && scan.predictions.ensemble)
          .map((scan: any) => ({
            id: scan.id,
            date: scan.created_at,
            filename: scan.filename,
            predictions: scan.predictions,
            report: scan.reports?.[0]?.content || ""
          }));

        // 4. Also include valid local items not yet in Supabase
        const localRaw = localStorage.getItem("cardioscan_history");
        let mergedHistory = supabaseHistory;
        if (localRaw) {
          const localHistory: AnalysisResult[] = JSON.parse(localRaw)
            .filter((item: AnalysisResult) => item.predictions?.ensemble);
          const historyMap = new Map();
          localHistory.forEach(item => historyMap.set(item.id, item));
          supabaseHistory.forEach(item => historyMap.set(item.id, item));
          mergedHistory = Array.from(historyMap.values())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        setHistory(mergedHistory);
      } catch (err: any) {
        console.error("Dashboard: loadData failure:", {
          message: err.message,
          error: err,
          stack: err.stack
        });
        // Fallback: safe-parse localStorage
        const local = localStorage.getItem("cardioscan_history");
        if (local) {
          const parsed: AnalysisResult[] = JSON.parse(local)
            .filter((item: AnalysisResult) => item.predictions?.ensemble);
          setHistory(parsed);
        }
      } finally {
        setSyncing(false);
      }
    }

    if (!isLoading && user) loadData();
  }, [user, isLoading]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDragRest = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveRest(true);
    } else if (e.type === "dragleave") {
      setDragActiveRest(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0], "stress");
    }
  }, []);

  const handleDropRest = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveRest(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0], "rest");
    }
  }, []);

  const handleFileSelect = (file: File, slot: "stress" | "rest" = "stress") => {
    setError("");
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];
    if (!allowed.includes(file.type) && !file.name.endsWith(".dcm") && !file.name.endsWith(".npy")) {
      setError("Please upload a valid image file (JPG, PNG, WebP, BMP, TIFF, DICOM, or NPY)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be under 50MB");
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

    if (slot === "stress") {
      setStressFile(file);
      setStressPreviewUrl(previewUrl);
    } else {
      setRestFile(file);
      setRestPreviewUrl(previewUrl);
    }
    setActiveTab("upload");
  };

  const handlePatientInfoChange = (field: keyof PatientInfo, value: string) => {
    setPatientInfo(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate BMI when height and weight change
      if (field === "height" || field === "weight") {
        const heightCm = parseFloat(updated.height);
        const weightKg = parseFloat(updated.weight);
        if (heightCm > 0 && weightKg > 0) {
          const heightM = heightCm / 100;
          updated.bmi = (weightKg / (heightM * heightM)).toFixed(1);
        }
      }
      // Auto-calculate age from DOB
      if (field === "date_of_birth" && value) {
        const birth = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        updated.age = age.toString();
      }
      return updated;
    });
  };

  const handleAnalyze = async () => {
    if (!stressFile) return;
    setAnalyzing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("stress_file", stressFile);
      if (restFile) formData.append("rest_file", restFile);
      if (user?.email) formData.append("user_email", user.email);
      formData.append("patient_info", JSON.stringify({
        ...patientInfo,
        ordering_physician: user?.name || "N/A",
      }));

      const predictRes = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const predictData = await predictRes.json();
      if (!predictRes.ok || predictData.error) {
        throw new Error(predictData.error || "Failed to get model predictions");
      }

      const { scan_id, ...predictions } = predictData;
      if (!predictions.ensemble) {
        throw new Error("Invalid prediction response from server");
      }

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predictions,
          filename: stressFile.name,
          user_email: user?.email,
          scan_id: scan_id,
          patient_info: {
            ...patientInfo,
            ordering_physician: user?.name || "N/A",
          }
        }),
      });

      if (!analyzeRes.ok) {
        const analyzeErr = await analyzeRes.json().catch(() => ({}));
        throw new Error(analyzeErr.error || "Failed to generate analysis report");
      }
      const { report } = await analyzeRes.json();

      if (scan_id) {
        router.push(`/results?id=${scan_id}`);
      } else {
        // Fallback: Save to localStorage if DB save failed
        const fallbackId = crypto.randomUUID();
        const fallbackResult = {
          id: fallbackId,
          date: new Date().toISOString(),
          filename: stressFile.name,
          predictions,
          report
        };
        const local = localStorage.getItem("cardioscan_history");
        const historyData = local ? JSON.parse(local) : [];
        localStorage.setItem("cardioscan_history", JSON.stringify([fallbackResult, ...historyData]));

        router.push(`/results?id=${fallbackId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    if (!user?.email) return;

    try {
      const res = await fetch(
        `/api/scans?id=${encodeURIComponent(id)}&email=${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Delete failed");
      }

      setHistory((prev) => prev.filter((h) => h.id !== id));

      const local = localStorage.getItem("cardioscan_history");
      if (local) {
        const parsed = JSON.parse(local).filter((item: AnalysisResult) => item.id !== id);
        localStorage.setItem("cardioscan_history", JSON.stringify(parsed));
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err instanceof Error ? err.message : "Failed to delete scan");
    }
  };

  // Stats calculation — guarded against malformed prediction data
  const totalScans = history.length;
  const abnormalScans = history.filter(h => h.predictions?.ensemble?.prediction === "Abnormal").length;
  const abnormalityRate = totalScans > 0 ? ((abnormalScans / totalScans) * 100).toFixed(1) : "0";
  const avgConfidence = totalScans > 0
    ? (history.reduce((acc, h) => acc + (h.predictions?.ensemble?.confidence ?? 0), 0) / totalScans).toFixed(1)
    : "0";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-accent-cyan" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      {/* ===== SIDEBAR ===== */}
      <div className={`sidebar-overlay ${isMobileMenuOpen ? "open" : ""}`} onClick={() => setIsMobileMenuOpen(false)} />
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingBottom: 24,
            borderBottom: "1px solid var(--border-color)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--gradient-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Heart size={16} color="#000" fill="#000" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            Cardio<span style={{ color: "var(--accent-cyan)" }}>Scan</span> AI
          </span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <button
            onClick={() => { setActiveTab("overview"); setIsMobileMenuOpen(false); }}
            className={`sidebar-link ${activeTab === "overview" ? "active" : ""}`}
            style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <Zap size={18} /> Overview
          </button>
          <button
            onClick={() => { setActiveTab("upload"); setIsMobileMenuOpen(false); }}
            className={`sidebar-link ${activeTab === "upload" ? "active" : ""}`}
            style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <Upload size={18} /> New Analysis
          </button>
          <button
            onClick={() => { setActiveTab("history"); setIsMobileMenuOpen(false); }}
            className={`sidebar-link ${activeTab === "history" ? "active" : ""}`}
            style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            <History size={18} /> Full History
          </button>
        </nav>

        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: user.picture ? "transparent" : "var(--gradient-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#000",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {user.picture ? (
                <img src={user.picture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Patient ID: {user.email.split('@')[0]}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="sidebar-link"
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", color: "var(--accent-red)" }}
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="dashboard-main" style={{ flex: 1, padding: "32px 40px", overflowY: "auto", position: "relative" }}>
        
        {/* Mobile Header Toggle */}
        <div className="mobile-menu-btn" style={{ marginBottom: 16 }}>
          <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Cardio<span style={{ color: "var(--accent-cyan)" }}>Scan</span> AI</span>
          </button>
        </div>
        {/* Sync Indicator */}
        {syncing && (
           <div style={{ position: "absolute", top: 32, right: 40, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
              <Loader2 size={12} className="animate-spin" /> Syncing with Cloud...
           </div>
        )}

        <div style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Dashboard Overview</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              Welcome back, {user.name}. Here is your clinical analysis summary.
            </p>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Stats */}
            <div className="md:col-span-4">
              <StatCard 
                title="Total Scans" 
                value={totalScans.toString()} 
                label="Historical capacity" 
                icon={TrendingUp} 
                color="var(--accent-blue)" 
              />
            </div>
            <div className="md:col-span-4">
              <StatCard 
                title="Abnormality Rate" 
                value={`${abnormalityRate}%`} 
                label="Current patient average" 
                icon={AlertTriangle} 
                color="var(--accent-red)" 
                trend={{ value: "2.4%", isUp: false }}
              />
            </div>
            <div className="md:col-span-4">
              <StatCard 
                title="Avg Confidence" 
                value={`${avgConfidence}%`} 
                label="Ensemble model certainty" 
                icon={TrendingUp} 
                color="var(--accent-cyan)" 
              />
            </div>

            {/* Model Status */}
            <div className="md:col-span-4">
              <ModelStatus models={[
                { name: "VGG16 Architecture", status: "online", accuracy: "84.1%", color: "var(--accent-cyan)" },
                { name: "ResNet50 Backbone", status: "online", accuracy: "86.4%", color: "var(--accent-blue)" },
                { name: "DenseNet121 Ensemble", status: "online", accuracy: "89.0%", color: "var(--accent-purple)" },
              ]} />
            </div>

            {/* Upload Area (Small Version — two zones) */}
            <div className="md:col-span-8">
              <div style={{ display: "flex", gap: 12, height: "100%" }}>
                {/* Stress */}
                <div
                  className={`upload-zone ${dragActive ? "dragging" : ""}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, padding: 24, position: "relative" }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*,.dcm,.npy"
                    onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], "stress"); }}
                    style={{ display: "none" }} />
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-cyan-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    {stressFile ? <Activity size={16} style={{ color: "var(--accent-cyan)" }} /> : <Upload size={16} style={{ color: "var(--accent-cyan)" }} />}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Stress Scan</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 12 }}>{stressFile ? stressFile.name : "Required"}</p>
                </div>
                {/* Rest */}
                <div
                  className={`upload-zone ${dragActiveRest ? "dragging" : ""}`}
                  onDragEnter={handleDragRest} onDragLeave={handleDragRest} onDragOver={handleDragRest} onDrop={handleDropRest}
                  onClick={() => restFileInputRef.current?.click()}
                  style={{ flex: 1, padding: 24, position: "relative" }}
                >
                  <input ref={restFileInputRef} type="file" accept="image/*,.dcm,.npy"
                    onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], "rest"); }}
                    style={{ display: "none" }} />
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    {restFile ? <Activity size={16} style={{ color: "var(--accent-blue)" }} /> : <Upload size={16} style={{ color: "var(--accent-blue)" }} />}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Rest Scan</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 12 }}>{restFile ? restFile.name : "Optional"}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-12">
              <RecentScans scans={history} onDelete={deleteHistoryItem} />
            </div>
          </div>
        )}

        {activeTab === "upload" && (
           <div style={{ maxWidth: 900 }}>
             {!stressFile ? (
                /* ── No file yet: show two empty drop zones ── */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  {/* Stress drop zone */}
                  <div
                    className={`upload-zone ${dragActive ? "dragging" : ""}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ minHeight: 280 }}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*,.dcm,.npy"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], "stress"); }}
                      style={{ display: "none" }} />
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-cyan-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <Upload size={24} style={{ color: "var(--accent-cyan)" }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Stress Scan</h3>
                    <p style={{ color: "var(--accent-cyan)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>REQUIRED</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Post-stress MPI image</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>JPG, PNG, DICOM • Max 50MB</p>
                  </div>
                  {/* Rest drop zone */}
                  <div
                    className={`upload-zone ${dragActiveRest ? "dragging" : ""}`}
                    onDragEnter={handleDragRest} onDragLeave={handleDragRest} onDragOver={handleDragRest} onDrop={handleDropRest}
                    onClick={() => restFileInputRef.current?.click()}
                    style={{ minHeight: 280, borderStyle: "dashed", opacity: 0.8 }}
                  >
                    <input ref={restFileInputRef} type="file" accept="image/*,.dcm,.npy"
                      onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], "rest"); }}
                      style={{ display: "none" }} />
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <Upload size={24} style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Rest Scan</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>OPTIONAL</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Resting-state MPI image</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>JPG, PNG, DICOM • Max 50MB</p>
                  </div>
                </div>
             ) : (
                <div>
                  {/* ── Scan Preview Cards ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    {/* Stress preview */}
                    <div className="glass-card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-cyan)", letterSpacing: "0.08em" }}>STRESS SCAN</span>
                        <button onClick={() => { setStressFile(null); setStressPreviewUrl(null); }} style={{ background: "var(--accent-red-dim)", border: "none", color: "var(--accent-red)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                      </div>
                      <div style={{ width: "100%", height: 140, background: "var(--bg-input)", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                        {stressPreviewUrl ? <img src={stressPreviewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FileImage size={36} style={{ color: "var(--text-muted)" }} />}
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{stressFile.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{(stressFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    {/* Rest preview / empty slot */}
                    {restFile ? (
                      <div className="glass-card" style={{ padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-blue)", letterSpacing: "0.08em" }}>REST SCAN</span>
                          <button onClick={() => { setRestFile(null); setRestPreviewUrl(null); }} style={{ background: "var(--accent-red-dim)", border: "none", color: "var(--accent-red)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                        </div>
                        <div style={{ width: "100%", height: 140, background: "var(--bg-input)", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                          {restPreviewUrl ? <img src={restPreviewUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FileImage size={36} style={{ color: "var(--text-muted)" }} />}
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{restFile.name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{(restFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div
                        className={`upload-zone ${dragActiveRest ? "dragging" : ""}`}
                        onDragEnter={handleDragRest} onDragLeave={handleDragRest} onDragOver={handleDragRest} onDrop={handleDropRest}
                        onClick={() => restFileInputRef.current?.click()}
                        style={{ minHeight: 220, opacity: 0.7 }}
                      >
                        <input ref={restFileInputRef} type="file" accept="image/*,.dcm,.npy"
                          onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0], "rest"); }}
                          style={{ display: "none" }} />
                        <Upload size={20} style={{ color: "var(--accent-blue)", marginBottom: 8 }} />
                        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Add Rest Scan</p>
                        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Optional — improves accuracy</p>
                      </div>
                    )}
                  </div>
                  {/* Channel info banner */}
                  <div style={{ padding: "10px 14px", background: restFile ? "rgba(6,214,160,0.06)" : "rgba(255,166,0,0.06)", borderRadius: "var(--radius-md)", fontSize: 13, color: restFile ? "var(--accent-cyan)" : "#ffb347", border: `1px solid ${restFile ? "rgba(6,214,160,0.15)" : "rgba(255,166,0,0.2)"}`, marginBottom: 24 }}>
                    {restFile
                      ? "✅ Stress + Rest scans loaded — full 6-channel input ready for ensemble analysis."
                      : "⚠️ Only stress scan provided — rest channels will be duplicated. Add a rest scan for best accuracy."}
                  </div>

                  {/* Patient Information Form */}
                  <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-color)" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--accent-blue-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                           <User size={18} style={{ color: "var(--accent-blue)" }} />
                        </div>
                        <div>
                           <h3 style={{ fontSize: 16, fontWeight: 700 }}>Patient Information</h3>
                           <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Enter patient details for the clinical report</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Patient Name *</label>
                           <input className="input-field" placeholder="e.g. John Doe" value={patientInfo.patient_name} onChange={e => handlePatientInfoChange("patient_name", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }} />
                        </div>
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Date of Birth</label>
                           <input className="input-field" type="date" value={patientInfo.date_of_birth} onChange={e => handlePatientInfoChange("date_of_birth", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }} />
                        </div>
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Gender</label>
                           <select className="input-field" value={patientInfo.gender} onChange={e => handlePatientInfoChange("gender", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }}>
                              <option value="">Select</option>
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                              <option value="Other">Other</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Age</label>
                           <input className="input-field" type="number" placeholder="Auto" value={patientInfo.age} onChange={e => handlePatientInfoChange("age", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }} readOnly={!!patientInfo.date_of_birth} />
                        </div>
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Height (cm)</label>
                           <input className="input-field" type="number" placeholder="e.g. 170" value={patientInfo.height} onChange={e => handlePatientInfoChange("height", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }} />
                        </div>
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Weight (kg)</label>
                           <input className="input-field" type="number" placeholder="e.g. 70" value={patientInfo.weight} onChange={e => handlePatientInfoChange("weight", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }} />
                        </div>
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>BMI</label>
                           <input className="input-field" value={patientInfo.bmi || "Auto"} readOnly style={{ padding: "10px 14px", fontSize: 14, opacity: 0.7 }} />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Ordering Physician</label>
                           <input className="input-field" value={user?.name || ""} readOnly style={{ padding: "10px 14px", fontSize: 14, opacity: 0.7 }} />
                        </div>
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Medical Record #</label>
                           <input className="input-field" value={user?.email?.split("@")[0] || ""} readOnly style={{ padding: "10px 14px", fontSize: 14, opacity: 0.7 }} />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Stress Protocol</label>
                           <select className="input-field" value={patientInfo.stress_protocol} onChange={e => handlePatientInfoChange("stress_protocol", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }}>
                              <option value="Pharmacologic (Dobutamine)">Pharmacologic (Dobutamine)</option>
                              <option value="Pharmacologic (Adenosine)">Pharmacologic (Adenosine)</option>
                              <option value="Exercise (Bruce Protocol)">Exercise (Bruce Protocol)</option>
                              <option value="Exercise (Modified Bruce)">Exercise (Modified Bruce)</option>
                           </select>
                        </div>
                        <div>
                           <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Imaging Protocol</label>
                           <select className="input-field" value={patientInfo.imaging_protocol} onChange={e => handlePatientInfoChange("imaging_protocol", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }}>
                              <option value="Tc-99m Gated SPECT">Tc-99m Gated SPECT</option>
                              <option value="Tl-201 / Tc-99m Dual Isotope">Tl-201 / Tc-99m Dual Isotope</option>
                              <option value="PET/CT Rubidium-82">PET/CT Rubidium-82</option>
                           </select>
                        </div>
                     </div>

                     <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>History</label>
                        <input className="input-field" placeholder="e.g. Hypertension, Diabetes, High Cholesterol" value={patientInfo.history} onChange={e => handlePatientInfoChange("history", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }} />
                     </div>
                     <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Indications</label>
                        <input className="input-field" placeholder="e.g. Chest pain, Shortness of breath" value={patientInfo.indications} onChange={e => handlePatientInfoChange("indications", e.target.value)} style={{ padding: "10px 14px", fontSize: 14 }} />
                     </div>
                  </div>

                  {error && (
                    <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(255,71,87,0.1)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--accent-red)", border: "1px solid rgba(255,71,87,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-4">
                     <button onClick={handleAnalyze} className="btn-primary" disabled={analyzing || !patientInfo.patient_name || !stressFile} style={{ flex: 1, padding: "14px 0", justifyContent: "center" }}>
                        {analyzing ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Brain size={18} /> Start Multi-Model Analysis</>}
                     </button>
                     <button onClick={() => { setStressFile(null); setRestFile(null); setStressPreviewUrl(null); setRestPreviewUrl(null); }} className="btn-secondary" style={{ padding: "14px 24px" }}>Cancel</button>
                  </div>
                </div>
             )}
           </div>
        )}

        {activeTab === "history" && (
           <div style={{ maxWidth: 800 }}>
              <RecentScans scans={history} onDelete={deleteHistoryItem} />
           </div>
        )}
      </main>
    </div>
  );
}
