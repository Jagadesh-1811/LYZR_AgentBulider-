"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Bot } from "lucide-react";

// ─── Quick action chips shown at the bottom ───────────────────────────────
const QUICK_ACTIONS = [
  { label: "Create an agent?",     query: "How do I create an agent?" },
  { label: "What templates?",       query: "What templates are available?" },
  { label: "Explain RAG",           query: "What is RAG and how do I use it?" },
  { label: "Which model to use?",   query: "Which AI model should I choose?" },
  { label: "Tutorial steps?",       query: "Walk me through the tutorial steps" },
  { label: "Deploy to website?",    query: "How do I deploy my agent to a website?" },
  { label: "What is a persona?",    query: "What is a persona and role?" },
  { label: "Temperature guide",     query: "Explain temperature settings" },
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
        <strong key={j} className="font-bold text-gray-900">
          {p}
        </strong>
      ) : (
        p
      )
    );
  };

  return (
    <div className="text-[12.5px] leading-relaxed font-sans text-gray-700 space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;

        // [code]...[/code] or `...` inline code
        if ((line.startsWith("[code]") && line.endsWith("[/code]")) ||
            (line.startsWith("\`") && line.endsWith("\`"))) {
          const content = line.startsWith("[code]")
            ? line.slice(6, -7)
            : line.slice(1, -1);
          return (
            <div
              key={i}
              className="font-mono text-[11px] bg-violet-50 text-violet-700 px-2.5 py-1.5 rounded-md border border-violet-100 break-all my-2 shadow-sm"
            >
              {content}
            </div>
          );
        }

        // Bullet list
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2 items-start mt-1">
              <span className="text-violet-600 mt-0.5 shrink-0 font-bold">•</span>
              <span>{renderBold(line.slice(2))}</span>
            </div>
          );
        }

        // Circled step numbers ①②③④⑤
        if (/^[①②③④⑤]/.test(line)) {
          return (
            <div key={i} className="flex gap-2 items-start mt-1.5">
              <span className="text-violet-600 font-bold shrink-0 text-sm leading-tight mt-0.5">{line[0]}</span>
              <span>{renderBold(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^\d+/)[0];
          return (
            <div key={i} className="flex gap-2 items-start mt-1">
              <span className="text-violet-600 font-bold shrink-0 min-w-[14px] leading-relaxed">{num}.</span>
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

  const PANEL_WIDTH = 420;
  return (
    <>
      {/* ── Floating pill button (bottom-right) ─────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{ right: isOpen ? `${PANEL_WIDTH + 24}px` : "24px" }}
        className="fixed bottom-6 z-[1001] bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full px-5 py-3.5 flex items-center justify-center shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.5)] transition-all duration-300 ease-out hover:-translate-y-1 group"
        title={isOpen ? "Close Mentor" : "Ask Mentor"}
      >
        <span className="text-[13px] font-bold tracking-wide">{isOpen ? "Close" : "Ask Mentor"}</span>
      </button>

      {/* ── Slide-in panel ────────────────────────────────────────── */}
      <div
        style={{
          right: isOpen ? "0" : `-${PANEL_WIDTH + 20}px`,
          width: `${PANEL_WIDTH}px`,
        }}
        className="fixed top-0 bottom-0 z-[1000] bg-white/95 backdrop-blur-xl border-l border-gray-200/50 shadow-2xl transition-all duration-300 ease-out flex flex-col font-sans"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 flex items-center gap-4 shrink-0 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none" />
          
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-md relative z-10">
            <Bot size={22} className="text-white" />
          </div>
          
          <div className="flex-1 relative z-10">
            <div className="text-[15px] font-bold text-white tracking-wide drop-shadow-sm">Agent Mentor</div>
            <div className="text-xs text-indigo-100 flex items-center gap-1.5 mt-0.5 opacity-90 font-medium">
              Online · Lyzr Platform Guide
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors relative z-10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scroll-smooth bg-gray-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
            >
              {/* Avatar */}
              {msg.role === "mentor" && (
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 border border-violet-200 shadow-sm">
                  <Bot size={14} className="text-violet-600" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={`px-4 py-3 shadow-sm ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-200/60 rounded-2xl rounded-bl-sm shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
                }`}
              >
                {msg.role === "user" ? (
                  <span className="text-[13px] font-medium leading-relaxed">{msg.content}</span>
                ) : (
                  <MsgText text={msg.content} />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2.5 max-w-[85%] self-start animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 border border-violet-200 shadow-sm">
                <Bot size={14} className="text-violet-600" />
              </div>
              <div className="px-4 py-3.5 bg-white border border-gray-200/60 rounded-2xl rounded-bl-sm shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex items-center gap-1.5">
                {[0, 150, 300].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce opacity-80"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick action chips */}
        <div className="px-5 py-3.5 flex gap-2 overflow-x-auto whitespace-nowrap bg-white border-t border-gray-100 shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => sendMessage(action.query)}
              disabled={isTyping}
              className={`px-3.5 py-1.5 text-[11.5px] font-bold bg-violet-50 text-violet-700 border border-violet-100 rounded-full transition-all duration-200 ${
                isTyping
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-violet-100 hover:-translate-y-0.5 hover:shadow-sm hover:border-violet-200"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0 relative z-10">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1.5 rounded-xl focus-within:ring-4 focus-within:ring-violet-500/10 focus-within:border-violet-300 transition-all duration-200 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask anything..."
              disabled={isTyping}
              className="flex-1 bg-transparent px-3 py-2 text-[13px] font-medium text-gray-800 placeholder-gray-400 outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isTyping || !input.trim()}
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                isTyping || !input.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              <Send size={15} className={isTyping || !input.trim() ? "" : "translate-x-[-1px] translate-y-[1px]"} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
