"use client";

import React from "react";
import { FileImage, ChevronRight, Trash2, Calendar, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

interface Scan {
  id: string;
  date: string;
  filename: string;
  predictions: {
    ensemble: {
      risk_level: string;
      probability: number;
    };
  };
}

interface RecentScansProps {
  scans: Scan[];
  onDelete: (id: string) => void;
}

export default function RecentScans({ scans, onDelete }: RecentScansProps) {
  const router = useRouter();

  if (scans.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <FileImage size={48} style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: 16 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No activity history</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 200 }}>Upload a scan to see your analysis history here.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Activity</h3>
        <span style={{ fontSize: 12, color: "var(--accent-cyan)", fontWeight: 600, cursor: "pointer" }}>View All</span>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {scans.slice(0, 5).map((scan) => (
          <div
            key={scan.id}
            onClick={() => router.push(`/results?id=${scan.id}`)}
            className="flex items-center justify-between p-3 sm:p-4 bg-[var(--bg-card-hover)] rounded-md border border-[var(--border-color)] cursor-pointer hover:translate-x-1 hover:border-[var(--border-glow)] transition-all duration-200"
          >
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden mr-2">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-sm bg-[var(--bg-input)] flex items-center justify-center text-[var(--accent-cyan)] border border-[var(--border-color)] shrink-0">
                <FileImage size={20} />
              </div>
              <div className="overflow-hidden">
                <div className="text-[13px] sm:text-sm font-bold mb-1 truncate">{scan.filename}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar size={12} /> {new Date(scan.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Shield size={12} /> {scan.predictions.ensemble.risk_level} Risk
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <div className="text-right mr-1 sm:mr-2">
                <div className="text-[13px] sm:text-sm font-extrabold text-[var(--text-primary)]">
                  {(scan.predictions.ensemble.probability * 100).toFixed(0)}%
                </div>
                <div className="text-[9px] sm:text-[10px] text-[var(--text-muted)] uppercase">Prob.</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(scan.id);
                }}
                className="p-1.5 sm:p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
              <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
