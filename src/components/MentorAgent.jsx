"use client";

import { useState, useRef, useEffect } from "react";

// ─── Quick action chips shown at the bottom ───────────────────────────────
const QUICK_ACTIONS = [
  { label: "Create an agent?",     query: "How do I create an agent?" },
  { label: "What templates?",       query: "What templates are available?" },
  { label: "Explain RAG",           query: "What is RAG and how do I use it?" },
  { label: "Which model to use?",   query: "Which AI model should I choose?" },
  { label: "Tutorial steps?",       query: "Walk me through the tutorial steps" },
  { label: "Deploy to website?",    query: "How do I deploy my agent to a website?" },
  { label: " What is a persona?",    query: "What is a persona and role?" },
  { label: " Temperature guide",     query: "Explain temperature settings" },
];

// ─── Knowledge base ───────────────────────────────────────────────────────
const KNOWLEDGE_BASE = [
  {
    triggers: ["hello", "hi", "hey", "help", "what can you do", "what do you do"],
    response: `Hello! I'm your **Lyzr Agent Mentor**!\n\nI guide you through everything on this platform:\n\n- **Creating agents** — Scratch vs Template\n- **Templates** — 10 pre-built agents, 5 categories\n- **RAG setup** — URL + Text knowledge base\n- **Model selection** — Gemini model guide\n- **Tutorial walkthrough** — 5 interactive steps\n- **Deployment** — Embed on any website\n- **Persona & Role** — Shape agent behavior\n\nTry asking me something or tap a quick action below!`,
  },
  {
    triggers: ["create agent", "how to create", "how to start", "get started", "new agent", "begin", "make agent", "build agent"],
    response: `Here are your **two paths** to create an agent:\n\n**From Scratch**\nFull control — configure name, model, temperature, persona, and RAG from a blank slate. Best for developers with specific requirements.\n\n**From Template**\nStart with a pre-built agent. Click **Browse Templates** on the dashboard, pick a category, then tap **Use Template** on any card. All fields are pre-filled — just customise and deploy!\n\n**Recommended for beginners:** Start with a Template. The interactive tutorial walks you through 5 steps and pre-fills the code editor!\n\n**Quick start:** Go to Dashboard → Browse Templates → pick a template → Use Template → follow the 5-step tutorial!`,
  },
  {
    triggers: ["template", "templates", "pre-built", "prebuilt", "categories", "available agents"],
    response: `We have **10 pre-built templates** across 5 categories:\n\n**Customer Service**\n- Customer Support Agent (temp: 0.1)\n- Returns & Refunds Bot (temp: 0.1)\n\n**Development**\n- Senior Software Engineer (temp: 0.2)\n- Code Reviewer (temp: 0.1)\n\n**Sales & Marketing**\n- Sales Assistant (temp: 0.4)\n- Lead Qualifier (temp: 0.3)\n\n**Research**\n- Research Analyst (temp: 0.3)\n- Data Insights Bot (temp: 0.2)\n\n**Education**\n- Personal Tutor (temp: 0.5)\n- Quiz Master (temp: 0.6)\n\nEach template pre-fills all editor fields. Click **Browse Templates** → filter by category → **Use Template**!`,
  },
  {
    triggers: ["rag", "knowledge base", "knowledge", "context", "retrieval", "augmented", "documents", "url input", "text input"],
    response: `**RAG = Retrieval-Augmented Generation**\n\nGives your agent domain-specific knowledge. This is **Step 4** in the tutorial.\n\nYou have two options (or both!):\n\n**URL Mode**\nPaste a website URL (docs, product pages). Agent fetches content from the URL at query time.\n\n**Text Mode**\nPaste text directly — FAQs, product descriptions, policy documents, excerpts. This is embedded inline in the agent's context.\n\n**When to use RAG?**\n- Customer support bot → paste your FAQ text\n- Documentation assistant → link your docs URL\n- Product agent → paste product descriptions\n- Internal knowledge base → link your wiki\n\n**Using both:** If you provide URL + Text, the agent combines both sources for richer answers!\n\nRAG is optional — skip it for general-purpose agents.`,
  },
  {
    triggers: ["model", "gemini", "which model", "model choice", "gpt", "ai model", "language model", "llm"],
    response: `Available models and when to use each:\n\n**gemini-2.5-pro** ← Recommended\nBest quality reasoning. Ideal for complex tasks, code generation, nuanced conversations. All templates default to this.\n\n**gemini-1.5-flash**\nFaster and cheaper. Perfect for simple Q&A, customer support, and high-volume use cases.\n\n**gemini-1.5-pro**\nBalanced quality and speed. A solid middle ground.\n\n**Temperature guide:**\n- 0.0–0.2 → Focused & factual (support, code review)\n- 0.3–0.5 → Balanced (research, sales, tutoring)\n- 0.6–1.0 → Creative (quizzes, brainstorming)\n\nStart with **gemini-2.5-pro + temperature 0.2** if you're unsure. You can always change it later and redeploy!`,
  },
  {
    triggers: ["tutorial", "steps", "how it works", "process", "flow", "5 step", "five step", "walk", "guide", "interactive"],
    response: `The interactive tutorial has **5 steps**:\n\n**① Project Setup**\nInstall the Lyzr Automata SDK (pip install lyzr-automata) and set up your Python environment.\n\n**② Task Overview**\nSee the 3 tasks your agent will perform: Model config, Agent config, and Chat loop.\n\n**③ Editor**\nFill the live code editor — Agent name, Model, Temperature, Role, and Persona. The Mission Checklist turns green as you fill each field. All 3 must be checked to proceed.\n\n**④ RAG Setup**\nOptionally attach a URL and/or paste text to give your agent domain-specific knowledge.\n\n**⑤ Summary & Deploy**\nView your generated Python code. Agent deploys to the cloud and you get a unique Agent ID!\n\nEach step is fully interactive — you edit real code in real time!`,
  },
  {
    triggers: ["deploy", "deployment", "go live", "production", "website", "embed", "launch", "publish", "script tag", "iframe"],
    response: `After deployment you get a unique **Agent ID**. Three ways to embed it:\n\n**HTML Script Tag**\nPaste before the closing body tag on any webpage:\n[code]<script src="cdn.lyzr.ai/widget.js" data-agent-id="YOUR_ID" async></script>[/code]\n\n**React Component**\nInstall @lyzr-ai/widget-react then use:\n[code]<LyzrWidget agentId="YOUR_ID" theme="light" />[/code]\n\n**iFrame**\n[code]<iframe src="app.lyzr.ai/embed/YOUR_ID" width="400" height="600"></iframe>[/code]\n\nAll three options are in the **"Deploy to Website"** modal → click the purple **Deploy to Website** button next to any agent in Recent Deployments!`,
  },
  {
    triggers: ["scratch", "from scratch", "blank", "blank canvas", "custom", "full control", "empty"],
    response: `**From Scratch** gives you complete control:\n\n1. Click **"From Scratch"** on the dashboard\n2. Enter the 5-step interactive tutorial with blank fields\n3. Fill in: Agent Name, Model, Temperature, Role, Persona\n4. Optionally add RAG (Step 4) — URL and/or text\n5. Deploy → get your Agent ID!\n\n**Best for:**\n- Highly specialised agents\n- Unique personas not covered by templates\n- Developers who want precise control over every field\n\n**Tip:** The Mission Checklist in Step 3 turns green as you fill each field. All 3 (Name, Model, Persona) must be checked to unlock Step 4!`,
  },
  {
    triggers: ["temperature", "what is temperature", "creativity", "randomness", "temp", "0.1", "0.2", "0.5"],
    response: `**Temperature** controls how creative/random your agent's responses are:\n\n**0.0 – 0.2** Very focused\nHighly consistent, predictable answers.\n- Great for: customer support, code review, factual Q&A\n- Example: "What are your return policies?" → always same structured answer\n\n**0.3 – 0.5** Balanced\nNatural conversation with reliability.\n- Great for: sales, research analysis, tutoring\n\n**0.6 – 1.0** Creative\nVaried, imaginative, sometimes surprising responses.\n- Great for: quizzes, brainstorming, storytelling\n\n**Rule of thumb:** Start at 0.2 for business-critical agents. Raise it for creative or educational use cases!`,
  },
  {
    triggers: ["sandbox", "test", "chat", "try", "preview", "testing", "try the agent"],
    response: `**Testing your agent** is easy! After deploying:\n\n1. Go to your dashboard → **Recent Deployments** table\n2. Click the **chat icon** next to any deployed agent\n3. The **Agent Sandbox** opens — a live chat window\n4. Type messages and see real-time responses!\n\nThe sandbox uses your actual deployed agent via the Lyzr API, so responses are production-quality.\n\n**Tip:** If responses aren't quite right:\n- Go back and refine the **Persona** in Step 3 (be more specific!)\n- Adjust the **Temperature** (lower for factual, higher for creative)\n- Add **RAG context** in Step 4 if the agent lacks domain knowledge\n- Then redeploy — it takes just a few seconds!`,
  },
  {
    triggers: ["persona", "instruction", "role", "prompt", "system prompt", "behavior", "character"],
    response: `**Persona & Role** define how your agent behaves:\n\n**Role** (short title)\nA brief job title. E.g.: "Senior Software Engineer", "Customer Support Specialist", "Sales Pro"\n\n**Persona** (detailed instruction)\nThis is your agent's full behavior prompt. Be as specific as possible!\n\n**Good persona example:**\n"You are a patient customer support agent for Acme Corp. Greet users warmly, answer questions about our product lineup (widgets and gadgets), and escalate billing issues to support@acme.com. Always end with: 'Is there anything else I can help you with?'"\n\n**Too vague:**\n"You are a helpful assistant"\n\n**Tips for great personas:**\n- Include your company/product name\n- Specify topics to handle AND what to redirect/avoid\n- Set the tone (formal, friendly, concise)\n- Give examples of ideal responses\n- Templates include production-ready personas as starting points!`,
  },
  {
    triggers: ["agent id", "agentid", "id", "what is agent id"],
    response: `Your **Agent ID** is a unique identifier assigned after you deploy an agent.\n\n**Where to find it:**\n- Dashboard → Recent Deployments table (Agent ID column)\n- The "Agent Operational" banner at Step 5 (Summary)\n\n**What it's used for:**\n- Embedding the agent on your website (HTML tag, React, iFrame)\n- Testing in the Agent Sandbox\n- Referencing your agent in the Lyzr API\n\nYou can copy the Agent ID from the dashboard by clicking **"Copy Agent ID"** button!`,
  },
  {
    triggers: ["mission checklist", "checklist", "checklist not", "stuck", "can't proceed", "cannot proceed"],
    response: `The **Mission Checklist** in Step 3 tracks your required fields:\n\n**Set Agent Name** → Type anything in the AGENT_NAME field (line 6)\n**Select Model** → Choose from the dropdown (line 11) — already pre-selected!\n**Define Persona** → Fill in the prompt_persona field (line 20)\n\nAll 3 must turn green before the **"Next: RAG Setup →"** button activates.\n\n**Common issue:** If the persona field is still empty, type your agent's behavior description there. Even a short description like "You are a helpful customer support agent" will check it off!\n\nFor template users, all fields are pre-filled when you select a template — the checklist should already be green!`,
  },
];

const DEFAULT_RESPONSE = `Great question! Let me help. I'm best at answering about:\n\n- **Creating agents** (Scratch vs Template)\n- **Template catalogue** and categories\n- **RAG** knowledge base (URL + Text)\n- **Model selection** and temperature\n- **Tutorial steps** (5-step walkthrough)\n- **Deployment** and website embedding\n- **Persona & Role** configuration\n\nTry rephrasing, or tap one of the quick action chips below!`;

function getMentorResponse(input) {
  const lower = input.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.triggers.some((t) => lower.includes(t))) {
      return entry.response;
    }
  }
  return DEFAULT_RESPONSE;
}

// ─── Simple rich-text renderer (bold + bullets) ───────────────────────────
function MsgText({ text }) {
  const renderBold = (str) => {
    const parts = str.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, j) =>
      j % 2 === 1 ? (
        <strong key={j} style={{ fontWeight: 700, color: "#111827" }}>
          {p}
        </strong>
      ) : (
        p
      )
    );
  };

  return (
    <div style={{ fontSize: "11.5px", lineHeight: "1.75", fontFamily: "Inter, sans-serif", color: "#374151" }}>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: "5px" }} />;

        // [code]...[/code] or `...` inline code
        if ((line.startsWith("[code]") && line.endsWith("[/code]")) ||
            (line.startsWith("`") && line.endsWith("`"))) {
          const content = line.startsWith("[code]")
            ? line.slice(6, -7)
            : line.slice(1, -1);
          return (
            <div
              key={i}
              style={{ fontFamily: "monospace", fontSize: "10px", backgroundColor: "#f3f0ff", color: "#7c3aed", padding: "3px 8px", borderRadius: "5px", margin: "3px 0", wordBreak: "break-all", border: "1px solid #ddd6fe" }}
            >
              {content}
            </div>
          );
        }

        // Bullet list
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ color: "#7c3aed", flexShrink: 0, marginTop: "1px" }}>•</span>
              <span>{renderBold(line.slice(2))}</span>
            </div>
          );
        }

        // Circled step numbers ①②③④⑤
        if (/^[①②③④⑤]/.test(line)) {
          return (
            <div key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>{line[0]}</span>
              <span>{renderBold(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^\d+/)[0];
          return (
            <div key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ color: "#7c3aed", fontWeight: 700, flexShrink: 0, minWidth: "14px" }}>{num}.</span>
              <span>{renderBold(line.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        }

        return <div key={i}>{renderBold(line)}</div>;
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export function MentorAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "mentor",
      content: `Hi! I'm your **Lyzr Agent Mentor** \n\nI'll guide you through creating, configuring, and deploying AI agents on this platform.\n\nWhat would you like to learn about?`,
      id: 0,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed, id: Date.now() }]);
    setInput("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));

    const response = getMentorResponse(trimmed);
    setIsTyping(false);
    setMessages((prev) => [...prev, { role: "mentor", content: response, id: Date.now() + 1 }]);
  };

  const PANEL_WIDTH = 390;

  return (
    <>
      {/* ── Floating pill button (bottom-right) ─────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          position: "fixed",
          right: isOpen ? `${PANEL_WIDTH + 20}px` : "20px",
          bottom: "24px",
          zIndex: 1001,
          borderRadius: "50px",
          background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
          border: "none",
          padding: "11px 20px",
          cursor: "pointer",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 24px rgba(124,58,237,0.45)",
          transition: "right 300ms cubic-bezier(0.4,0,0.2,1), transform 150ms, box-shadow 150ms",
          userSelect: "none",
          fontSize: "13px",
          fontWeight: "700",
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(124,58,237,0.6)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 24px rgba(124,58,237,0.45)";
        }}
        title={isOpen ? "Close Mentor" : "Open Agent Mentor"}
      >
        <span style={{ fontSize: "17px", lineHeight: 1 }}>{isOpen ? "" : ""}</span>
        <span>{isOpen ? "Close" : "Ask Mentor"}</span>
      </button>

      {/* ── Slide-in panel ────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          right: isOpen ? "0" : `-${PANEL_WIDTH + 10}px`,
          top: 0,
          bottom: 0,
          width: `${PANEL_WIDTH}px`,
          backgroundColor: "#ffffff",
          boxShadow: "-6px 0 40px rgba(0,0,0,0.14)",
          transition: "right 300ms cubic-bezier(0.4,0,0.2,1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #e5e7eb",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Agent Mentor</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <span style={{ width: "7px", height: "7px", backgroundColor: "#4ade80", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px #4ade80" }} />
              Online · Lyzr Platform Guide
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              cursor: "pointer",
              padding: "5px 9px",
              borderRadius: "6px",
              fontSize: "13px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; }}
          >
            
          </button>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            backgroundColor: "#fafafa",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "flex-end",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              {/* Avatar */}
              {msg.role === "mentor" && (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: "#f3f0ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    flexShrink: 0,
                    border: "1px solid #ddd6fe",
                  }}
                >
                  
                </div>
              )}

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 13px",
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  backgroundColor: msg.role === "user" ? "#7c3aed" : "#ffffff",
                  color: msg.role === "user" ? "#ffffff" : "#374151",
                  border: msg.role === "user" ? "none" : "1px solid #e5e7eb",
                  boxShadow: msg.role === "mentor" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {msg.role === "user" ? (
                  <span style={{ fontSize: "11.5px" }}>{msg.content}</span>
                ) : (
                  <MsgText text={msg.content} />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "#f3f0ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  flexShrink: 0,
                  border: "1px solid #ddd6fe",
                }}
              >
                
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#ffffff",
                  borderRadius: "14px 14px 14px 4px",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {[0, 0.18, 0.36].map((delay, i) => (
                  <div
                    key={i}
                    className="animate-bounce"
                    style={{
                      width: "7px",
                      height: "7px",
                      backgroundColor: "#7c3aed",
                      borderRadius: "50%",
                      animationDelay: `${delay}s`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick action chips */}
        <div
          style={{
            padding: "10px 14px 6px",
            display: "flex",
            gap: "5px",
            flexWrap: "wrap",
            borderTop: "1px solid #f3f4f6",
            backgroundColor: "#ffffff",
            flexShrink: 0,
          }}
        >
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => sendMessage(action.query)}
              disabled={isTyping}
              style={{
                padding: "4px 10px",
                fontSize: "10px",
                fontWeight: "600",
                backgroundColor: "#f3f0ff",
                color: "#7c3aed",
                border: "1px solid #ddd6fe",
                borderRadius: "20px",
                cursor: isTyping ? "not-allowed" : "pointer",
                transition: "all 150ms",
                opacity: isTyping ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
              onMouseOver={(e) => { if (!isTyping) { e.currentTarget.style.backgroundColor = "#ede9fe"; e.currentTarget.style.borderColor = "#c4b5fd"; } }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#f3f0ff"; e.currentTarget.style.borderColor = "#ddd6fe"; }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div
          style={{
            padding: "10px 14px 14px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "8px",
            backgroundColor: "#ffffff",
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask your mentor anything..."
            disabled={isTyping}
            style={{
              flex: 1,
              padding: "9px 13px",
              fontSize: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              outline: "none",
              backgroundColor: "#f8fafc",
              color: "#374151",
              fontFamily: "Inter, sans-serif",
              transition: "border-color 150ms",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.backgroundColor = "#ffffff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.backgroundColor = "#f8fafc"; }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isTyping || !input.trim()}
            style={{
              width: "38px",
              height: "38px",
              backgroundColor: isTyping || !input.trim() ? "#f3f4f6" : "#7c3aed",
              border: "none",
              borderRadius: "10px",
              cursor: isTyping || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isTyping || !input.trim() ? "#9ca3af" : "#ffffff",
              flexShrink: 0,
              transition: "background 150ms",
              fontSize: "16px",
            }}
            onMouseOver={(e) => { if (!isTyping && input.trim()) e.currentTarget.style.backgroundColor = "#6d28d9"; }}
            onMouseOut={(e) => { if (!isTyping && input.trim()) e.currentTarget.style.backgroundColor = "#7c3aed"; }}
          >
            
          </button>
        </div>
      </div>
    </>
  );
}
