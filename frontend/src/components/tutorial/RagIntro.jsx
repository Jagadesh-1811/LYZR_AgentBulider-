import React, { useState } from 'react';

const COMPARISONS = [
  {
    query: "What is your refund policy?",
    withoutRag: "I'm sorry, I don't have specific information about refund policies. Please contact support.",
    withRag: "Our policy allows returns within 30 days of purchase. Items must be unused and in original packaging. Refunds are processed within 5–7 business days. You can initiate a return from your account dashboard.",
    ragSource: "from your FAQ doc",
  },
  {
    query: "Does your product support Python 3.12?",
    withoutRag: "I'm not sure about specific version compatibility. Please check the documentation for details.",
    withRag: "Yes! Python 3.12 support was added in v2.4.0 (March 2024). Ensure you're using lyzr-automata>=2.4.0. You may need to update your type hints — see the migration guide at docs.lyzr.ai/migration.",
    ragSource: "from your docs URL",
  },
  {
    query: "What are your pricing plans?",
    withoutRag: "I don't have access to current pricing information. Please visit our website.",
    withRag: "We offer three plans: Starter ($29/mo, 1 agent, 10k messages), Growth ($99/mo, 5 agents, 100k messages), and Enterprise (custom). All plans include RAG support and a 14-day free trial.",
    ragSource: "from your product page",
  },
];

const WHY_DIFFERENT = [
  {
    icon: "",
    title: "Knowledge that updates",
    body: "Regular AI is frozen at training time. RAG pulls live content from your URL or text, so your agent always knows the latest — no retraining required.",
    color: "#7c3aed",
    bg: "#f3f0ff",
  },
  {
    icon: "",
    title: "Domain-specific accuracy",
    body: "General models hallucinate on niche topics. With RAG, answers come from your actual documents, so every response is grounded in your real data.",
    color: "#059669",
    bg: "#f0fdf4",
  },
  {
    icon: "",
    title: "No fine-tuning needed",
    body: "Fine-tuning costs thousands of dollars and days of compute. RAG gives you domain expertise at query time — just paste a URL or drop in your text.",
    color: "#d97706",
    bg: "#fffbeb",
  },
  {
    icon: "",
    title: "Two sources, one agent",
    body: "Combine a URL (live docs/website) AND pasted text (internal knowledge) in the same agent. It retrieves from both and synthesises a single coherent answer.",
    color: "#0891b2",
    bg: "#ecfeff",
  },
];

export function RagIntro({ onNext }) {
  const [activeComparison, setActiveComparison] = useState(0);
  const [showRagAnswer, setShowRagAnswer] = useState(false);

  const comp = COMPARISONS[activeComparison];

  const handleCycleComparison = (idx) => {
    setActiveComparison(idx);
    setShowRagAnswer(false);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">

      {/* ── Title block ─────────────────────────────────────────────── */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f3f0ff] text-[#7c3aed] border border-[#ddd6fe] mb-4">
          Step 4 · RAG Introduction
        </div>
        <h1 className="text-3xl font-extrabold text-[#111827] mb-3">
          Why does your agent need a Knowledge Base?
        </h1>
        <p className="text-[#6b7280] text-sm max-w-xl mx-auto leading-relaxed">
          Before we configure it, let's understand what <strong>RAG</strong> (Retrieval-Augmented Generation)
          is — and why it makes your agent dramatically smarter.
        </p>
      </div>

      {/* ── Live comparison demo ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e5e7eb] bg-[#f8fafc]">
          <h2 className="text-base font-bold text-[#111827] mb-3">See the difference — try a real example</h2>
          {/* Query selector */}
          <div className="flex gap-2 flex-wrap">
            {COMPARISONS.map((c, i) => (
              <button
                key={i}
                onClick={() => handleCycleComparison(i)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: activeComparison === i ? '#7c3aed' : '#ffffff',
                  color: activeComparison === i ? '#ffffff' : '#374151',
                  borderColor: activeComparison === i ? '#7c3aed' : '#e5e7eb',
                }}
              >
                "{c.query.slice(0, 28)}…"
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#e5e7eb]">

          {/* Without RAG */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center text-sm"></div>
              <div>
                <div className="text-xs font-bold text-[#dc2626] uppercase tracking-wider">Without RAG</div>
                <div className="text-xs text-[#9ca3af]">General knowledge only</div>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3 text-xs text-[#374151] leading-relaxed border border-[#e5e7eb] mb-3">
              <span className="text-[#9ca3af] font-medium block mb-1">You: </span>
              {comp.query}
            </div>
            <div className="bg-[#fef2f2] rounded-lg p-3 text-xs text-[#374151] leading-relaxed border border-[#fecaca]">
              <span className="text-[#dc2626] font-medium block mb-1"> Agent: </span>
              {comp.withoutRag}
            </div>
          </div>

          {/* With RAG */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-sm"></div>
              <div>
                <div className="text-xs font-bold text-[#059669] uppercase tracking-wider">With RAG</div>
                <div className="text-xs text-[#9ca3af]">Retrieves {comp.ragSource}</div>
              </div>
            </div>
            <div className="bg-[#f8fafc] rounded-lg p-3 text-xs text-[#374151] leading-relaxed border border-[#e5e7eb] mb-3">
              <span className="text-[#9ca3af] font-medium block mb-1">You: </span>
              {comp.query}
            </div>

            {!showRagAnswer ? (
              <div className="bg-[#f3f0ff] rounded-lg p-3 text-xs leading-relaxed border border-[#ddd6fe] flex flex-col items-center justify-center gap-2 min-h-[80px]">
                <div className="text-[#9ca3af] text-center">
                  Click to reveal the RAG-powered answer 
                </div>
                <button
                  onClick={() => setShowRagAnswer(true)}
                  className="px-4 py-1.5 bg-[#7c3aed] text-white text-xs font-bold rounded-lg"
                >
                  Show RAG Answer
                </button>
              </div>
            ) : (
              <div className="bg-[#f0fdf4] rounded-lg p-3 text-xs text-[#374151] leading-relaxed border border-[#bbf7d0]">
                <span className="text-[#059669] font-medium block mb-1"> Agent (RAG): </span>
                {comp.withRag}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Why it's different from regular AI ──────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-[#111827] mb-4">
          4 reasons RAG is different from regular AI
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_DIFFERENT.map((item, i) => (
            <div
              key={i}
              className="flex gap-4 p-5 rounded-xl border"
              style={{ backgroundColor: item.bg, borderColor: item.color + '33' }}
            >
              <div>
                <div className="text-sm font-bold mb-1" style={{ color: item.color }}>{item.title}</div>
                <div className="text-xs text-[#6b7280] leading-relaxed">{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How RAG works (visual) ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
        <h2 className="text-base font-bold text-[#111827] mb-5">How RAG works — in 3 steps</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-0">

          {[
            { step: "1", icon: "", title: "User sends a query", sub: "\"What's your refund policy?\"", color: "#7c3aed", bg: "#f3f0ff" },
            { step: "→", icon: null, title: null, sub: null, isArrow: true },
            { step: "2", icon: "", title: "Retrieval", sub: "Agent fetches relevant chunks from your URL or text", color: "#d97706", bg: "#fffbeb" },
            { step: "→", icon: null, title: null, sub: null, isArrow: true },
            { step: "3", icon: "", title: "Augmented response", sub: "LLM uses retrieved context to give a precise, grounded answer", color: "#059669", bg: "#f0fdf4" },
          ].map((item, i) => {
            if (item.isArrow) {
              return (
                <div key={i} className="hidden sm:flex items-center justify-center px-2 text-[#d1d5db] text-xl font-bold shrink-0">→</div>
              );
            }
            return (
              <div
                key={i}
                className="flex-1 rounded-xl p-4 border text-center"
                style={{ backgroundColor: item.bg, borderColor: item.color + '40', minWidth: 0 }}
              >
                <div className="text-xs font-bold mb-1" style={{ color: item.color }}>Step {item.step}</div>
                <div className="text-xs font-bold text-[#111827] mb-1">{item.title}</div>
                <div className="text-xs text-[#6b7280] leading-relaxed">{item.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sources supported ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#f3f0ff] border border-[#ddd6fe] rounded-xl p-5 flex gap-4 items-start">
          <div>
            <div className="text-sm font-bold text-[#7c3aed] mb-1">URL Source</div>
            <div className="text-xs text-[#6b7280] leading-relaxed">Paste any publicly accessible URL — docs site, product pages, wiki, or blog. The agent fetches and indexes content at query time.</div>
            <div className="mt-2 text-xs font-mono bg-white rounded px-2 py-1 text-[#7c3aed] border border-[#ddd6fe] inline-block">https://docs.yoursite.com/</div>
          </div>
        </div>
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 flex gap-4 items-start">
          <div>
            <div className="text-sm font-bold text-[#059669] mb-1">Text Source</div>
            <div className="text-xs text-[#6b7280] leading-relaxed">Copy-paste FAQs, internal documents, product descriptions, or any text directly. Embedded inline in the agent's context window.</div>
            <div className="mt-2 text-xs font-mono bg-white rounded px-2 py-1 text-[#059669] border border-[#bbf7d0] inline-block">Paste any text content…</div>
          </div>
        </div>
      </div>

      {/* ── How to configure RAG (visual) ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
        <h2 className="text-base font-bold text-[#111827] mb-5">How to configure RAG — in 3 steps</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-0 sm:gap-0">

          {[
            { step: "1", icon: "", title: "Enable RAG", sub: "Turn on the RAG feature in the next screen", color: "#7c3aed", bg: "#f3f0ff" },
            { step: "→", icon: null, title: null, sub: null, isArrow: true },
            { step: "2", icon: "", title: "Add Sources", sub: "Paste a URL, enter text, or upload a file", color: "#d97706", bg: "#fffbeb" },
            { step: "→", icon: null, title: null, sub: null, isArrow: true },
            { step: "3", icon: "", title: "Tweak Settings", sub: "Select vector store & embedding model", color: "#059669", bg: "#f0fdf4" },
          ].map((item, i) => {
            if (item.isArrow) {
              return (
                <div key={i} className="hidden sm:flex items-center justify-center px-2 text-[#d1d5db] text-xl font-bold shrink-0">→</div>
              );
            }
            return (
              <div
                key={i}
                className="flex-1 rounded-xl p-4 border text-center"
                style={{ backgroundColor: item.bg, borderColor: item.color + '40', minWidth: 0 }}
              >
                <div className="text-xs font-bold mb-1" style={{ color: item.color }}>Step {item.step}</div>
                <div className="text-xs font-bold text-[#111827] mb-1">{item.title}</div>
                <div className="text-xs text-[#6b7280] leading-relaxed">{item.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-5">
        <div>
          <div className="text-sm font-bold text-[#111827]">Ready to configure RAG for your agent?</div>
          <div className="text-xs text-[#6b7280] mt-0.5">In the next step, connect a URL, paste text, or skip if your agent doesn't need domain knowledge.</div>
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-white transition-colors"
          style={{ backgroundColor: '#7c3aed', whiteSpace: "nowrap" }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#6d28d9'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#7c3aed'}
        >
          Configure RAG →
        </button>
      </div>

    </div>
  );
}
