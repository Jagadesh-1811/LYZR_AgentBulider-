"use client";

import React, { useState, useEffect } from "react";
import { History, X, RotateCcw, Loader2 } from "lucide-react";

export default function AgentVersionHistory({ agent, onClose, onRollbackComplete, authToken }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/versions/${agent.agentId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
          setVersions(data.versions);
        } else {
          setError(data.error || "Failed to load versions");
        }
      } catch (err) {
        setError("Network error fetching versions");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (agent?.agentId) {
      fetchVersions();
    }
  }, [agent, authToken]);

  const handleRollback = async (versionId) => {
    if (!window.confirm(`Are you sure you want to revert to ${versionId}?`)) return;
    
    setIsRollingBack(true);
    setError("");
    
    try {
      const res = await fetch(`http://localhost:4000/api/versions/rollback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ agentId: agent.agentId, versionId })
      });
      
      const data = await res.json();
      if (data.success) {
        if (onRollbackComplete) onRollbackComplete();
        onClose();
      } else {
        setError(data.error || "Failed to rollback");
      }
    } catch (err) {
      setError("Network error during rollback");
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f9fafb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={18} color="#7c3aed" />
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0 }}>Version History</h2>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", maxHeight: "400px", overflowY: "auto" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>Agent: {agent.agentName || "Unknown"}</div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>ID: {agent.agentId}</div>
          </div>

          {error && (
            <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "#6b7280", gap: "8px" }}>
              <Loader2 size={16} className="animate-spin" /> Loading history...
            </div>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: "14px" }}>
              No version history found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {versions.map((version, index) => (
                <div key={version.id} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: index === 0 ? "#f0fdf4" : "#ffffff", borderColor: index === 0 ? "#bbf7d0" : "#e5e7eb" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>{version.id}</span>
                      {index === 0 && (
                        <span style={{ fontSize: "10px", fontWeight: "600", color: "#166534", backgroundColor: "#dcfce7", padding: "2px 6px", borderRadius: "10px" }}>Current</span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#4b5563" }}>{version.description || "Agent Updated"}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  {index !== 0 && (
                    <button 
                      onClick={() => handleRollback(version.id)}
                      disabled={isRollingBack}
                      style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", color: "#ffffff", backgroundColor: "#3b82f6", border: "none", borderRadius: "6px", cursor: isRollingBack ? "not-allowed" : "pointer", opacity: isRollingBack ? 0.7 : 1 }}
                    >
                      {isRollingBack ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      Revert
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
