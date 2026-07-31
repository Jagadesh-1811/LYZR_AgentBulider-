"use client";

import { useState, useEffect } from "react";
import { PlusCircle, FileText, ChevronRight, Activity, MessageCircle, Globe, History, MessageSquare, Code, TrendingUp, Microscope, GraduationCap, Users, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import AgentVersionHistory from "./AgentVersionHistory";
import AgentWorkspaceBuilder from "./AgentWorkspaceBuilder";

// ─── Template catalogue, grouped by category ──────────────────────────────
const TEMPLATE_CATEGORIES = [
  {
    id: "customer-service",
    label: "Customer Service",
    icon: MessageSquare,
    color: "#059669",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    templates: [
      {
        id: "support",
        name: "Customer Support Agent",
        description: "Handles level 1 customer inquiries with empathy and clarity.",
        config: { name: "Customer Support Agent", model: "gemini-2.5-pro", temperature: 0.1, instruction: "You are a polite, empathetic customer support agent. Answer questions concisely and always ask if there is anything else you can help with." },
      },
      {
        id: "returns",
        name: "Returns & Refunds Bot",
        description: "Guides customers through return and refund processes efficiently.",
        config: { name: "Returns & Refunds Bot", model: "gemini-2.5-pro", temperature: 0.1, instruction: "You are a helpful returns and refunds specialist. Guide customers through return policies, initiate refund requests, and resolve issues with empathy." },
      },
    ],
  },
  {
    id: "development",
    label: "Development",
    icon: Code,
    color: "#7c3aed",
    bgColor: "#f3f0ff",
    borderColor: "#ddd6fe",
    templates: [
      {
        id: "engineer",
        name: "Senior Software Engineer",
        description: "Debugs code, explains algorithms and complex concepts with snippets.",
        config: { name: "Senior Software Engineer", model: "gemini-2.5-pro", temperature: 0.2, instruction: "You are a senior software engineer. Help the user debug code, write efficient algorithms, and explain complex technical concepts with simple language. Always provide code snippets when applicable." },
      },
      {
        id: "reviewer",
        name: "Code Reviewer",
        description: "Reviews PRs for bugs, security issues, and best practices.",
        config: { name: "Code Reviewer", model: "gemini-2.5-pro", temperature: 0.1, instruction: "You are an expert code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and style violations. Provide constructive feedback with specific suggestions for improvement." },
      },
    ],
  },
  {
    id: "sales",
    label: "Sales & Marketing",
    icon: TrendingUp,
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    templates: [
      {
        id: "sales",
        name: "Sales Assistant",
        description: "Qualifies leads, answers product questions, and drives conversions.",
        config: { name: "Sales Assistant", model: "gemini-2.5-pro", temperature: 0.4, instruction: "You are an enthusiastic and knowledgeable sales assistant. Help users understand product benefits, answer objections, and guide them towards making a purchase decision." },
      },
      {
        id: "lead",
        name: "Lead Qualifier",
        description: "Qualifies inbound leads and schedules demos automatically.",
        config: { name: "Lead Qualifier", model: "gemini-2.5-pro", temperature: 0.3, instruction: "You are a lead qualification specialist. Ask strategic questions to understand prospect needs, budget, timeline, and decision-making authority. Qualify leads and schedule demos for qualified prospects." },
      },
    ],
  },
  {
    id: "research",
    label: "Research",
    icon: Microscope,
    color: "#0891b2",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    templates: [
      {
        id: "researcher",
        name: "Research Analyst",
        description: "Synthesizes information, summarizes documents, and surfaces insights.",
        config: { name: "Research Analyst", model: "gemini-2.5-pro", temperature: 0.3, instruction: "You are a thorough research analyst. Summarize complex topics, surface key insights from documents, and present information in a structured, easy-to-read format with bullet points and headings." },
      },
      {
        id: "data-insights",
        name: "Data Insights Bot",
        description: "Interprets data trends and generates executive summaries.",
        config: { name: "Data Insights Bot", model: "gemini-2.5-pro", temperature: 0.2, instruction: "You are a data analyst expert. Interpret data patterns, identify trends, and generate clear executive summaries. Present findings with actionable insights and visualizable recommendations." },
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    templates: [
      {
        id: "tutor",
        name: "Personal Tutor",
        description: "Teaches any subject step-by-step with quizzes and examples.",
        config: { name: "Personal Tutor", model: "gemini-2.5-pro", temperature: 0.5, instruction: "You are a patient and encouraging personal tutor. Break down topics step-by-step, use relatable examples, ask comprehension questions, and adapt your explanations based on the user's level of understanding." },
      },
      {
        id: "quiz",
        name: "Quiz Master",
        description: "Creates adaptive quizzes and tracks learning progress.",
        config: { name: "Quiz Master", model: "gemini-2.5-pro", temperature: 0.6, instruction: "You are an engaging quiz master. Create adaptive questions based on the topic, provide hints when needed, explain correct answers, and track the student's progress throughout the session." },
      },
    ],
  },
];

// flatten for "All" tab
const ALL_TEMPLATES = TEMPLATE_CATEGORIES.flatMap((cat) =>
  cat.templates.map((t) => ({ ...t, category: cat }))
);

// ─── Component ────────────────────────────────────────────────────────────
export default function TemplateSelector({ user, onSelectScratch, onSelectTemplate, onSelectExistingAgent, onSelectWorkspace, onBrowseTemplates, onLogout }) {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [embedAgent, setEmbedAgent] = useState(null);
  const [embedCopied, setEmbedCopied] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [historyAgent, setHistoryAgent] = useState(null);
  
  const [workspaces, setWorkspaces] = useState([]);
  const [showWorkspaceBuilder, setShowWorkspaceBuilder] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user?.email) return;
      try {
        const q = query(collection(db, "deployments"), where("userId", "==", user.email));
        const snapshot = await getDocs(q);
        const agentsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        agentsList.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });

      
        setAgents(agentsList);
      } catch (error) {
        console.error("Error fetching agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchWorkspaces = async () => {
      if (!user?.email) return;
      try {
        const q = query(collection(db, "workspaces"), where("userId", "==", user.email));
        const snapshot = await getDocs(q);
        const workspacesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        workspacesList.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        setWorkspaces(workspacesList);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      }
    };
  
    fetchAgents();
    fetchWorkspaces();
  }, [user]);

  const handleDeleteAgent = async (agentId) => {
    if (!confirm("Are you sure you want to delete this deployment? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "deployments", agentId));
      setAgents(agents.filter(a => a.id !== agentId));
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Failed to delete deployment.");
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "workspaces", workspaceId));
      setWorkspaces(workspaces.filter(ws => ws.id !== workspaceId));
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Failed to delete workspace.");
    }
  };

  const copyEmbed = (text, key) => {
    navigator.clipboard.writeText(text);
    setEmbedCopied(key);
    setTimeout(() => setEmbedCopied(""), 2000);
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif", display: "flex", color: "#374151" }}>

      {/* ── Embed Modal ───────────────────────────────────────────────── */}
      {embedAgent && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "640px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>Deploy to Website</h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>Embed <strong>{embedAgent.agentName || "your agent"}</strong> on any webpage</p>
              </div>
              <button onClick={() => setEmbedAgent(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { label: "HTML Script Tag", key: "script", code: `<script\n  src="https://cdn.lyzr.ai/widget.js"\n  data-agent-id="${embedAgent.agentId}"\n  data-theme="light"\n  async>\n</script>` },
                { label: "React Component", key: "react", code: `import LyzrWidget from '@lyzr-ai/widget-react';\n\n<LyzrWidget\n  agentId="${embedAgent.agentId}"\n  theme="light"\n/>` },
                { label: "iFrame Embed", key: "iframe", code: `<iframe\n  src="https://app.lyzr.ai/embed/${embedAgent.agentId}"\n  width="400" height="600"\n  frameborder="0">\n</iframe>` },
              ].map(({ label, key, code }) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151", textTransform: "uppercase" }}>{label}</span>
                    <button onClick={() => copyEmbed(code, key)} style={{ fontSize: "11px", fontWeight: "600", color: embedCopied === key ? "#059669" : "#7c3aed", background: "none", border: "none", cursor: "pointer" }}>
                      {embedCopied === key ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: "12px 16px", backgroundColor: "#111827", borderRadius: "8px", fontSize: "12px", color: "#f8fafc", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{code}</pre>
                </div>
              ))}
              <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#065f46" }}>Agent ID: <code style={{ fontFamily: "monospace", fontWeight: "700" }}>{embedAgent.agentId}</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside style={{ width: "256px", backgroundColor: "#ffffff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "14px" }}>
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "32px", height: "32px", backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={16} color="#7c3aed" />
          </div>
          <h2 style={{ fontSize: "14px", fontWeight: "700", color: "#111827", margin: 0 }}>Lyzr Agent</h2>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#f8fafc", color: "#7c3aed", border: "1px solid #ddd6fe", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
            <Activity size={14} /> Overview
          </div>
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#6b7280", wordBreak: "break-all" }}>{user?.email}</div>
          <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "20px 40px", overflowY: "auto" }}>

        {/* Header */}
        <header style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: "0 0 6px 0" }}>Create New Agent</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Choose how to build your Lyzr agent — start blank or pick a pre-built template.</p>
        </header>

        {/* ── Row: Scratch card + Template browser ─────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginBottom: "28px", alignItems: "start" }}>

          {/* FROM SCRATCH ─ box card */}
          <div
            onClick={onSelectScratch}
            style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "28px 24px", cursor: "pointer", transition: "all 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "16px" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#ddd6fe"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(124,58,237,0.15)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
          >
            <div style={{ width: "52px", height: "52px", backgroundColor: "#f3f0ff", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PlusCircle size={26} color="#7c3aed" />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#111827", margin: "0 0 6px 0" }}>From Scratch</h3>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, lineHeight: "18px" }}>
                Blank configuration. Full control over logic, tools, and persona. Best for experienced developers.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#7c3aed", marginTop: "auto" }}>
              Initialize <ChevronRight size={14} />
            </div>
          </div>

          {/* FROM TEMPLATE ─ category browser box */}
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "36px", height: "36px", backgroundColor: "#f3f0ff", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={18} color="#7c3aed" />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0 }}>Browse Templates</h3>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Pick a pre-built agent and customise via tutorial</p>
                </div>
              </div>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "14px", lineHeight: "18px" }}>
                {ALL_TEMPLATES.length} pre-built agents across {TEMPLATE_CATEGORIES.length} categories. Pick one and customise it through an interactive tutorial.
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <span
                    key={cat.id}
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: cat.bgColor, color: cat.color, border: `1px solid ${cat.borderColor}` }}
                  >
                    <cat.icon size={12} /> {cat.label} · {cat.templates.length}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onBrowseTemplates()}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "12px", fontWeight: "700", backgroundColor: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background 150ms" }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#6d28d9"; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#7c3aed"; }}
              >
                Browse Templates <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Workspaces ───────────────────────────────────── */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #f3f4f6" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>My Workspaces</h3>
            <button 
              onClick={() => setShowWorkspaceBuilder(true)}
              style={{ padding: "6px 12px", backgroundColor: "#059669", color: "#ffffff", fontSize: "12px", fontWeight: "700", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Users size={14} /> Create Workspace
            </button>
          </div>
          
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: "10px", color: "#374151", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Workspace Name</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Agents Linked</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Created At</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Workspace ID</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Loading workspaces…</td>
                  </tr>
                ) : workspaces.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>No workspaces created. Build one to let your agents collaborate!</td>
                  </tr>
                ) : (
                  workspaces.map((ws) => (
                    <tr key={ws.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 14px", color: "#111827", fontWeight: "700" }}>{ws.name}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {ws.agents.map((agId, i) => (
                            <span key={i} style={{ fontSize: "10px", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>{agId.slice(0,6)}...</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>
                        {ws.createdAt?.toDate ? ws.createdAt.toDate().toLocaleDateString() : "Just now"}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#6b7280" }}>{ws.id}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => onSelectWorkspace && onSelectWorkspace(ws)}
                            title="Open Workspace Sandbox"
                            style={{ padding: "6px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", color: "#7c3aed", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.borderColor = "#ddd6fe"; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                          >
                            <MessageCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkspace(ws.id)}
                            title="Delete Workspace"
                            style={{ padding: "6px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recent Deployments ───────────────────────────────────── */}
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #f3f4f6" }}>Recent Deployments</h3>

          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: "10px", color: "#374151", textTransform: "uppercase" }}>
                <tr>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Agent Name</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Category</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Agent ID</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>Model</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700" }}>RAG URL</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>Loading deployments…</td>
                  </tr>
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>No agents deployed yet. Create one above!</td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 14px", color: "#111827", fontWeight: "700" }}>
                        {agent.agentName || agent.config?.name || "Unnamed Agent"}
                        {agent.source === "tutorial" && (
                          <span style={{ fontSize: "9px", fontWeight: "700", color: "#7c3aed", backgroundColor: "#f3f0ff", padding: "1px 5px", borderRadius: "4px", marginLeft: "6px" }}>SDK Tutorial</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {agent.creationMode === "template" ? (
                          <span style={{ fontSize: "10px", fontWeight: "600", color: "#ea580c", backgroundColor: "#fff7ed", padding: "2px 6px", borderRadius: "12px", border: "1px solid #ffedd5" }}>
                            Template{agent.templateCategory ? ` · ${agent.templateCategory}` : ""}
                          </span>
                        ) : agent.creationMode === "scratch" ? (
                          <span style={{ fontSize: "10px", fontWeight: "600", color: "#4f46e5", backgroundColor: "#eef2ff", padding: "2px 6px", borderRadius: "12px", border: "1px solid #e0e7ff" }}>
                            Scratch
                          </span>
                        ) : (
                          <span style={{ fontSize: "10px", fontWeight: "600", color: "#6b7280", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                            Legacy
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: "11px" }}>{agent.agentId}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          backgroundColor: agent.status === "Failed" ? "#fef2f2" : "#f0fdf4",
                          color: agent.status === "Failed" ? "#ef4444" : "#059669",
                          padding: "2px 6px", borderRadius: "8px", fontSize: "10px", fontWeight: "700",
                          border: `1px solid ${agent.status === "Failed" ? "#fecaca" : "#bbf7d0"}`,
                        }}>
                          {agent.status || "Operational"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#374151", fontSize: "11px" }}>{agent.model || agent.config?.model || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#374151", fontSize: "11px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {agent.ragUrl ? (
                          <a href={agent.ragUrl} target="_blank" rel="noreferrer" style={{ color: "#7c3aed", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                            <Globe size={10} /> {agent.ragUrl.replace(/^https?:\/\//, "").substring(0, 20)}…
                          </a>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setHistoryAgent(agent)}
                          title="Version History"
                          style={{ padding: "6px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", color: "#374151", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                        >
                          <History size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          title="Delete Deployment"
                          style={{ padding: "6px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => onSelectExistingAgent(agent)}
                          title="Open Sandbox"
                          style={{ padding: "6px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", color: "#7c3aed", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.borderColor = "#ddd6fe"; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          onClick={() => setEmbedAgent(agent)}
                          title="Deploy to Website"
                          style={{ padding: "6px 10px", background: "#7c3aed", border: "none", borderRadius: "6px", cursor: "pointer", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "700" }}
                        >
                          Deploy to Website
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {historyAgent && (
        <AgentVersionHistory 
          agent={historyAgent} 
          onClose={() => setHistoryAgent(null)}
          onRollbackComplete={() => {
            // Ideally re-fetch agents here, but for now we just show it completed
            alert("Agent rolled back successfully!");
          }}
          authToken={localStorage.getItem("lyzr_auth_token")}
        />
      )}
      
      {showWorkspaceBuilder && (
        <AgentWorkspaceBuilder 
          user={user}
          agents={agents}
          onCancel={() => setShowWorkspaceBuilder(false)}
          onComplete={(newWorkspace) => {
            setWorkspaces([newWorkspace, ...workspaces]);
            setShowWorkspaceBuilder(false);
          }}
        />
      )}
    </div>
  );
}
