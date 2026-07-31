"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Terminal, FileCode, Code, Globe, FileJson, Layers, Save } from "lucide-react";

export default function CodeExporter({ config, tutorialCode }) {
  const [activeTab, setActiveTab] = useState(tutorialCode ? "sdk" : "python");
  const [copied, setCopied] = useState(false);

  const [customPython, setCustomPython] = useState("");
  const [customSdk, setCustomSdk] = useState("");

  useEffect(() => {
    const pythonCode = `import requests
import os
import uuid

# 1. Configuration
LYZR_API_KEY = os.getenv("LYZR_API_KEY")
AGENT_ID = "${config?.agentId || "YOUR_AGENT_ID"}"
URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"

# 2. Prepare Payload
payload = {
    "user_id": "default_user",
    "agent_id": AGENT_ID,
    "session_id": str(uuid.uuid4()),
    "message": "Hello, agent!"
}
headers = {
    "x-api-key": LYZR_API_KEY,
    "Content-Type": "application/json"
}

# 3. Call Lyzr Cloud
response = requests.post(URL, json=payload, headers=headers)
if response.status_code == 200:
    print("Agent Response:", response.json().get("response"))
else:
    print("Error:", response.text)`;

    const agentNameStr = config?.name || 'My Agent';
    const agentVar = agentNameStr.toLowerCase().replace(/\s+/g, '_') || 'agent';
    const hasRag = !!config?.ragUrl;
    const modelStr = config?.model || 'gemini-1.5-pro';
    const isGemini = modelStr.startsWith('gemini');
    
    const sdkCode = `import os
from lyzr_automata import Agent, Task, LinearSyncPipeline
${isGemini ? 'from lyzr_automata.ai_models.gemini import GeminiModel' : 'from lyzr_automata.ai_models.openai import OpenAIModel'}${config?.enableDatabase ? '\nfrom lyzr_automata.tools.database_tools import DatabaseTool' : ''}

# Agent Setup: ${agentNameStr}
AGENT_NAME = "${agentNameStr}"
${hasRag ? `RAG_URL = "${config.ragUrl}"\n` : ''}
# Task 1: Configure Model
os.environ["${isGemini ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'}"] = "your-api-key-here"

${isGemini ? 'gemini_model = GeminiModel' : 'openai_model = OpenAIModel'}(
    parameters={
        "model": "${modelStr}",
        "temperature": ${config?.temperature || 0.2},
    },
)

# Task 2: Configure Agent${config?.enableDatabase ? `\n# Setup Database Tool\ndb_tool = DatabaseTool(\n    connection_string="${config.dbConnectionString || 'postgresql://user:pass@localhost:5432/db'}"\n)` : ''}
${agentVar} = Agent(
    role="${agentNameStr}",
    prompt_persona="""${config?.instruction || 'You are a helpful assistant.'}"""${config?.enableDatabase ? ',\n    tools=[db_tool]' : ''}
)

# Task 3: Chat Loop${hasRag ? ' with RAG Context' : ''}
def start_chat():
    print(f"{AGENT_NAME} ready! (Type 'exit' to quit)")
    while True:
        user_input = input("You: ")
        if user_input.lower() == 'exit':
            break

        task = Task(
            name="Chat Task",
            agent=${agentVar},
            model=${isGemini ? 'gemini_model' : 'openai_model'},
            instructions=${hasRag ? 'f"Use context from {RAG_URL} to answer: {user_input}"' : 'f"Answer the user\'s query: {user_input}"'},
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

    setCustomPython(pythonCode);
    setCustomSdk(tutorialCode || sdkCode);
  }, [config, tutorialCode]);

  const getCode = () => {
    switch(activeTab) {
      case "python": return customPython;
      case "sdk": return customSdk;
      default: return "";
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToFile = () => {
    const code = getCode();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'python' ? 'api_access.py' : 'lyzr_agent.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden font-sans shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
          <FileCode size={16} className="text-violet-600" />
          <span>Integration Code (Editable)</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveToFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-gray-50 px-4 py-2 gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("python")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "python" ? "bg-violet-600 text-white shadow-sm" : "bg-transparent text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Code size={14} /> API Access
        </button>
        <button
          onClick={() => setActiveTab("sdk")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "sdk" ? "bg-violet-600 text-white shadow-sm" : "bg-transparent text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Layers size={14} /> Automata SDK Code
        </button>
      </div>

      {/* Code Area */}
      <div className="flex-1 p-0 bg-[#1e1e1e] flex flex-col relative group">
        <textarea
          value={activeTab === "python" ? customPython : customSdk}
          onChange={(e) => {
            if (activeTab === "python") setCustomPython(e.target.value);
            else setCustomSdk(e.target.value);
          }}
          spellCheck="false"
          className="flex-1 w-full m-0 p-5 bg-transparent text-[#d4d4d4] font-mono text-[13px] leading-relaxed border-none outline-none resize-none"
        />
      </div>
    </div>
  );
}
