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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
      {/* Editor Section */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#e5e7eb] bg-[#f8fafc]">
          <div className="font-mono text-xs text-[#374151] tracking-wider uppercase mb-1">
            <b className="text-[#7c3aed]">Step 3</b> &middot; Editor
          </div>
          <h1 className="text-xl font-bold text-[#111827]">Configure the Agent</h1>
        </div>

        <div className="p-6 bg-white overflow-x-auto font-mono text-sm leading-[2] text-[#374151] border-b border-[#e5e7eb]">
          <div className="flex">
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
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#5c5c6e]">4</div>
            <div></div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">5</div>
            <div className="text-[#6a9955]"># Agent Setup</div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">6</div>
            <div>AGENT_NAME = "<input
              type="text"
              className="bg-[#7c3aed]/10 border-b border-[#7c3aed] text-[#7c3aed] outline-none w-48 px-1 placeholder:text-[#9ca3af]"
              placeholder="My Pirate Consultant"
              value={codeValues.agentName}
              onChange={e => handleInputChange('agentName', e.target.value)}
            />"</div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">7</div>
            <div>AGENT_DESC = "<input
              type="text"
              className="bg-[#7c3aed]/10 border-b border-[#7c3aed] text-[#7c3aed] outline-none w-64 px-1 placeholder:text-[#9ca3af]"
              placeholder="A brief description of the agent"
              value={codeValues.description}
              onChange={e => handleInputChange('description', e.target.value)}
            />"</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#5c5c6e]">8</div>
            <div></div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">9</div>
            <div className="text-[#6a9955]"># Task 1: Configure Model</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">10</div>
            <div>{codeValues.modelName.startsWith('gemini') ? 'gemini_model' : 'openai_model'} = <span className="text-[#dcdcaa]">{codeValues.modelName.startsWith('gemini') ? 'GeminiModel' : 'OpenAIModel'}</span>(</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">11</div>
            <div className="pl-8">parameters={'{'}</div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">12</div>
            <div className="pl-16">"model": "<select
              className="bg-[#7c3aed]/10 border-b border-[#7c3aed] text-[#7c3aed] outline-none"
              value={codeValues.modelName}
              onChange={e => handleInputChange('modelName', e.target.value)}
            >
              <option value="gemini-1.5-pro" className="bg-white text-[#111827]">gemini-1.5-pro</option>
              <option value="gemini-1.5-flash" className="bg-white text-[#111827]">gemini-1.5-flash</option>
              <option value="gemini-2.5-pro" className="bg-white text-[#111827]">gemini-2.5-pro</option>
              <option value="gemini-1.0-pro" className="bg-white text-[#111827]">gemini-1.0-pro</option>
              <option value="gpt-4o" className="bg-white text-[#111827]">gpt-4o</option>
              <option value="gpt-4-turbo" className="bg-white text-[#111827]">gpt-4-turbo</option>
            </select>",</div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">13</div>
            <div className="pl-16">"temperature": <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              className="bg-[#7c3aed]/10 border-b border-[#7c3aed] text-[#7c3aed] outline-none w-16 px-1"
              value={codeValues.temperature}
              onChange={e => handleInputChange('temperature', e.target.value)}
            />,</div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">14</div>
            <div className="pl-16">"max_tokens": <input
              type="number"
              className="bg-[#7c3aed]/10 border-b border-[#7c3aed] text-[#7c3aed] outline-none w-20 px-1"
              value={codeValues.maxTokens}
              onChange={e => handleInputChange('maxTokens', e.target.value)}
            />,</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">15</div>
            <div className="pl-8">{'}'}</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">16</div>
            <div>)</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">17</div>
            <div></div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">18</div>
            <div className="text-[#6a9955]"># Task 2: Configure Agent</div>
          </div>
          <div className="flex">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#9ca3af]">19</div>
            <div>expert_agent = <span className="text-[#dcdcaa]">Agent</span>(</div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">20</div>
            <div className="pl-8">role="<input
              type="text"
              className="bg-[#7c3aed]/10 border-b border-[#7c3aed] text-[#7c3aed] outline-none w-48 px-1 placeholder:text-[#9ca3af]"
              placeholder="Expert Consultant"
              value={codeValues.role}
              onChange={e => handleInputChange('role', e.target.value)}
            />",</div>
          </div>
          <div className="flex bg-[#059669]/10 rounded">
            <div className="w-8 shrink-0 text-right pr-4 select-none text-[#059669]">21</div>
            <div className="pl-8">prompt_persona="<input
              type="text"
              className="bg-[#7c3aed]/10 border-b border-[#7c3aed] text-[#7c3aed] outline-none w-96 px-1 placeholder:text-[#9ca3af]"
              placeholder="You are an expert consultant..."
              value={codeValues.persona}
              onChange={e => handleInputChange('persona', e.target.value)}
            />"</div>
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
        <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-[#374151]">Mission Checklist</h3>
          <div className="space-y-3 text-sm">

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checklist.agentName ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#9ca3af] text-transparent'}`}>
                {checklist.agentName && ''}
              </div>
              <span className={checklist.agentName ? 'text-[#111827]' : 'text-[#374151]'}>Set Agent Name</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checklist.description ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#9ca3af] text-transparent'}`}>
                {checklist.description && ''}
              </div>
              <span className={checklist.description ? 'text-[#111827]' : 'text-[#374151]'}>Set Description</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checklist.modelName ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#9ca3af] text-transparent'}`}>
                {checklist.modelName && ''}
              </div>
              <span className={checklist.modelName ? 'text-[#111827]' : 'text-[#374151]'}>Select Model</span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checklist.persona ? 'bg-[#059669] border-[#059669] text-white' : 'border-[#9ca3af] text-transparent'}`}>
                {checklist.persona && ''}
              </div>
              <span className={checklist.persona ? 'text-[#111827]' : 'text-[#374151]'}>Define Persona</span>
            </div>

          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 uppercase text-xs tracking-wider text-[#374151]">Capabilities & Tools</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="enableDb" 
                className="w-4 h-4 text-[#059669] rounded focus:ring-[#059669] cursor-pointer"
                checked={codeValues.enableDatabase}
                onChange={e => handleInputChange('enableDatabase', e.target.checked)}
              />
              <label htmlFor="enableDb" className="text-sm font-medium text-[#111827] cursor-pointer">
                Enable Database Tool
              </label>
            </div>
            
            {codeValues.enableDatabase && (
              <div className="pl-6 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Connection String
                </label>
                <input
                  type="text"
                  placeholder="postgresql://user:pass@localhost:5432/db"
                  className="w-full px-3 py-2 text-xs border border-[#d1d5db] rounded outline-none focus:border-[#7c3aed]"
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
          className={`font-semibold py-3 px-6 rounded-lg transition-colors w-full ${isComplete ? 'bg-[#7c3aed] hover:bg-[#a78bfa] text-white shadow-sm' : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'}`}
        >
          {isComplete ? 'Next: RAG Setup →' : 'Complete checklist to continue'}
        </button>

        <MissionAssistant />
      </div>
    </div>
  );
}
