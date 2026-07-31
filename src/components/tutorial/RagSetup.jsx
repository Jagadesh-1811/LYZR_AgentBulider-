import React, { useState } from 'react';

export function RagSetup({ codeValues, onComplete }) {
  const [enableRag, setEnableRag] = useState(false);
  const [ragUrl, setRagUrl] = useState('https://docs.lyzr.ai/');
  const [ragText, setRagText] = useState('');
  const [ragFile, setRagFile] = useState(null);
  
  // Advanced RAG Settings
  const [vectorStore, setVectorStore] = useState('pinecone');
  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-3-small');

  const agentVar = ((codeValues?.agentName || 'expert_agent')).toLowerCase().replace(/\s+/g, '_');

  const hasUrl  = enableRag && ragUrl.trim().length > 0;
  const hasText = enableRag && ragText.trim().length > 0;
  const hasFile = enableRag && ragFile !== null;

  const generateFinalCode = () => {
    const instructionsLine = (() => {
      if (hasUrl && hasText)
        return `f"Context URL: {RAG_URL}. Knowledge: {RAG_TEXT[:300]}... Query: {user_input}"`;
      if (hasFile)
        return `f"Use context from {RAG_FILE} to answer: {user_input}"`;
      if (hasUrl)
        return `f"Use context from {RAG_URL} to answer: {user_input}"`;
      if (hasText)
        return `f"Use this knowledge: {RAG_TEXT[:300]}... Answer: {user_input}"`;
      return `f"Answer the user's query: {user_input}"`;
    })();

    return `import os
from lyzr_automata import Agent, Task, LinearSyncPipeline
from lyzr_automata.ai_models.gemini import GeminiModel

# Agent Setup: ${codeValues?.agentName || 'My Agent'}
AGENT_NAME = "${codeValues?.agentName || 'My Agent'}"
${hasUrl  ? `RAG_URL = "${ragUrl}"\n` : ''}${hasText ? `RAG_TEXT = """\n${ragText.slice(0, 300)}${ragText.length > 300 ? '...' : ''}\n"""\n` : ''}${hasFile ? `RAG_FILE = "${ragFile.name}"\n` : ''}
# Task 1: Configure Model
gemini_model = GeminiModel(
    parameters={
        "model": "${codeValues?.modelName || 'gemini-1.5-pro'}",
        "temperature": ${codeValues?.temperature || 0.2},
        "max_tokens": ${codeValues?.maxTokens || 1500},
    },
)

# Task 2: Configure Agent
${agentVar} = Agent(
    role="${codeValues?.role || 'Expert Consultant'}",
    prompt_persona="${codeValues?.persona || ''}"
)

# Task 3: Chat Loop${enableRag ? ' with RAG Context' : ''}
def start_chat():
    print(f"{AGENT_NAME} ready! (Type 'exit' to quit)")
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'exit':
            break

        task = Task(
            name="Chat Task",
            agent=${agentVar},
            model=gemini_model,
            instructions=${instructionsLine},
        )

        pipeline = LinearSyncPipeline(
            name=f"{AGENT_NAME} Pipeline",
            tasks=[task],
        )
        result = pipeline.run()
        print(f"{AGENT_NAME}: {result[0].task_output}")

if __name__ == "__main__":
    start_chat()
`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

      {/* ── Code Editor Panel ─────────────────────────────────────── */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#e5e7eb] bg-[#f8fafc]">
          <div className="font-mono text-xs text-[#374151] tracking-wider uppercase mb-1">
            <b className="text-[#7c3aed]">Step 4</b> &middot; RAG Setup
          </div>
          <h1 className="text-xl font-bold text-[#111827]">Configure Knowledge Base</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Optionally attach a URL and / or paste text so your agent retrieves domain-specific knowledge before responding.
          </p>
        </div>

        <div className="p-6 bg-white overflow-x-auto font-mono text-sm leading-[2] text-[#111827] border-b border-[#e5e7eb]">

          {/* Context lines */}
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">1</div>
            <div><span className="text-[#2563eb]">import</span> os</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">4</div>
            <div className="text-[#15803d]"># Agent Setup</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">5</div>
            <div>AGENT_NAME = <span className="text-[#b91c1c]">"{codeValues?.agentName || 'My Agent'}"</span></div>
          </div>

          {/* RAG_URL line */}
          <div className={`flex rounded transition-all duration-200 ${hasUrl ? 'bg-[#f3f4f6]' : ''}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none font-bold text-[#9ca3af]`}>6</div>
            <div>
              <span>RAG_URL</span> = <span className="text-[#b91c1c]">"</span>
              <input
                type="text"
                disabled={!enableRag}
                className={`border-b outline-none px-1 transition-all ${
                  enableRag
                    ? 'bg-transparent border-[#9ca3af] text-[#111827] w-56'
                    : 'bg-transparent border-[#d1d5db] text-[#9ca3af] w-40 cursor-not-allowed'
                }`}
                placeholder="https://docs.lyzr.ai/"
                value={ragUrl}
                onChange={e => setRagUrl(e.target.value)}
              />
              <span className="text-[#b91c1c]">"</span>
            </div>
          </div>

          {/* RAG_TEXT line */}
          <div className={`flex rounded transition-all duration-200 ${hasText ? 'bg-[#f3f4f6]' : ''}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none font-bold text-[#9ca3af]`}>7</div>
            <div>
              <span>RAG_TEXT</span> = <span className="text-[#b91c1c]">"""</span>
              <span className={`px-1 italic text-xs ${hasText ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                {hasText ? `${ragText.slice(0, 40)}${ragText.length > 40 ? '…' : ''}` : 'your pasted knowledge here'}
              </span>
              <span className="text-[#b91c1c]">"""</span>
            </div>
          </div>

          {/* RAG_FILE line */}
          <div className={`flex rounded transition-all duration-200 ${hasFile ? 'bg-[#f3f4f6]' : ''}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none font-bold text-[#9ca3af]`}>8</div>
            <div>
              <span>RAG_FILE</span> = <span className="text-[#b91c1c]">"</span>
              <span className={`px-1 italic text-xs ${hasFile ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
                {hasFile ? ragFile.name : 'your uploaded file here'}
              </span>
              <span className="text-[#b91c1c]">"</span>
            </div>
          </div>

          {/* Expanded Task 1 and Task 2 config */}
          <div className="flex mt-2 text-[#15803d]">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">9</div>
            <div># Task 1: Configure Model</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">9</div>
            <div>gemini_model = GeminiModel(</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">10</div>
            <div className="pl-4">parameters={'{'}</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">11</div>
            <div className="pl-8"><span className="text-[#b91c1c]">"model"</span>: <span className="text-[#b91c1c]">"{codeValues?.modelName || 'gemini-1.5-pro'}"</span>,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">12</div>
            <div className="pl-8"><span className="text-[#b91c1c]">"temperature"</span>: {codeValues?.temperature || 0.2},</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">13</div>
            <div className="pl-8"><span className="text-[#b91c1c]">"max_tokens"</span>: {codeValues?.maxTokens || 1500},</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">14</div>
            <div className="pl-4">{'}'},</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">15</div>
            <div>)</div>
          </div>
          <div className="flex mt-2 text-[#15803d]">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">16</div>
            <div># Task 2: Configure Agent</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">17</div>
            <div>{agentVar} = Agent(</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">18</div>
            <div className="pl-4">role=<span className="text-[#b91c1c]">"{codeValues?.role || 'Expert Consultant'}"</span>,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">19</div>
            <div className="pl-4">prompt_persona=<span className="text-[#b91c1c]">"{codeValues?.persona || ''}"</span></div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">20</div>
            <div>)</div>
          </div>
          <div className="flex mt-2 text-[#15803d]">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">21</div>
            <div># Task 3: Chat Loop</div>
          </div>
          <div className="flex text-[#9ca3af] italic">
            <div className="w-8 shrink-0 text-right pr-4 select-none">·</div>
            <div>...</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">27</div>
            <div className="pl-8">task = Task(</div>
          </div>

          {/* instructions line */}
          <div className={`flex rounded transition-all duration-200 ${enableRag ? 'bg-[#f3f4f6]' : ''}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]`}>28</div>
            <div className="pl-12 text-xs">
              <span>instructions</span>=
              {enableRag ? (
                hasUrl && hasText ? (
                  <span className="text-[#b91c1c]"> f"Context URL: {'{'}RAG_URL{'}'} + Text: {'{'}RAG_TEXT[:300]{'}'} Query: {'{'}user_input{'}'}"</span>
                ) : hasUrl ? (
                  <span className="text-[#b91c1c]"> f"Use context from {'{'}RAG_URL{'}'} to answer: {'{'}user_input{'}'}"</span>
                ) : hasText ? (
                  <span className="text-[#b91c1c]"> f"Use knowledge: {'{'}RAG_TEXT[:300]{'}'} Answer: {'{'}user_input{'}'}"</span>
                ) : (
                  <span className="text-[#b91c1c]"> f"Answer the user's query: {'{'}user_input{'}'}"</span>
                )
              ) : (
                <span className="text-[#b91c1c]"> f"Answer the user's query: {'{'}user_input{'}'}"</span>
              )}
              ,
            </div>
          </div>

          <div className="flex text-[#15803d]">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">·</div>
            <div>··· # pipeline.run() — rest of chat loop ···</div>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">

        {/* RAG Enable toggle */}
        <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-5 shadow-sm">
          <h3 className="font-bold mb-1 uppercase text-xs tracking-wider text-[#374151]">Knowledge Base (RAG)</h3>
          <p className="text-xs text-[#6b7280] mb-4 leading-relaxed">
            Attach a URL, paste text, or both. Your agent will use this context to answer domain-specific questions.
          </p>

          {/* Toggle */}
          <div
            onClick={() => setEnableRag(v => !v)}
            className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 mb-4 select-none"
            style={{ borderColor: enableRag ? '#7c3aed' : '#e5e7eb', backgroundColor: enableRag ? '#f3f0ff' : '#ffffff' }}
          >
            <span className="text-sm font-semibold" style={{ color: enableRag ? '#7c3aed' : '#6b7280' }}>
              {enableRag ? ' RAG Enabled' : 'Enable RAG'}
            </span>
            <div
              className="relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0"
              style={{ backgroundColor: enableRag ? '#7c3aed' : '#d1d5db' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: enableRag ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </div>
          </div>

          {enableRag && (
            <div className="flex flex-col gap-4">

              {/* URL Input */}
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1 flex items-center gap-1">
                  <span className="text-[#7c3aed]"></span> Knowledge Base URL
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs border border-[#ddd6fe] rounded-lg bg-white outline-none"
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#ddd6fe'}
                  placeholder="https://docs.lyzr.ai/"
                  value={ragUrl}
                  onChange={e => setRagUrl(e.target.value)}
                />
                <p className="text-xs text-[#9ca3af] mt-1">Agent fetches content from this URL at query time.</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#e5e7eb]" />
                <span className="text-xs font-semibold text-[#9ca3af]">and / or</span>
                <div className="flex-1 h-px bg-[#e5e7eb]" />
              </div>

              {/* Text Input */}
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1 flex items-center gap-1">
                  <span className="text-[#059669]"></span> Paste Text Content
                </label>
                <textarea
                  rows={5}
                  className="w-full px-3 py-2 text-xs border border-[#bbf7d0] rounded-lg bg-white outline-none resize-none leading-relaxed"
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#bbf7d0'}
                  placeholder="Paste any document excerpt, FAQ, product docs, or knowledge content here..."
                  value={ragText}
                  onChange={e => setRagText(e.target.value)}
                />
                <p className="text-xs text-[#9ca3af] mt-1">Inline text is embedded directly in the agent's context.</p>
              </div>

              {/* File Input */}
              <div>
                <label className="text-xs font-semibold text-[#374151] block mb-1 flex items-center gap-1">
                  <span className="text-[#ea580c]"></span> Upload Document (PDF/TXT)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer border border-[#fdba74] bg-[#fff7ed] hover:bg-[#ffedd5] px-4 py-2 rounded-lg text-xs text-[#c2410c] font-semibold transition-colors">
                    {ragFile ? 'Change File' : 'Choose File'}
                    <input 
                      type="file" 
                      accept=".pdf,.txt"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRagFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  <span className="text-xs text-[#6b7280] truncate max-w-[150px]">
                    {ragFile ? ragFile.name : 'No file chosen'}
                  </span>
                  {ragFile && (
                    <button 
                      onClick={() => setRagFile(null)}
                      className="text-xs text-[#ef4444] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced RAG Settings */}
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e5e7eb" }}>
                <h4 className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-3">Advanced Settings</h4>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#374151] block mb-1">Vector Store Provider</label>
                    <select
                      value={vectorStore}
                      onChange={e => setVectorStore(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#d1d5db] rounded-lg bg-white outline-none cursor-pointer"
                    >
                      <option value="pinecone">Pinecone</option>
                      <option value="qdrant">Qdrant</option>
                      <option value="weaviate">Weaviate</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-[#374151] block mb-1">Embedding Model</label>
                    <select
                      value={embeddingModel}
                      onChange={e => setEmbeddingModel(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#d1d5db] rounded-lg bg-white outline-none cursor-pointer"
                    >
                      <option value="text-embedding-3-small">text-embedding-3-small</option>
                      <option value="text-embedding-3-large">text-embedding-3-large</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          )}

          {!enableRag && (
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              Skip this step if your agent doesn't need domain-specific knowledge.
            </p>
          )}
        </div>

        {/* Agent Summary */}
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
          <h3 className="font-bold mb-3 uppercase text-xs tracking-wider text-[#374151]">Agent Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#6b7280]">Name</span>
              <span className="font-semibold text-[#111827] truncate ml-2 max-w-[150px]">{codeValues?.agentName || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6b7280]">Model</span>
              <span className="font-semibold text-[#7c3aed]">{codeValues?.modelName || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6b7280]">Temperature</span>
              <span className="font-semibold text-[#111827]">{codeValues?.temperature || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6b7280]">RAG</span>
              <span className="font-semibold" style={{ color: enableRag ? '#059669' : '#9ca3af' }}>
                {!enableRag ? 'Disabled' : (hasUrl && hasText && hasFile) ? 'URL + Text + File' : (hasUrl && hasText) ? 'URL + Text' : hasUrl ? 'URL only' : hasText ? 'Text only' : hasFile ? 'File only' : 'Enabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Deploy button */}
        <button
          onClick={() => onComplete(generateFinalCode(), { 
            ...codeValues, 
            enableRag, 
            ragUrl, 
            ragText, 
            ragFile,
            vectorStoreProvider: vectorStore,
            embeddingModel: embeddingModel
          })}
          className="font-semibold py-3 px-6 rounded-lg w-full text-white shadow-sm transition-colors"
          style={{ backgroundColor: '#7c3aed' }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#6d28d9'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#7c3aed'}
        >
          Deploy Agent →
        </button>
      </div>
    </div>
  );
}
