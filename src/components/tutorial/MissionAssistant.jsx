import React, { useState } from 'react';

const TradeOffsContent = () => (
  <div className="space-y-4 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 text-[#111827] font-semibold mb-1">
      <h4>Model Selection</h4>
    </div>
    <ul className="space-y-3">
      <li className="flex gap-3 items-start">
        <div className="text-[#4b5563]">
          <span className="text-[#111827] font-semibold block text-xs mb-0.5">Gemini 1.5 Pro & GPT-4o</span>
          Highest reasoning and accuracy. Best for complex logic, but higher latency and cost per token.
          <div className="mt-1.5 flex gap-2">
            <a href="https://platform.openai.com/docs/models" target="_blank" rel="noreferrer" className="text-[#7c3aed] hover:text-[#6d28d9] hover:underline text-[11px] transition-colors font-medium">OpenAI Models →</a>
            <span className="text-[#d1d5db]">|</span>
            <a href="https://ai.google.dev/gemini-api/docs/models/gemini" target="_blank" rel="noreferrer" className="text-[#7c3aed] hover:text-[#6d28d9] hover:underline text-[11px] transition-colors font-medium">Gemini Models →</a>
          </div>
        </div>
      </li>
      <li className="flex gap-3 items-start">
        <div className="text-[#4b5563]">
          <span className="text-[#111827] font-semibold block text-xs mb-0.5">Gemini Flash</span>
          Lightning fast and highly cost-effective. Ideal for simple routing, formatting, or rapid chat.
        </div>
      </li>
    </ul>
  </div>
);

const CommonMistakesContent = () => (
  <div className="space-y-4 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 text-[#111827] font-semibold mb-1">
      <h4>Avoid these pitfalls</h4>
    </div>
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3 text-[#4b5563]">
      <div>
        <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-1">Vague Personas</span>
        Instead of <i>"Be a helpful assistant"</i>, explicitly state the role: <i>"You are an expert financial auditor. Only provide answers backed by numerical data."</i>
      </div>
      <div className="h-px bg-red-200 w-full" />
      <div>
        <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-1">High Temperature</span>
        For factual tasks (coding, analytics), keep temperature low <b>(0.1 - 0.2)</b> to prevent hallucinations. High temperature <b>(0.7+)</b> is for creative writing.
        <a href="https://platform.openai.com/docs/api-reference/chat/create#chat-create-temperature" target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-700 hover:underline font-medium text-[11px] block mt-1 transition-colors">Learn about temperature →</a>
      </div>
    </div>
  </div>
);

const DocsContent = () => (
  <div className="space-y-3 animate-in fade-in duration-300">
    <div className="flex items-center gap-2 text-[#111827] font-semibold mb-2">
      <h4>Helpful Resources</h4>
    </div>
    <a 
      href="https://docs.lyzr.ai/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
    >
      <div>
        <span className="text-[#7c3aed] group-hover:text-[#6d28d9] text-xs font-semibold block transition-colors">Lyzr Automata SDK</span>
        <span className="text-[11px] text-[#6b7280]">Official Documentation</span>
      </div>
    </a>
    <a 
      href="https://platform.openai.com/docs/guides/prompt-engineering" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
    >
      <div>
        <span className="text-[#7c3aed] group-hover:text-[#6d28d9] text-xs font-semibold block transition-colors">Prompt Engineering</span>
        <span className="text-[11px] text-[#6b7280]">Tips for writing better instructions</span>
      </div>
    </a>
    <a 
      href="https://github.com/LyzrCore/lyzr-automata" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
    >
      <div>
        <span className="text-[#7c3aed] group-hover:text-[#6d28d9] text-xs font-semibold block transition-colors">Lyzr GitHub Repo</span>
        <span className="text-[11px] text-[#6b7280]">Source code & examples</span>
      </div>
    </a>
  </div>
);

export function MissionAssistant() {
  const [activeTab, setActiveTab] = useState('Trade-offs');

  const renderContent = () => {
    switch (activeTab) {
      case 'Trade-offs': return <TradeOffsContent />;
      case 'Common mistakes': return <CommonMistakesContent />;
      case 'Docs': return <DocsContent />;
      default: return null;
    }
  };

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm font-sans">
      <h3 className="text-[11px] font-bold text-[#6b7280] tracking-wider uppercase mb-4">
        Mission Assistant
      </h3>
      
      <div className="flex flex-col gap-1 mb-6">
        {['Trade-offs', 'Common mistakes', 'Docs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/30 font-semibold' 
                : 'text-[#6b7280] hover:text-[#374151] hover:bg-gray-50 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="text-[#4b5563] text-[13px] leading-relaxed border-t border-[#e5e7eb] pt-5 min-h-[180px]">
        {renderContent()}
      </div>
    </div>
  );
}
