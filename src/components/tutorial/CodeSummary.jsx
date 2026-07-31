import React from 'react';

export function CodeSummary({ code, onFinish }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 shadow-sm text-center">
      <div className="w-16 h-16 mx-auto bg-[#059669]/10 border border-[#059669]/30 text-[#059669] rounded-full flex items-center justify-center text-3xl mb-6 shadow-sm">
        
      </div>
      <h1 className="text-3xl font-bold mb-2 text-[#111827]">Agent Ready!</h1>
      <p className="text-[#374151] mb-8 text-sm">
        You have successfully configured a Lyzr Automata pipeline. Run this Python code locally to test it!
      </p>

      <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6 text-left font-mono text-xs leading-[1.8] text-[#374151] mb-8 overflow-x-auto mx-auto max-w-2xl shadow-sm whitespace-pre">
        {code}
      </div>

      <div className="flex justify-center mt-4">
        <button 
          onClick={onFinish}
          className="bg-[#7c3aed] hover:bg-[#a78bfa] text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-sm"
        >
          Continue &rarr;
        </button>
      </div>
    </div>
  );
}
