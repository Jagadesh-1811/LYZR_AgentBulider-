import React, { useState, useEffect } from 'react';
import { MissionAssistant } from './MissionAssistant';

export function MissionEditor({ mode, templateConfig, onComplete }) {
  const isScratch = mode === 'scratch';

  const [checklist, setChecklist] = useState({
    agentName: false,
    description: false,
    modelName: false,
    persona: false,
  });

  const [codeValues, setCodeValues] = useState({
    agentName: '',
    description: '',
    modelName: 'gemini-1.5-pro',
    temperature: '0.2',
    maxTokens: '1500',
    role: 'Expert Consultant',
    persona: '',
    enableDatabase: false,
    dbConnectionString: '',
  });

  // Pre-fill fields from template when a template is selected
  useEffect(() => {
    if (!isScratch && templateConfig) {
      setCodeValues((prev) => ({
        ...prev,
        agentName:   templateConfig.name        || prev.agentName,
        description: templateConfig.description || prev.description,
        modelName:   templateConfig.model       || prev.modelName,
        temperature: templateConfig.temperature !== undefined
          ? String(templateConfig.temperature)
          : prev.temperature,
        role:        templateConfig.name        || prev.role,
        persona:     templateConfig.instruction || prev.persona,
      }));
    }
  }, [templateConfig, isScratch]);

  useEffect(() => {
    setChecklist({
      agentName: codeValues.agentName.trim().length > 0,
      description: codeValues.description.trim().length > 0,
      modelName: codeValues.modelName.trim().length > 0,
      persona:   codeValues.persona.trim().length > 0,
    });
  }, [codeValues]);

  const isComplete = Object.values(checklist).every(Boolean);

  const handleInputChange = (field, value) => {
    setCodeValues((prev) => ({ ...prev, [field]: value }));
  };

  const generateCode = () => {
    const agentVar = (codeValues.agentName || 'expert_agent').toLowerCase().replace(/\s+/g, '_');
    const isGemini = codeValues.modelName.startsWith('gemini');
    
    return `import os
from lyzr_automata import Agent, Task, LinearSyncPipeline
${isGemini ? 'from lyzr_automata.ai_models.gemini import GeminiModel' : 'from lyzr_automata.ai_models.openai import OpenAIModel'}${codeValues.enableDatabase ? '\nfrom lyzr_automata.tools.database_tools import DatabaseTool' : ''}

# Agent Setup: ${codeValues.agentName || 'My Agent'}
AGENT_NAME = "${codeValues.agentName || 'My Agent'}"

# Task 1: Configure Model
os.environ["${isGemini ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'}"] = "your-api-key-here"

${isGemini ? 'gemini_model = GeminiModel' : 'openai_model = OpenAIModel'}(
    parameters={
        "model": "${codeValues.modelName}",
        "temperature": ${codeValues.temperature || 0.2},
        "max_tokens": ${codeValues.maxTokens || 1500},
    },
)

# Task 2: Configure Agent${codeValues.enableDatabase ? `\n# Setup Database Tool\ndb_tool = DatabaseTool(\n    connection_string="${codeValues.dbConnectionString || 'postgresql://user:pass@localhost:5432/db'}"\n)` : ''}
${agentVar} = Agent(
    role="${codeValues.role}",
    prompt_persona="""${codeValues.persona}"""${codeValues.enableDatabase ? ',\n    tools=[db_tool]' : ''}
)

# Task 3: Chat Loop
def start_chat():
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'exit': break
        task = Task(
            instructions=f"Answer the user's query: {user_input}",
            agent=${agentVar}, model=${isGemini ? 'gemini_model' : 'openai_model'},
        )
        pipeline = LinearSyncPipeline(tasks=[task])
        print(f"Agent: {pipeline.run()[0].task_output}")

if __name__ == "__main__":
    start_chat()
`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
      {/* Editor Section */}
      <div className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-xl shadow-gray-200/50 flex flex-col border border-gray-200">
        
        {/* IDE Toolbar */}
        <div className="px-4 py-3 bg-[#2d2d2d] border-b border-[#3c3c3c] flex items-center gap-4">
          <div className="flex-1 flex justify-center items-center gap-6 font-mono text-xs select-none">
            <span className="text-gray-300 font-medium bg-[#3c3c3c]/50 px-3 py-1 rounded-md">
              agent_config.py
            </span>
            <span className="text-gray-600 cursor-default">
              requirements.txt
            </span>
          </div>
        </div>

        <div className="p-6 overflow-x-auto font-mono text-[13px] leading-relaxed text-[#d4d4d4] h-[750px] overflow-y-auto">
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">1</div>
            <div><span className="text-[#c586c0]">import</span> os</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">2</div>
            <div><span className="text-[#c586c0]">from</span> lyzr_automata <span className="text-[#c586c0]">import</span> Agent, Task, LinearSyncPipeline</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#5c5c6e]">3</div>
            <div><span className="text-[#c586c0]">from</span> lyzr_automata.ai_models.{codeValues.modelName.startsWith('gemini') ? 'gemini' : 'openai'} <span className="text-[#c586c0]">import</span> {codeValues.modelName.startsWith('gemini') ? 'GeminiModel' : 'OpenAIModel'}</div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">4</div>
            <div></div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">5</div>
            <div className="text-[#6a9955]"># Agent Setup</div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors items-center">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">6</div>
            <div><span className="text-[#9cdcfe]">AGENT_NAME</span> = <span className="text-[#ce9178]">"</span><input
              type="text"
              className="bg-transparent border-b border-dashed border-[#569cd6]/50 text-[#ce9178] outline-none w-48 px-1 placeholder:text-[#ce9178]/50 focus:bg-[#333333] focus:border-solid transition-all"
              placeholder="My Pirate Consultant"
              value={codeValues.agentName}
              onChange={e => handleInputChange('agentName', e.target.value)}
            /><span className="text-[#ce9178]">"</span></div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors items-center">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">7</div>
            <div><span className="text-[#9cdcfe]">AGENT_DESC</span> = <span className="text-[#ce9178]">"</span><input
              type="text"
              className="bg-transparent border-b border-dashed border-[#569cd6]/50 text-[#ce9178] outline-none w-64 px-1 placeholder:text-[#ce9178]/50 focus:bg-[#333333] focus:border-solid transition-all"
              placeholder="A brief description of the agent"
              value={codeValues.description}
              onChange={e => handleInputChange('description', e.target.value)}
            /><span className="text-[#ce9178]">"</span></div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">8</div>
            <div></div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">9</div>
            <div className="text-[#6a9955]"># Task 1: Configure Model</div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">10</div>
            <div>{codeValues.modelName.startsWith('gemini') ? 'gemini_model' : 'openai_model'} = <span className="text-[#4ec9b0]">{codeValues.modelName.startsWith('gemini') ? 'GeminiModel' : 'OpenAIModel'}</span>(</div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">11</div>
            <div className="pl-8"><span className="text-[#9cdcfe]">parameters</span>={'{'}</div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors items-center">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">12</div>
            <div className="pl-16"><span className="text-[#ce9178]">"model"</span>: <span className="text-[#ce9178]">"</span><select
              className="bg-[#333333] border border-[#569cd6]/30 text-[#ce9178] outline-none rounded text-xs py-0.5 px-1 focus:border-[#569cd6]"
              value={codeValues.modelName}
              onChange={e => handleInputChange('modelName', e.target.value)}
            >
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              <option value="gemini-1.0-pro">gemini-1.0-pro</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
            </select><span className="text-[#ce9178]">"</span>,</div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors items-center">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">13</div>
            <div className="pl-16"><span className="text-[#ce9178]">"temperature"</span>: <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              className="bg-transparent border-b border-dashed border-[#569cd6]/50 text-[#b5cea8] outline-none w-16 px-1 focus:bg-[#333333] focus:border-solid transition-all"
              value={codeValues.temperature}
              onChange={e => handleInputChange('temperature', e.target.value)}
            />,</div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors items-center">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">14</div>
            <div className="pl-16"><span className="text-[#ce9178]">"max_tokens"</span>: <input
              type="number"
              className="bg-transparent border-b border-dashed border-[#569cd6]/50 text-[#b5cea8] outline-none w-20 px-1 focus:bg-[#333333] focus:border-solid transition-all"
              value={codeValues.maxTokens}
              onChange={e => handleInputChange('maxTokens', e.target.value)}
            />,</div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">15</div>
            <div className="pl-8">{'}'}</div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">16</div>
            <div>)</div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">17</div>
            <div></div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">18</div>
            <div className="text-[#6a9955]"># Task 2: Configure Agent</div>
          </div>
          <div className="flex group">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">19</div>
            <div><span className="text-[#9cdcfe]">expert_agent</span> = <span className="text-[#4ec9b0]">Agent</span>(</div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors items-center">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">20</div>
            <div className="pl-8"><span className="text-[#9cdcfe]">role</span>=<span className="text-[#ce9178]">"</span><input
              type="text"
              className="bg-transparent border-b border-dashed border-[#569cd6]/50 text-[#ce9178] outline-none w-48 px-1 placeholder:text-[#ce9178]/50 focus:bg-[#333333] focus:border-solid transition-all"
              placeholder="Expert Consultant"
              value={codeValues.role}
              onChange={e => handleInputChange('role', e.target.value)}
            /><span className="text-[#ce9178]">"</span>,</div>
          </div>
          <div className="flex group hover:bg-[#2a2d2e] rounded transition-colors items-center">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#858585]">21</div>
            <div className="pl-8"><span className="text-[#9cdcfe]">prompt_persona</span>=<span className="text-[#ce9178]">"""</span><input
              type="text"
              className="bg-transparent border-b border-dashed border-[#569cd6]/50 text-[#ce9178] outline-none w-[360px] px-1 placeholder:text-[#ce9178]/50 focus:bg-[#333333] focus:border-solid transition-all"
              placeholder="You are an expert consultant..."
              value={codeValues.persona}
              onChange={e => handleInputChange('persona', e.target.value)}
            /><span className="text-[#ce9178]">"""</span></div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">22</div>
            <div>)</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">23</div>
            <div className="text-[#6a9955]"># Task 3: Chat Loop</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">24</div>
            <div><span className="text-[#569cd6]">def</span> <span className="text-[#dcdcaa]">start_chat</span>():</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">25</div>
            <div className="pl-8"><span className="text-[#c586c0]">while True</span>:</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">26</div>
            <div className="pl-16">user_input = <span className="text-[#dcdcaa]">input</span>(<span className="text-[#ce9178]">"You: "</span>)</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">27</div>
            <div className="pl-16"><span className="text-[#c586c0]">if</span> user_input.lower() == <span className="text-[#ce9178]">'exit'</span>: <span className="text-[#c586c0]">break</span></div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">28</div>
            <div className="pl-16">task = <span className="text-[#dcdcaa]">Task</span>(</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">29</div>
            <div className="pl-24">instructions=<span className="text-[#ce9178]">f"Answer the user's query: {'{'}</span>user_input<span className="text-[#ce9178]">{'}'}"</span>,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">30</div>
            <div className="pl-24">agent=expert_agent, model={codeValues.modelName.startsWith('gemini') ? 'gemini_model' : 'openai_model'}</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">31</div>
            <div className="pl-16">)</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">32</div>
            <div className="pl-16">pipeline = <span className="text-[#dcdcaa]">LinearSyncPipeline</span>(tasks=[task])</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">33</div>
            <div className="pl-16"><span className="text-[#dcdcaa]">print</span>(<span className="text-[#ce9178]">f"Agent: {'{'}</span>pipeline.run()[0].task_output<span className="text-[#ce9178]">{'}'}"</span>)</div>
          </div>
        </div>
      </div>

      {/* Checklist / Sidebar */}
      <div className="flex flex-col gap-6">
        
        {/* Step Info Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="font-mono text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-2">
            <span className="text-violet-600 bg-violet-50 px-2 py-1 rounded">Step 1</span> &middot; Configuration
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Configure the Agent</h1>
          <p className="text-sm text-gray-500 mt-1">Fill out the highlighted code fields to define your agent's behavior.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 uppercase text-[11px] tracking-wider text-gray-400">Mission Checklist</h3>
          <div className="space-y-3.5 text-sm">

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${checklist.agentName ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-transparent'}`}>
                {checklist.agentName && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className={`font-semibold ${checklist.agentName ? 'text-gray-900' : 'text-gray-500'}`}>Set Agent Name</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${checklist.description ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-transparent'}`}>
                {checklist.description && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className={`font-semibold ${checklist.description ? 'text-gray-900' : 'text-gray-500'}`}>Set Description</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${checklist.modelName ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-transparent'}`}>
                {checklist.modelName && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className={`font-semibold ${checklist.modelName ? 'text-gray-900' : 'text-gray-500'}`}>Select Model</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${checklist.persona ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-transparent'}`}>
                {checklist.persona && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              </div>
              <span className={`font-semibold ${checklist.persona ? 'text-gray-900' : 'text-gray-500'}`}>Define Persona</span>
            </div>

          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 uppercase text-[11px] tracking-wider text-gray-400">Capabilities & Tools</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  id="enableDb" 
                  className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-violet-600 checked:border-violet-600 transition-colors cursor-pointer"
                  checked={codeValues.enableDatabase}
                  onChange={e => handleInputChange('enableDatabase', e.target.checked)}
                />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <label htmlFor="enableDb" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                Enable Database Tool
              </label>
            </div>
            
            {codeValues.enableDatabase && (
              <div className="pl-8 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Connection String
                </label>
                <input
                  type="text"
                  placeholder="postgresql://user:pass@localhost:5432/db"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  value={codeValues.dbConnectionString}
                  onChange={e => handleInputChange('dbConnectionString', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <button
          disabled={!isComplete}
          onClick={() => onComplete(generateCode(), codeValues)}
          className={`font-bold py-3.5 px-6 rounded-xl transition-all duration-200 w-full flex items-center justify-center gap-2 ${isComplete ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          {isComplete ? 'Next: RAG Setup →' : 'Complete checklist to continue'}
        </button>

        <MissionAssistant />
      </div>
    </div>
  );
}
