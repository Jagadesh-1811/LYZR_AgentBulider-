"use client";

import { useState, useEffect } from "react";
import { PlusCircle, FileText, ChevronRight, Activity, MessageCircle, Globe, History, MessageSquare, Code, TrendingUp, Microscope, GraduationCap, Users, Trash2, Box } from "lucide-react";
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
    badgeColors: "bg-emerald-50 text-emerald-600 border-emerald-200",
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
    badgeColors: "bg-violet-50 text-violet-600 border-violet-200",
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
    badgeColors: "bg-amber-50 text-amber-600 border-amber-200",
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
    badgeColors: "bg-cyan-50 text-cyan-600 border-cyan-200",
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
    badgeColors: "bg-red-50 text-red-600 border-red-200",
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
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-700">
      
      {/* ── Embed Modal ───────────────────────────────────────────────── */}
      {embedAgent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Deploy to Website</h2>
                <p className="text-sm text-gray-500 mt-1">Embed <strong className="text-violet-600">{embedAgent.agentName || "your agent"}</strong> on any webpage</p>
              </div>
              <button onClick={() => setEmbedAgent(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5 bg-slate-50/50">
              {[
                { label: "HTML Script Tag", key: "script", code: `<script\n  src="https://cdn.lyzr.ai/widget.js"\n  data-agent-id="${embedAgent.agentId}"\n  data-theme="light"\n  async>\n</script>` },
                { label: "React Component", key: "react", code: `import LyzrWidget from '@lyzr-ai/widget-react';\n\n<LyzrWidget\n  agentId="${embedAgent.agentId}"\n  theme="light"\n/>` },
                { label: "iFrame Embed", key: "iframe", code: `<iframe\n  src="https://app.lyzr.ai/embed/${embedAgent.agentId}"\n  width="400" height="600"\n  frameborder="0">\n</iframe>` },
              ].map(({ label, key, code }) => (
                <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
                    <button 
                      onClick={() => copyEmbed(code, key)} 
                      className={`text-xs font-semibold transition-colors ${embedCopied === key ? "text-emerald-600" : "text-violet-600 hover:text-violet-700"}`}
                    >
                      {embedCopied === key ? "Copied!" : "Copy code"}
                    </button>
                  </div>
                  <pre className="m-0 p-4 bg-gray-900 text-gray-100 text-[13px] overflow-x-auto whitespace-pre-wrap break-all font-mono">
                    {code}
                  </pre>
                </div>
              ))}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-sm text-emerald-800 m-0 font-medium">Agent ID: <code className="font-mono font-bold bg-white px-2 py-0.5 rounded text-emerald-900 border border-emerald-200">{embedAgent.agentId}</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-5 shadow-sm z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center shadow-inner">
            <Box size={20} className="text-violet-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Lyzr Agent</h2>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-violet-50 text-violet-700 font-semibold rounded-xl border border-violet-100 shadow-sm transition-all">
            <Activity size={18} /> Overview
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <Globe size={18} /> Settings
          </div>
        </nav>

        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
          <div className="text-xs font-semibold text-gray-500 break-all px-2 truncate" title={user?.email}>{user?.email}</div>
          <button onClick={onLogout} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 font-semibold rounded-xl border border-transparent hover:border-red-100 transition-colors w-full">
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 p-8 md:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Create New Agent</h1>
            <p className="text-base text-gray-500">Choose how to build your Lyzr agent — start blank or pick a pre-built template.</p>
          </header>

          {/* ── Row: Scratch card + Template browser ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 items-start">

            {/* FROM SCRATCH ─ box card */}
            <div
              onClick={onSelectScratch}
              className="bg-white border border-gray-200 rounded-2xl p-7 cursor-pointer transition-all duration-200 shadow-sm hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 flex flex-col h-full group"
            >
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <PlusCircle size={24} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">From Scratch</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Blank configuration. Full control over logic, tools, and persona. Best for experienced developers.
                </p>
              </div>
              <div className="inline-flex w-max items-center gap-1.5 px-4 py-2 mt-auto bg-violet-600 text-white rounded-lg text-sm font-bold group-hover:bg-violet-700 transition-colors shadow-sm">
                Initialize <ChevronRight size={16} />
              </div>
            </div>

            {/* FROM TEMPLATE ─ category browser box */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-7 shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <FileText size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Browse Templates</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Pick a pre-built agent and customise via tutorial</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  <strong className="text-gray-900">{ALL_TEMPLATES.length}</strong> pre-built agents across <strong className="text-gray-900">{TEMPLATE_CATEGORIES.length}</strong> categories. Pick one and customise it through an interactive tutorial.
                </p>
                <div className="flex gap-2 flex-wrap mb-6">
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <span
                      key={cat.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cat.badgeColors}`}
                    >
                      <cat.icon size={14} /> {cat.label} · {cat.templates.length}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onBrowseTemplates()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold bg-violet-600 text-white rounded-xl shadow-sm hover:bg-violet-700 hover:shadow transition-all w-max"
              >
                Browse Templates <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* ── Workspaces ───────────────────────────────────── */}
          <div className="mb-12">
            <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">My Workspaces</h3>
                <p className="text-sm text-gray-500 mt-1">Collaborative environments for your agents</p>
              </div>
              <button 
                onClick={() => setShowWorkspaceBuilder(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
              >
                <Users size={16} /> Create Workspace
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Workspace Name</th>
                      <th className="px-6 py-4">Agents Linked</th>
                      <th className="px-6 py-4">Created At</th>
                      <th className="px-6 py-4">Workspace ID</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading workspaces…</td>
                      </tr>
                    ) : workspaces.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No workspaces created. Build one to let your agents collaborate!</td>
                      </tr>
                    ) : (
                      workspaces.map((ws) => (
                        <tr key={ws.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-gray-900 font-bold">{ws.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5">
                              {ws.agents.map((agId, i) => (
                                <span key={i} className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">{agId.slice(0,6)}...</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {ws.createdAt?.toDate ? ws.createdAt.toDate().toLocaleDateString() : "Just now"}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-400 text-xs">{ws.id}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => onSelectWorkspace && onSelectWorkspace(ws)}
                                title="Open Workspace Sandbox"
                                className="p-2 bg-white border border-gray-200 text-violet-600 rounded-lg hover:bg-violet-50 hover:border-violet-200 transition-colors shadow-sm"
                              >
                                <MessageCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteWorkspace(ws.id)}
                                title="Delete Workspace"
                                className="p-2 bg-white border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                              >
                                <Trash2 size={16} />
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
          </div>

          {/* ── Recent Deployments ───────────────────────────────────── */}
          <div>
            <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Recent Deployments</h3>
                <p className="text-sm text-gray-500 mt-1">Manage and test your active agents</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Agent Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Agent ID</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Model</th>
                      <th className="px-6 py-4">RAG URL</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading deployments…</td>
                      </tr>
                    ) : agents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No agents deployed yet. Create one above!</td>
                      </tr>
                    ) : (
                      agents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-gray-900 font-bold flex items-center gap-2">
                            {agent.agentName || agent.config?.name || "Unnamed Agent"}
                            {agent.source === "tutorial" && (
                              <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded uppercase tracking-wider">SDK</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {agent.creationMode === "template" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Template{agent.templateCategory ? ` · ${agent.templateCategory}` : ""}
                              </span>
                            ) : agent.creationMode === "scratch" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Scratch
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                Legacy
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-400 text-xs">{agent.agentId}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                              agent.status === "Failed" 
                                ? "bg-red-50 text-red-700 border-red-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {agent.status || "Operational"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">{agent.model || agent.config?.model || "—"}</td>
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            {agent.ragUrl ? (
                              <a href={agent.ragUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-violet-600 hover:text-violet-800 hover:underline">
                                <Globe size={12} /> <span className="max-w-[120px] truncate">{agent.ragUrl.replace(/^https?:\/\//, "")}</span>
                              </a>
                            ) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setHistoryAgent(agent)}
                                title="Version History"
                                className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                              >
                                <History size={16} />
                              </button>
                              <button
                                onClick={() => onSelectExistingAgent(agent)}
                                title="Open Sandbox"
                                className="p-2 bg-white border border-gray-200 text-violet-600 rounded-lg hover:bg-violet-50 hover:border-violet-200 transition-colors shadow-sm"
                              >
                                <MessageCircle size={16} />
                              </button>
                              <button
                                onClick={() => setEmbedAgent(agent)}
                                title="Deploy to Website"
                                className="px-3 py-1.5 bg-violet-600 border border-transparent text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm text-xs font-bold"
                              >
                                Embed
                              </button>
                              <button
                                onClick={() => handleDeleteAgent(agent.id)}
                                title="Delete Deployment"
                                className="p-2 bg-white border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm"
                              >
                                <Trash2 size={16} />
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
