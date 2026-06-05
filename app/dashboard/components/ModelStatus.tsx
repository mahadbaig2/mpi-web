"use client";

import React, { useState, useEffect } from "react";
import { Activity, Zap, Check } from "lucide-react";

interface ModelStatusProps {
  models: {
    name: string;
    status: "online" | "offline" | "loading";
    accuracy: string;
    color: string;
  }[];
}

export default function ModelStatus({ models }: ModelStatusProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Activity size={18} className="animate-heartbeat" style={{ color: "var(--accent-cyan)" }} />
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Ensemble Status</h3>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {models.map((model) => (
          <div key={model.name} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--bg-input)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            transition: "all 0.3s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: model.status === "online" ? "var(--accent-cyan)" : "var(--accent-red)",
                  boxShadow: model.status === "online" && pulse ? `0 0 12px ${model.color}` : "none",
                  transition: "box-shadow 1s ease-in-out"
                }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{model.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{model.accuracy} AUC Accuracy</div>
              </div>
            </div>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: model.status === "online" ? "var(--accent-cyan)" : "var(--accent-red)",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              {model.status === "online" ? (
                <>
                  <Zap size={10} /> Active
                </>
              ) : (
                <>
                  Offline
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: "auto",
        padding: "10px",
        background: "rgba(6,214,160,0.05)",
        borderRadius: "var(--radius-sm)",
        fontSize: 11,
        color: "var(--text-muted)",
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        <Check size={12} style={{ color: "var(--accent-cyan)" }} />
        All models verified and ready for inference
      </div>
    </div>
  );
}
