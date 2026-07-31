"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, Search, MessageSquare, Code, TrendingUp, Microscope, GraduationCap } from "lucide-react";

// ─── Same catalogue as TemplateSelector ──────────────────────────────────
const TEMPLATE_CATEGORIES = [
  {
    id: "customer-service",
    label: "Customer Service",
    icon: MessageSquare,
    color: "#059669",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    gradient: "linear-gradient(135deg, #059669, #047857)",
    templates: [
      {
        id: "support",
        name: "Customer Support Agent",
        tagline: "Level 1 support, empathy-first",
        description: "Handles inbound customer inquiries with warmth and clarity. Perfect for e-commerce, SaaS, and service businesses that need a 24/7 first responder.",
        features: ["Empathetic tone", "Escalation logic", "Multi-topic handling", "Consistent responses"],
        config: { name: "Customer Support Agent", model: "gemini-2.5-pro", temperature: 0.1, instruction: "You are a polite, empathetic customer support agent. Answer questions concisely and always ask if there is anything else you can help with." },
      },
      {
        id: "returns",
        name: "Returns & Refunds Bot",
        tagline: "Streamline your returns process",
        description: "Guides customers through return and refund processes step-by-step. Reduces support ticket volume and improves customer satisfaction.",
        features: ["Return policy Q&A", "Refund status updates", "Step-by-step guidance", "Low temperature (0.1)"],
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
    gradient: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    templates: [
      {
        id: "engineer",
        name: "Senior Software Engineer",
        tagline: "Code, debug, explain — at senior level",
        description: "Debugs code, explains complex algorithms, and reviews architecture. Acts like a senior pair programmer available 24/7. Ideal for dev teams and solo hackers.",
        features: ["Multilanguage support", "Algorithm walkthroughs", "Code snippets", "Architecture advice"],
        config: { name: "Senior Software Engineer", model: "gemini-2.5-pro", temperature: 0.2, instruction: "You are a senior software engineer. Help the user debug code, write efficient algorithms, and explain complex technical concepts with simple language. Always provide code snippets when applicable." },
      },
      {
        id: "reviewer",
        name: "Code Reviewer",
        tagline: "Catch bugs before they hit production",
        description: "Reviews pull requests for bugs, security vulnerabilities, and style issues. Provides constructive feedback with actionable suggestions for every problem found.",
        features: ["Security scanning", "Performance tips", "Style enforcement", "Detailed feedback"],
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
    gradient: "linear-gradient(135deg, #d97706, #b45309)",
    templates: [
      {
        id: "sales",
        name: "Sales Assistant",
        tagline: "Qualify leads and drive conversions",
        description: "Answers product questions, handles objections, and guides visitors toward a purchase. Conversational, enthusiastic, and product-aware.",
        features: ["Objection handling", "Product Q&A", "Conversion focus", "Warm tone"],
        config: { name: "Sales Assistant", model: "gemini-2.5-pro", temperature: 0.4, instruction: "You are an enthusiastic and knowledgeable sales assistant. Help users understand product benefits, answer objections, and guide them towards making a purchase decision." },
      },
      {
        id: "lead",
        name: "Lead Qualifier",
        tagline: "Filter leads and schedule demos automatically",
        description: "Asks strategic BANT questions (Budget, Authority, Need, Timeline) to qualify prospects and schedule demos — only for the right leads.",
        features: ["BANT qualification", "Demo scheduling", "Prospect scoring", "CRM-ready output"],
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
    gradient: "linear-gradient(135deg, #0891b2, #0e7490)",
    templates: [
      {
        id: "researcher",
        name: "Research Analyst",
        tagline: "Synthesize information at scale",
        description: "Summarizes complex topics, surfaces key insights from long documents, and presents findings in structured, readable formats with bullet points and sections.",
        features: ["Document summarization", "Insight extraction", "Structured output", "Citation awareness"],
        config: { name: "Research Analyst", model: "gemini-2.5-pro", temperature: 0.3, instruction: "You are a thorough research analyst. Summarize complex topics, surface key insights from documents, and present information in a structured, easy-to-read format with bullet points and headings." },
      },
      {
        id: "data-insights",
        name: "Data Insights Bot",
        tagline: "Turn data into executive summaries",
        description: "Interprets data patterns, identifies trends, and generates clear executive-ready summaries with actionable recommendations.",
        features: ["Trend detection", "Executive summaries", "Visualizable output", "Data storytelling"],
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
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
    templates: [
      {
        id: "tutor",
        name: "Personal Tutor",
        tagline: "Adaptive 1-on-1 teaching, any subject",
        description: "Breaks down complex subjects step-by-step, uses relatable examples, asks comprehension checks, and adapts explanations to the learner's level.",
        features: ["Adaptive difficulty", "Comprehension checks", "Relatable examples", "Patient tone"],
        config: { name: "Personal Tutor", model: "gemini-2.5-pro", temperature: 0.5, instruction: "You are a patient and encouraging personal tutor. Break down topics step-by-step, use relatable examples, ask comprehension questions, and adapt your explanations based on the user's level of understanding." },
      },
      {
        id: "quiz",
        name: "Quiz Master",
        tagline: "Adaptive quizzes with instant feedback",
        description: "Creates adaptive quizzes on any topic, provides hints when needed, explains correct answers, and tracks progress throughout the session.",
        features: ["Adaptive questions", "Instant feedback", "Hint system", "Progress tracking"],
        config: { name: "Quiz Master", model: "gemini-2.5-pro", temperature: 0.6, instruction: "You are an engaging quiz master. Create adaptive questions based on the topic, provide hints when needed, explain correct answers, and track the student's progress throughout the session." },
      },
    ],
  },
];

const ALL_TEMPLATES = TEMPLATE_CATEGORIES.flatMap((cat) =>
  cat.templates.map((t) => ({ ...t, category: cat }))
);

export default function TemplateBrowser({ onSelectTemplate, onBack }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = (activeCategory === "all"
    ? ALL_TEMPLATES
    : TEMPLATE_CATEGORIES.find((c) => c.id === activeCategory)?.templates.map((t) => ({ ...t, category: TEMPLATE_CATEGORIES.find((c2) => c2.id === activeCategory) })) || []
  ).filter((t) =>
    search.trim() === "" ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.category.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "16px 40px", display: "flex", alignItems: "center", gap: "16px", position: "sticky", top: 0, zIndex: 10 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#374151" }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#e5e7eb"; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#111827" }}>
            Template Library
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
            {ALL_TEMPLATES.length} pre-built agents across {TEMPLATE_CATEGORIES.length} categories — pick one and customise via the interactive tutorial
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={14} color="#9ca3af" style={{ position: "absolute", left: "10px" }} />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 12px 8px 30px", fontSize: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none", width: "220px", backgroundColor: "#f8fafc", color: "#374151" }}
            onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.backgroundColor = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.backgroundColor = "#f8fafc"; }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>

        {/* ── Category Sidebar ────────────────────────────────────── */}
        <aside style={{ width: "220px", backgroundColor: "#ffffff", borderRight: "1px solid #e5e7eb", padding: "20px 14px", flexShrink: 0, position: "sticky", top: "65px", alignSelf: "flex-start", height: "calc(100vh - 65px)", overflowY: "auto" }}>
          <div style={{ fontSize: "10px", fontWeight: "800", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Categories</div>

          {/* All */}
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", marginBottom: "4px",
              backgroundColor: activeCategory === "all" ? "#7c3aed" : "transparent",
              color: activeCategory === "all" ? "#ffffff" : "#374151",
              transition: "all 150ms",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
            onMouseOver={(e) => { if (activeCategory !== "all") e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
            onMouseOut={(e) => { if (activeCategory !== "all") e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <span> All Templates</span>
            <span style={{ fontSize: "11px", opacity: 0.75 }}>{ALL_TEMPLATES.length}</span>
          </button>

          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", marginBottom: "4px",
                backgroundColor: activeCategory === cat.id ? cat.color : "transparent",
                color: activeCategory === cat.id ? "#ffffff" : "#374151",
                transition: "all 150ms",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseOver={(e) => { if (activeCategory !== cat.id) e.currentTarget.style.backgroundColor = cat.bgColor; }}
              onMouseOut={(e) => { if (activeCategory !== cat.id) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <span style={{ display: "flex", alignItems: "center" }}><cat.icon size={14} style={{ marginRight: "6px" }} /> {cat.label}</span>
              <span style={{ fontSize: "11px", opacity: 0.75 }}>{cat.templates.length}</span>
            </button>
          ))}

          {/* Info box */}
          <div style={{ marginTop: "20px", padding: "12px", backgroundColor: "#f3f0ff", borderRadius: "10px", border: "1px solid #ddd6fe" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", marginBottom: "6px" }}> How templates work</div>
            <div style={{ fontSize: "10px", color: "#6b7280", lineHeight: "15px" }}>
              Selecting a template pre-fills all fields in the interactive 5-step tutorial. You can customise everything before deploying.
            </div>
          </div>
        </aside>

        {/* ── Template Grid ────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: "28px 40px" }}>
          {/* Section label */}
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              Showing <strong style={{ color: "#111827" }}>{filtered.length}</strong> template{filtered.length !== 1 ? "s" : ""}
              {search && <> matching "<strong style={{ color: "#7c3aed" }}>{search}</strong>"</>}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
              <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}><Search size={40} color="#9ca3af" /></div>
              <div style={{ fontSize: "14px", fontWeight: "600" }}>No templates found</div>
              <div style={{ fontSize: "12px", marginTop: "6px" }}>Try a different search term or category</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {filtered.map(({ id, name, tagline, description, features, config, category }) => {
                const isSelected = selected === id;
                return (
                  <div
                    key={id}
                    onClick={() => setSelected(isSelected ? null : id)}
                    style={{
                      backgroundColor: "#ffffff",
                      border: `2px solid ${isSelected ? category.color : "#e5e7eb"}`,
                      borderRadius: "14px",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 200ms",
                      boxShadow: isSelected ? `0 8px 24px ${category.color}30` : "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                    onMouseOver={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = category.color; e.currentTarget.style.boxShadow = `0 4px 16px ${category.color}20`; } }}
                    onMouseOut={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; } }}
                  >
                    {/* Card top banner */}
                    <div style={{ background: category.gradient, padding: "16px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                          <category.icon size={20} color="rgba(255,255,255,0.9)" />
                        </div>
                        <div>
                          <div style={{ fontSize: "9px", fontWeight: "800", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{category.label}</div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>{name}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.8)", backgroundColor: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                        temp: {config.temperature}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "16px 20px" }}>
                      <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#6b7280", lineHeight: "18px" }}>{description}</p>

                      {/* Feature tags */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
                        {features.map((f, i) => (
                          <span
                            key={i}
                            style={{ padding: "3px 9px", fontSize: "10px", fontWeight: "600", backgroundColor: category.bgColor, color: category.color, border: `1px solid ${category.borderColor}`, borderRadius: "20px" }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* Model info */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #f3f4f6" }}>
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>Model: <strong style={{ color: "#374151" }}>{config.model}</strong></span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectTemplate(config); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            padding: "7px 14px", fontSize: "11px", fontWeight: "700",
                            backgroundColor: category.color, color: "#ffffff",
                            border: "none", borderRadius: "8px", cursor: "pointer",
                            transition: "opacity 150ms",
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                          onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
                        >
                          Use Template <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
