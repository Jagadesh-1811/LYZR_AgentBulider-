import React, { useState } from 'react';

export function RagSetup({ codeValues, templateConfig, onComplete }) {
  const [enableRag, setEnableRag] = useState(!!(templateConfig && templateConfig.ragText));
  const [ragUrl, setRagUrl] = useState('https://docs.lyzr.ai/');
  const [ragText, setRagText] = useState((templateConfig && templateConfig.ragText) || '');
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
${hasUrl  ? `RAG_URL = "${ragUrl}"\n` : ''}${hasText ? `RAG_TEXT = """\n${ragText.slice(0, 200000)}${ragText.length > 200000 ? '...' : ''}\n"""\n` : ''}${hasFile ? `RAG_FILE = "${ragFile.name}"\n` : ''}
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* ── Code Editor Panel ─────────────────────────────────────── */}
      <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-xl shadow-gray-200/50 flex flex-col border border-gray-200">
        
        {/* IDE Toolbar */}
        <div className="px-4 py-3 bg-[#2d2d2d] border-b border-[#3c3c3c] flex items-center gap-4">
          <div className="flex-1 flex justify-center items-center gap-6 font-mono text-xs select-none">
            <span className="text-gray-300 font-medium bg-[#3c3c3c]/50 px-3 py-1 rounded-md">
              rag_config.py
            </span>
            <span className="text-gray-600 cursor-default">
              requirements.txt
            </span>
          </div>
        </div>

        <div className="p-6 overflow-x-auto font-mono text-[13px] leading-relaxed text-[#d4d4d4] h-[750px] overflow-y-auto">

          {/* Context lines */}
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">1</div>
            <div><span className="text-[#c586c0]">import</span> os</div>
          </div>
          <div className="flex mt-2">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">4</div>
            <div className="text-[#6a9955]"># Agent Setup</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">5</div>
            <div><span className="text-[#9cdcfe]">AGENT_NAME</span> = <span className="text-[#ce9178]">"{codeValues?.agentName || 'My Agent'}"</span></div>
          </div>

          {/* RAG_URL line */}
          <div className={`flex rounded transition-all duration-200 items-center ${hasUrl ? 'bg-[#2a2d2e]' : 'group hover:bg-[#2a2d2e]'}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none ${hasUrl ? 'font-bold text-[#858585]' : 'text-[#858585]'}`}>6</div>
            <div>
              <span className="text-[#9cdcfe]">RAG_URL</span> = <span className="text-[#ce9178]">"</span>
              <input
                type="text"
                disabled={!enableRag}
                className={`bg-transparent border-b outline-none px-1 transition-all focus:bg-[#333333] ${
                  enableRag
                    ? 'border-dashed border-[#569cd6]/50 text-[#ce9178] w-56'
                    : 'border-transparent text-[#ce9178]/50 w-40 cursor-not-allowed'
                }`}
                placeholder="https://docs.lyzr.ai/"
                value={ragUrl}
                onChange={e => setRagUrl(e.target.value)}
              />
              <span className="text-[#ce9178]">"</span>
            </div>
          </div>

          {/* RAG_TEXT line */}
          <div className={`flex rounded transition-all duration-200 items-center ${hasText ? 'bg-[#2a2d2e]' : 'group hover:bg-[#2a2d2e]'}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none ${hasText ? 'font-bold text-[#858585]' : 'text-[#858585]'}`}>7</div>
            <div>
              <span className="text-[#9cdcfe]">RAG_TEXT</span> = <span className="text-[#ce9178]">"""</span>
              <span className={`px-1 italic text-xs ${hasText ? 'text-[#ce9178]' : 'text-[#858585]'}`}>
                {hasText ? `${ragText.slice(0, 40)}${ragText.length > 40 ? '…' : ''}` : 'your pasted knowledge here'}
              </span>
              <span className="text-[#ce9178]">"""</span>
            </div>
          </div>

          {/* RAG_FILE line */}
          <div className={`flex rounded transition-all duration-200 items-center ${hasFile ? 'bg-[#2a2d2e]' : 'group hover:bg-[#2a2d2e]'}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none ${hasFile ? 'font-bold text-[#858585]' : 'text-[#858585]'}`}>8</div>
            <div>
              <span className="text-[#9cdcfe]">RAG_FILE</span> = <span className="text-[#ce9178]">"</span>
              <span className={`px-1 italic text-xs ${hasFile ? 'text-[#ce9178]' : 'text-[#858585]'}`}>
                {hasFile ? ragFile.name : 'your uploaded file here'}
              </span>
              <span className="text-[#ce9178]">"</span>
            </div>
          </div>

          {/* Expanded Task 1 and Task 2 config */}
          <div className="flex mt-2">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">9</div>
            <div className="text-[#6a9955]"># Task 1: Configure Model</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">10</div>
            <div>gemini_model = <span className="text-[#4ec9b0]">GeminiModel</span>(</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">11</div>
            <div className="pl-4"><span className="text-[#9cdcfe]">parameters</span>={'{'}</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">12</div>
            <div className="pl-8"><span className="text-[#ce9178]">"model"</span>: <span className="text-[#ce9178]">"{codeValues?.modelName || 'gemini-1.5-pro'}"</span>,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">13</div>
            <div className="pl-8"><span className="text-[#ce9178]">"temperature"</span>: <span className="text-[#b5cea8]">{codeValues?.temperature || 0.2}</span>,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">14</div>
            <div className="pl-8"><span className="text-[#ce9178]">"max_tokens"</span>: <span className="text-[#b5cea8]">{codeValues?.maxTokens || 1500}</span>,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">15</div>
            <div className="pl-4">{'}'},</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">16</div>
            <div>)</div>
          </div>
          <div className="flex mt-2">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">17</div>
            <div className="text-[#6a9955]"># Task 2: Configure Agent</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">18</div>
            <div><span className="text-[#9cdcfe]">{agentVar}</span> = <span className="text-[#4ec9b0]">Agent</span>(</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">19</div>
            <div className="pl-4"><span className="text-[#9cdcfe]">role</span>=<span className="text-[#ce9178]">"{codeValues?.role || 'Expert Consultant'}"</span>,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">20</div>
            <div className="pl-4"><span className="text-[#9cdcfe]">prompt_persona</span>=<span className="text-[#ce9178]">"{codeValues?.persona || ''}"</span></div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">21</div>
            <div>)</div>
          </div>
          <div className="flex mt-2">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">22</div>
            <div className="text-[#6a9955]"># Task 3: Chat Loop</div>
          </div>
          <div className="flex text-[#858585] italic">
            <div className="w-8 shrink-0 text-right pr-4 select-none">·</div>
            <div>...</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">28</div>
            <div className="pl-8">task = <span className="text-[#4ec9b0]">Task</span>(</div>
          </div>

          {/* instructions line */}
          <div className={`flex rounded transition-all duration-200 ${enableRag ? 'bg-[#2a2d2e]' : ''}`}>
            <div className={`w-8 shrink-0 text-right pr-4 select-none text-[#858585]`}>29</div>
            <div className="pl-12 text-xs">
              <span className="text-[#9cdcfe]">instructions</span>=
              {enableRag ? (
                hasUrl && hasText ? (
                  <span className="text-[#ce9178]"> f"Context URL: {'{'}RAG_URL{'}'} + Text: {'{'}RAG_TEXT[:300]{'}'} Query: {'{'}user_input{'}'}"</span>
                ) : hasUrl ? (
                  <span className="text-[#ce9178]"> f"Use context from {'{'}RAG_URL{'}'} to answer: {'{'}user_input{'}'}"</span>
                ) : hasText ? (
                  <span className="text-[#ce9178]"> f"Use knowledge: {'{'}RAG_TEXT[:300]{'}'} Answer: {'{'}user_input{'}'}"</span>
                ) : (
                  <span className="text-[#ce9178]"> f"Answer the user's query: {'{'}user_input{'}'}"</span>
                )
              ) : (
                <span className="text-[#ce9178]"> f"Answer the user's query: {'{'}user_input{'}'}"</span>
              )}
              ,
            </div>
          </div>

          <div className="flex text-[#6a9955]">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">·</div>
            <div>··· # pipeline.run() — rest of chat loop ···</div>
          </div>
        </div>
      </div>

      {/* ── Right Sidebar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">

        {/* Step Info Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-2">
            <span className="text-violet-600 bg-violet-50 px-2 py-1 rounded">Step 2</span> &middot; RAG Setup
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">Provide domain-specific knowledge to ground your agent's responses.</p>
        </div>

        {/* RAG Enable toggle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 uppercase text-[11px] tracking-wider text-gray-400">RAG Configuration</h3>

          {/* Toggle */}
          <div
            onClick={() => setEnableRag(v => !v)}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 mb-5 select-none ${enableRag ? 'border-violet-500 bg-violet-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
          >
            <span className={`text-sm font-bold ${enableRag ? 'text-violet-700' : 'text-gray-600'}`}>
              {enableRag ? 'RAG Enabled' : 'Enable RAG'}
            </span>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${enableRag ? 'bg-violet-600' : 'bg-gray-300'}`}>
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${enableRag ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </div>
          </div>

          {enableRag && (
            <div className="flex flex-col gap-5 animate-in slide-in-from-top-2 duration-200">

              {/* URL Input */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                   Knowledge Base URL
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  placeholder="https://docs.lyzr.ai/"
                  value={ragUrl}
                  onChange={e => setRagUrl(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1.5 font-medium">Agent fetches content from this URL at query time.</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">and / or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Text Input */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                   Paste Text Content
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none leading-relaxed focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  placeholder="Paste any document excerpt, FAQ, product docs, or knowledge content here..."
                  value={ragText}
                  onChange={e => setRagText(e.target.value)}
                />
              </div>

              {/* File Input */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                   Upload Document
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-violet-50 hover:border-violet-300 px-5 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:text-violet-700 transition-all">
                    {ragFile ? 'Change File' : 'Choose File (PDF/TXT)'}
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
                  <span className="text-xs text-gray-500 font-medium truncate max-w-[120px]">
                    {ragFile ? ragFile.name : 'No file chosen'}
                  </span>
                  {ragFile && (
                    <button 
                      onClick={() => setRagFile(null)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced RAG Settings */}
              <div className="mt-2 pt-5 border-t border-gray-100">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Advanced Vector Store Settings</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1.5">Provider</label>
                    <select
                      value={vectorStore}
                      onChange={e => setVectorStore(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition-colors"
                    >
                      <option value="pinecone">Pinecone</option>
                      <option value="qdrant">Qdrant</option>
                      <option value="weaviate">Weaviate</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1.5">Embedding Model</label>
                    <select
                      value={embeddingModel}
                      onChange={e => setEmbeddingModel(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-violet-500 transition-colors"
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
            <p className="text-xs font-medium text-gray-400 mt-1">
              Leave disabled if your agent doesn't need external knowledge context.
            </p>
          )}
        </div>

        {/* Agent Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-3 uppercase text-[11px] tracking-wider text-gray-400">Deployment Summary</h3>
          <div className="space-y-2.5 text-xs font-medium">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Agent Name</span>
              <span className="text-gray-900 font-bold truncate max-w-[150px]">{codeValues?.agentName || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Model Engine</span>
              <span className="text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded">{codeValues?.modelName || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">RAG Strategy</span>
              <span className={`font-bold ${enableRag ? 'text-emerald-600' : 'text-gray-400'}`}>
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
          className="font-bold py-3.5 px-6 rounded-xl w-full text-white shadow-md bg-violet-600 hover:bg-violet-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
        >
          Ship Agent to Cloud →
        </button>
      </div>
    </div>
  );
}
