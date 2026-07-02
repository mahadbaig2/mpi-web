"use client";

import Link from "next/link";
import {
  Heart,
  Brain,
  FileBarChart,
  Upload,
  Shield,
  Zap,
  ArrowRight,
  Activity,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ background: "var(--gradient-hero)", minHeight: "100vh" }}>
      {/* ===== NAV ===== */}
      <nav
        className="glass"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "16px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--gradient-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={18} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Cardio<span style={{ color: "var(--accent-cyan)" }}>Scan</span> AI
            </span>
          </Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/login" className="btn-secondary" style={{ padding: "8px 22px", fontSize: 14 }}>
              Log In
            </Link>
            <Link href="/signup" className="btn-primary" style={{ padding: "8px 22px", fontSize: 14 }}>
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section
        className="hero-padding"
        style={{
          paddingTop: 140,
          paddingBottom: 100,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "20%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "15%",
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(190,18,60,0.04) 0%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          {/* Badge */}
          <div
            className="animate-fade-in-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-cyan-dim)",
              border: "1px solid rgba(220,38,38,0.2)",
              marginBottom: 32,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--accent-cyan)",
            }}
          >
            <Activity size={14} />
            AI-Powered Cardiac Analysis
          </div>

          {/* Heart icon with animation */}
          <div className="animate-fade-in-up" style={{ marginBottom: 32, animationDelay: "0.1s" }}>
            <div
              className="animate-heartbeat"
              style={{
                width: 80,
                height: 80,
                margin: "0 auto",
                borderRadius: "50%",
                background: "var(--gradient-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Heart size={36} color="#fff" fill="#fff" />
            </div>
          </div>

          <h1
            className="animate-fade-in-up hero-title"
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: "-1.5px",
              animationDelay: "0.2s",
            }}
          >
            Detect Heart Disease
            <br />
            <span
              className="animate-gradient"
              style={{
                background: "var(--gradient-accent)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              from MPI Scans
            </span>
          </h1>

          <p
            className="animate-fade-in-up"
            style={{
              fontSize: 18,
              color: "var(--text-secondary)",
              maxWidth: 600,
              margin: "0 auto 40px",
              lineHeight: 1.7,
              animationDelay: "0.3s",
            }}
          >
            Upload your Myocardial Perfusion Imaging scans and get instant AI-powered
            analysis using an ensemble of VGG16, ResNet50 & DenseNet121 deep learning models.
          </p>

          <div
            className="animate-fade-in-up"
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
              animationDelay: "0.4s",
            }}
          >
            <Link href="/signup" className="btn-primary" style={{ padding: "14px 36px", fontSize: 16 }}>
              Start Analyzing <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-secondary" style={{ padding: "14px 36px", fontSize: 16 }}>
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div
            className="animate-fade-in-up"
            style={{
              display: "flex",
              gap: 48,
              justifyContent: "center",
              marginTop: 64,
              flexWrap: "wrap",
              animationDelay: "0.5s",
            }}
          >
            {[
              { value: "3", label: "Deep Learning Models" },
              { value: "89%", label: "AUC Accuracy" },
              { value: "< 30s", label: "Analysis Time" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "var(--accent-cyan)",
                    letterSpacing: "-1px",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.5px" }}>
            Powered by Advanced AI
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
            Three state-of-the-art deep learning architectures working together for accurate heart disease detection.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {[
            {
              icon: <Brain size={28} />,
              title: "Multi-Model Ensemble",
              desc: "VGG16, ResNet50, and DenseNet121 analyze your scan simultaneously for maximum accuracy and reliability.",
              color: "var(--accent-cyan)",
              bg: "var(--accent-cyan-dim)",
            },
            {
              icon: <FileBarChart size={28} />,
              title: "AI-Generated Reports",
              desc: "Advanced language models analyze the predictions and generate comprehensive medical reports with risk assessment.",
              color: "var(--accent-blue)",
              bg: "var(--accent-blue-dim)",
            },
            {
              icon: <Shield size={28} />,
              title: "Risk Stratification",
              desc: "Get clear low, medium, or high risk classification with confidence scores to support clinical decision-making.",
              color: "var(--accent-purple)",
              bg: "var(--accent-purple-dim)",
            },
          ].map((feature) => (
            <div key={feature.title} className="glass-card" style={{ padding: 32 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--radius-md)",
                  background: feature.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: feature.color,
                  marginBottom: 20,
                }}
              >
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{feature.title}</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.5px" }}>
            How It Works
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
            From scan to diagnosis in three simple steps.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            {
              step: "01",
              title: "Upload Your MPI Scan",
              desc: "Drag and drop your myocardial perfusion imaging scan in JPG, PNG, or DICOM format.",
              icon: <Upload size={24} />,
            },
            {
              step: "02",
              title: "AI Analyzes the Scan",
              desc: "Three deep learning models process your image simultaneously, each providing independent analysis.",
              icon: <Brain size={24} />,
            },
            {
              step: "03",
              title: "Get Your Report",
              desc: "Receive a comprehensive report with risk assessment, model predictions, and clinical recommendations.",
              icon: <FileBarChart size={24} />,
            },
          ].map((step, i) => (
            <div
              key={step.step}
              style={{
                display: "flex",
                gap: 32,
                alignItems: "flex-start",
                padding: "32px 0",
                borderBottom: i < 2 ? "1px solid var(--border-color)" : "none",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--gradient-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                {step.step}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  {step.icon} {step.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== MODEL COMPARISON ===== */}
      <section style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.5px" }}>
            Model Performance
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
            Trained on real myocardial perfusion scintigraphy datasets.
          </p>
        </div>

        <div className="glass-card" style={{ overflow: "hidden", padding: 0 }}>
          <div className="table-container">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  {["Model", "AUC", "Accuracy", "Sensitivity", "Specificity", "F1-Score"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "VGG16", auc: "0.864", acc: "84.1%", sens: "88.2%", spec: "74.3%", f1: "0.811" },
                  { name: "ResNet50", auc: "0.840", acc: "83.4%", sens: "91.2%", spec: "72.5%", f1: "0.851" },
                  { name: "DenseNet121", auc: "0.890", acc: "87.4%", sens: "93.0%", spec: "75.2%", f1: "0.860", best: true },
                ].map((model) => (
                  <tr
                    key={model.name}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      background: model.best ? "var(--accent-cyan-dim)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 600 }}>
                      {model.name}
                      {model.best && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            background: "var(--accent-cyan)",
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-full)",
                            fontWeight: 700,
                          }}
                        >
                          BEST
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--accent-cyan)", fontWeight: 600 }}>{model.auc}</td>
                    <td style={{ padding: "14px 20px" }}>{model.acc}</td>
                    <td style={{ padding: "14px 20px" }}>{model.sens}</td>
                    <td style={{ padding: "14px 20px" }}>{model.spec}</td>
                    <td style={{ padding: "14px 20px" }}>{model.f1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ padding: "80px 24px 120px", textAlign: "center" }}>
        <div
          className="glass-card animate-pulse-glow"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "56px 40px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, letterSpacing: "-0.5px" }}>
            Ready to Analyze Your Scans?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 16 }}>
            Create a free account and start getting AI-powered cardiac analysis in seconds.
          </p>
          <Link href="/signup" className="btn-primary" style={{ padding: "16px 40px", fontSize: 17 }}>
            Create Free Account <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          borderTop: "1px solid var(--border-color)",
          padding: "32px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <Heart size={14} color="var(--accent-cyan)" fill="var(--accent-cyan)" />
          <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>CardioScan AI</span>
        </div>
        <p>
          Final Year Project – AI-Powered MPI Scan Analyzer for Heart Disease Prediction
        </p>
        <p style={{ marginTop: 4 }}>© {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}
