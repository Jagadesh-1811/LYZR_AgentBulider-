import React, { useState } from 'react';
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Users, Plus, X, Loader2, Bot } from 'lucide-react';

export default function AgentWorkspaceBuilder({ user, agents, onComplete, onCancel }) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleAgent = (agentId) => {
    if (selectedAgents.includes(agentId)) {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  const handleCreate = async () => {
    if (!workspaceName.trim() || selectedAgents.length < 2) return;
    
    setIsSaving(true);
    try {
      const workspaceDoc = {
        userId: user?.email || "anonymous",
        name: workspaceName,
        agents: selectedAgents,
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, "workspaces"), workspaceDoc);
      onComplete({ id: docRef.id, ...workspaceDoc });
    } catch (err) {
      console.error("Failed to create workspace:", err);
      alert("Failed to create workspace.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", backgroundColor: "#f0fdf4", borderRadius: "10px", color: "#059669" }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>Create Workspace</h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>Link multiple agents together in a collaborative environment.</p>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", transition: "background 150ms" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#f3f4f6"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>Workspace Name</label>
            <input 
              type="text" 
              placeholder="e.g. Acme Support Team" 
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", transition: "border-color 150ms" }}
              onFocus={e => e.target.style.borderColor = "#059669"}
              onBlur={e => e.target.style.borderColor = "#d1d5db"}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
              Select Agents to Link
              <span style={{ fontSize: "11px", fontWeight: "600", color: selectedAgents.length >= 2 ? "#059669" : "#ef4444" }}>
                {selectedAgents.length} selected (min. 2)
              </span>
            </label>
            
            {agents.length < 2 ? (
              <div style={{ padding: "20px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px", textAlign: "center" }}>
                You need at least 2 deployed agents to create a Workspace. Please deploy more agents first.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto", padding: "4px" }}>
                {agents.map(agent => (
                  <div 
                    key={agent.id}
                    onClick={() => toggleAgent(agent.agentId)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "12px", padding: "12px", 
                      border: `2px solid ${selectedAgents.includes(agent.agentId) ? "#059669" : "#e5e7eb"}`, 
                      backgroundColor: selectedAgents.includes(agent.agentId) ? "#f0fdf4" : "#ffffff",
                      borderRadius: "10px", cursor: "pointer", transition: "all 150ms" 
                    }}
                  >
                    <div style={{ width: "20px", height: "20px", borderRadius: "6px", border: `2px solid ${selectedAgents.includes(agent.agentId) ? "#059669" : "#d1d5db"}`, backgroundColor: selectedAgents.includes(agent.agentId) ? "#059669" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedAgents.includes(agent.agentId) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Bot size={14} color={selectedAgents.includes(agent.agentId) ? "#059669" : "#6b7280"} /> 
                        {agent.agentName || agent.config?.name || "Unnamed Agent"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                        ID: <span style={{ fontFamily: "monospace" }}>{agent.agentId}</span> • Model: {agent.model || agent.config?.model || "Unknown"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 24px", borderTop: "1px solid #e5e7eb", backgroundColor: "#f9fafb", display: "flex", justifyContent: "flex-end", gap: "12px", borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
          <button 
            onClick={onCancel}
            style={{ padding: "10px 20px", fontSize: "14px", fontWeight: "600", color: "#374151", backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={isSaving || !workspaceName.trim() || selectedAgents.length < 2}
            style={{ 
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "700", color: "#ffffff", 
              backgroundColor: (!workspaceName.trim() || selectedAgents.length < 2) ? "#9ca3af" : "#059669", 
              border: "none", borderRadius: "8px", cursor: (!workspaceName.trim() || selectedAgents.length < 2) ? "not-allowed" : "pointer",
              transition: "background 150ms"
            }}
          >
            {isSaving ? <Loader2 size={16} className="lucide-spin" /> : <Plus size={16} />}
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
