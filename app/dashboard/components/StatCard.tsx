"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

export default function StatCard({ title, value, label, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="glass-card" style={{ padding: 24, flex: 1, minWidth: 200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "var(--radius-md)",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
          }}
        >
          <Icon size={20} />
        </div>
        {trend && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: trend.isUp ? "var(--accent-cyan)" : "var(--accent-red)",
              background: trend.isUp ? "var(--accent-cyan-dim)" : "var(--accent-red-dim)",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
            }}
          >
            {trend.isUp ? "+" : "-"}{trend.value}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
        {label}
      </div>
      
      {/* Decorative background glow */}
      <div style={{
        position: "absolute",
        bottom: -20,
        right: -20,
        width: 80,
        height: 80,
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
        filter: "blur(20px)",
        pointerEvents: "none"
      }} />
    </div>
  );
}
