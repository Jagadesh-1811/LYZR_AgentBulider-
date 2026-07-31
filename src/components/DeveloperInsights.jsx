"use client";

import { Activity, Server, Zap, Database } from "lucide-react";

export default function DeveloperInsights() {
  // Mock data arrays for the charts
  const latencyData = [120, 135, 142, 110, 150, 125, 142, 138, 145, 130];
  const tokenData = [800, 1200, 950, 2100, 1450, 890, 1240];
  
  // Helpers to draw the charts
  const maxLatency = Math.max(...latencyData);
  const latencyPoints = latencyData.map((val, idx) => {
    return `${(idx / (latencyData.length - 1)) * 100},${100 - (val / maxLatency) * 100}`;
  }).join(" ");

  const maxTokens = Math.max(...tokenData);

  return (
    <div className="flex flex-col h-full bg-surface-base border border-border-default rounded-md overflow-hidden shadow-shadow-2">
      {/* Header */}
      <div className="flex items-center justify-between px-space-6 py-space-4 border-b border-border-default bg-surface-muted">
        <div className="flex items-center gap-space-3">
          <div className="p-2 bg-border-muted rounded-xs border border-border-default">
            <Activity size={14} className="text-text-secondary" />
          </div>
          <span className="text-[13px] font-bold text-text-inverse">Telemetry & Diagnostics</span>
        </div>
        <div className="flex items-center gap-space-4">
          <span className="flex items-center gap-space-2 text-[11px] font-bold text-text-primary px-space-3 py-space-1 bg-surface-base rounded-full border border-border-default">
            <div className="w-1.5 h-1.5 rounded-full bg-surface-raised animate-pulse"></div>
            US-EAST-1
          </span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 p-space-6 grid grid-cols-3 gap-space-6 bg-surface-base">
        
        {/* Metric 1: Latency Sparkline */}
        <div className="flex flex-col bg-surface-muted rounded-md border border-border-default p-space-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-space-4 relative z-10">
            <div className="flex items-center gap-space-2 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              <Zap size={12} className="text-surface-raised" /> Average Latency
            </div>
            <div className="text-[20px] font-bold text-text-inverse">
              142<span className="text-[12px] text-text-primary ml-1 font-normal">ms</span>
            </div>
          </div>
          <div className="flex-1 w-full relative z-0 mt-space-2">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-surface-raised)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-surface-raised)" stopOpacity="0" />
              </linearGradient>
              <polygon points={`0,100 ${latencyPoints} 100,100`} fill="url(#latGrad)" />
              <polyline points={latencyPoints} fill="none" stroke="var(--color-surface-raised)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>

        {/* Metric 2: Context Relevance Radial */}
        <div className="flex flex-col bg-surface-muted rounded-md border border-border-default p-space-5 items-center justify-center relative">
          <div className="absolute top-space-5 left-space-5 flex items-center gap-space-2 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
             <Database size={12} className="text-text-secondary" /> Context Score
          </div>
          
          <div className="relative w-28 h-28 mt-space-4 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="var(--color-border-default)" strokeWidth="8" />
              {/* Foreground Circle (89% fill) */}
              <circle cx="56" cy="56" r="48" fill="none" stroke="var(--color-text-secondary)" strokeWidth="8" 
                      strokeDasharray="301.59" strokeDashoffset="33.17" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-[24px] font-bold text-text-inverse">0.89</span>
              <span className="text-[10px] text-text-primary uppercase tracking-wider font-bold">Score</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Token Usage Bar Chart */}
        <div className="flex flex-col bg-surface-muted rounded-md border border-border-default p-space-5">
          <div className="flex items-center justify-between mb-space-4">
            <div className="flex items-center gap-space-2 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              <Server size={12} className="text-text-primary" /> Token Load
            </div>
            <div className="text-[20px] font-bold text-text-inverse">
              1.2k<span className="text-[12px] text-text-primary ml-1 font-normal">avg</span>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-space-2 mt-space-2 pb-space-2">
            {tokenData.map((val, idx) => {
              const heightPct = (val / maxTokens) * 100;
              return (
                <div key={idx} className="w-full bg-border-default rounded-t-sm relative group">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-text-tertiary rounded-t-sm transition-all duration-500 group-hover:bg-text-secondary"
                    style={{ height: `${heightPct}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
