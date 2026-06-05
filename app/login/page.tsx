"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { isGoogleOAuthConfigured } from "@/lib/google-auth";

export default function LoginPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const showGoogleAuth = isGoogleOAuthConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0e1a 0%, #0f1629 40%, #131b3a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "20%", left: "30%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,214,160,0.07) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "20%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div className="mobile-px-4 mobile-py-8" style={{
        width: "100%", maxWidth: 440, position: "relative",
        background: "rgba(26,31,53,0.75)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(148,163,184,0.12)",
        borderRadius: 20,
        padding: "52px 44px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        animation: "fade-in-up 0.5s ease-out forwards",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            textDecoration: "none", color: "#f0f4ff", marginBottom: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #06d6a0, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(6,214,160,0.3)",
            }}>
              <Heart size={22} color="#000" fill="#000" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#f0f4ff" }}>
              Cardio<span style={{ color: "#06d6a0" }}>Scan</span> AI
            </span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f0f4ff", margin: "16px 0 8px" }}>
            Welcome back
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
            Log in to access your dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "12px 16px", marginBottom: 20, fontSize: 13,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, color: "#ef4444",
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {showGoogleAuth && (
          <>
            <GoogleSignInButton
              id="google-login-btn"
              label="Continue with Google"
              onError={setError}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                or continue with email
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
          </>
        )}

        {/* Email / Password */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#94a3b8" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="email" id="login-email" className="input-field"
                placeholder="you@example.com" value={email} required
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#94a3b8" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="password" id="login-password" className="input-field"
                placeholder="Enter your password" value={password} required
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <button
            type="submit" id="login-submit" className="btn-primary"
            disabled={loading}
            style={{
              width: "100%", justifyContent: "center",
              marginTop: 6, padding: "14px 28px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in…" : "Log In"} <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "#94a3b8" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#06d6a0", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>

      <style>{`
        .google-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.25) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
