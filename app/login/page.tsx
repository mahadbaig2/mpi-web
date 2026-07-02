"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

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

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        const result = await loginWithGoogle(userInfo);
        if (result.success) {
          router.push("/dashboard");
        } else {
          setError(result.error || "Google sign-in failed");
        }
      } catch {
        setError("Google sign-in failed. Please try again.");
      }
      setGoogleLoading(false);
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--gradient-hero)",
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
        background: "radial-gradient(circle, rgba(220,38,38,0.04) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "20%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(190,18,60,0.03) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div className="mobile-px-4 mobile-py-8" style={{
        width: "100%", maxWidth: 440, position: "relative",
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border-color)",
        borderRadius: 20,
        padding: "52px 44px",
        boxShadow: "var(--shadow-lg)",
        animation: "fade-in-up 0.5s ease-out forwards",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            textDecoration: "none", color: "var(--text-primary)", marginBottom: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "var(--gradient-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-glow)",
            }}>
              <Heart size={22} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
              Cardio<span style={{ color: "var(--accent-cyan)" }}>Scan</span> AI
            </span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", margin: "16px 0 8px" }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
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

        {/* Google Button */}
        <button
          id="google-login-btn"
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading}
          className="google-btn"
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10,
            padding: "13px 20px", borderRadius: 12,
            border: "1px solid var(--border-color)",
            background: "var(--bg-input)",
            color: "var(--text-primary)", fontSize: 14, fontWeight: 600,
            cursor: googleLoading ? "not-allowed" : "pointer",
            transition: "all 0.25s ease",
            opacity: googleLoading ? 0.7 : 1,
            letterSpacing: "0.01em",
          }}
        >
          <GoogleIcon />
          {googleLoading ? "Signing in…" : "Continue with Google"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            or continue with email
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
        </div>

        {/* Email / Password */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="email" id="login-email" className="input-field"
                placeholder="you@example.com" value={email} required
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-secondary)" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
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

        <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--accent-cyan)", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>

      <style>{`
        .google-btn:hover:not(:disabled) {
          background: var(--bg-card-hover) !important;
          border-color: var(--accent-cyan) !important;
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  );
}
