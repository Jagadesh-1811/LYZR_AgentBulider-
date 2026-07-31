import React from 'react';

export function TaskOverview({ mode, onNext }) {
  const isScratch = mode === 'scratch';

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 shadow-sm">
      <div className="font-mono text-xs text-[#374151] mb-4 tracking-wider uppercase">
        <b className="text-[#7c3aed]">Step 2</b> &middot; Task Overview
      </div>
      
      <h1 className="text-3xl font-bold mb-4 text-[#111827]">
        {isScratch ? "Build your Lyzr Automata Agent" : "Configure the Template"}
      </h1>
      <p className="text-[#374151] mb-8 text-sm leading-relaxed max-w-2xl">
        {isScratch 
          ? "You will be building a complete pipeline using the Lyzr Automata SDK. First you will configure the LLM Model, then you will construct an Agent with a specific persona, and finally, you will create a Task for that Agent to execute."
          : "The template is almost ready to go! It contains pre-written pipelines and logic. You just need to configure a few critical variables like your target persona."
        }
      </p>

      <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6 mb-8">
        <h3 className="font-bold mb-4 text-[#111827]">What you need to do:</h3>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 border border-[#e5e7eb] bg-white rounded-lg relative overflow-hidden shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[rgba(124,58,237,0.1)] text-[#7c3aed] flex items-center justify-center font-mono text-xs shrink-0 z-10 border border-[rgba(124,58,237,0.2)]">
              1
            </div>
            <div className="z-10">
              <b className="block text-sm mb-1 text-[#111827]">Configure the Model</b>
              <span className="text-xs text-[#374151]">Set up the LLM (like Gemini 1.5). No API keys needed!</span>
            </div>
          </div>
          <div className="flex gap-4 p-4 border border-[#e5e7eb] bg-white rounded-lg relative overflow-hidden shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[rgba(124,58,237,0.1)] text-[#7c3aed] flex items-center justify-center font-mono text-xs shrink-0 z-10 border border-[rgba(124,58,237,0.2)]">
              2
            </div>
            <div className="z-10">
              <b className="block text-sm mb-1 text-[#111827]">Configure the Agent</b>
              <span className="text-xs text-[#374151]">Give the agent a role and prompt persona.</span>
            </div>
          </div>
          {isScratch && (
            <div className="flex gap-4 p-4 border border-[#e5e7eb] bg-white rounded-lg relative overflow-hidden shadow-sm">
              <div className="w-8 h-8 rounded-full bg-[rgba(124,58,237,0.1)] text-[#7c3aed] flex items-center justify-center font-mono text-xs shrink-0 z-10 border border-[rgba(124,58,237,0.2)]">
                3
              </div>
              <div className="z-10">
                <b className="block text-sm mb-1 text-[#111827]">Configure the Task</b>
                <span className="text-xs text-[#374151]">Define exactly what the agent should accomplish and string it together.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button 
          onClick={onNext}
          className="bg-[#8b5cf6] hover:bg-[#a78bfa] text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-[0_4px_14px_rgba(139,92,246,0.39)]"
        >
          Begin &rarr;
        </button>
      </div>
    </div>
  );
}
