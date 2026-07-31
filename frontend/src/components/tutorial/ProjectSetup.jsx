import React from 'react';

export function ProjectSetup({ mode, onNext }) {
  const isScratch = mode === 'scratch';

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 shadow-sm">
      <div className="font-mono text-xs text-[#374151] mb-4 tracking-wider uppercase">
        <b className="text-[#7c3aed]">Step 1</b> &middot; Project Setup
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-[#111827]">Get your project on disk</h1>
      <p className="text-[#374151] mb-8 text-sm">
        Everything runs locally on your machine. You will need a Python environment to run the Lyzr Automata SDK.
      </p>

      <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6 font-mono text-sm leading-8 text-[#111827] mb-6 shadow-sm">
        {isScratch ? (
          <>
            <div><span className="text-[#7c3aed]">$</span> mkdir lyzr-agent && cd lyzr-agent</div>
            <div><span className="text-[#7c3aed]">$</span> python -m venv .venv && source .venv/bin/activate</div>
            <div><span className="text-[#7c3aed]">$</span> pip install lyzr-automata google-generativeai</div>
            <div><span className="text-[#7c3aed]">$</span> touch agent.py</div>
          </>
        ) : (
          <>
            <div><span className="text-[#7c3aed]">$</span> git clone https://github.com/lyzr/automata-template</div>
            <div><span className="text-[#7c3aed]">$</span> cd automata-template</div>
            <div><span className="text-[#7c3aed]">$</span> python -m venv .venv && source .venv/bin/activate</div>
            <div><span className="text-[#7c3aed]">$</span> pip install -r requirements.txt</div>
          </>
        )}
      </div>
      
      <p className="text-xs text-[#374151] italic mb-6">
        Once you&apos;ve run these commands in your local terminal, click Next to continue.
      </p>

      <div className="flex justify-end mt-4">
        <button 
          onClick={onNext}
          className="bg-[#8b5cf6] hover:bg-[#a78bfa] text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-[0_4px_14px_rgba(139,92,246,0.39)]"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
