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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#374151" }}>
          <FileCode size={14} color="#7c3aed" />
          <span>Integration Code (Editable)</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={saveToFile}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: "700", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s ease-in-out" }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <Save size={12} />
            <span>Save</span>
          </button>
          <button
            onClick={copyToClipboard}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: "700", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s ease-in-out" }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            {copied ? (
              <>
                <Check size={12} color="#059669" />
                <span style={{ color: "#059669" }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", backgroundColor: "#f8fafc", padding: "8px 16px", gap: "8px", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
        <button
          onClick={() => setActiveTab("python")}
          style={{ 
            display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "12px", fontWeight: "700", borderRadius: "6px", cursor: "pointer",
            backgroundColor: activeTab === "python" ? "#7c3aed" : "transparent", color: activeTab === "python" ? "#ffffff" : "#374151", border: "none"
          }}
        >
          <Code size={12} /> API Access
        </button>
        <button
          onClick={() => setActiveTab("sdk")}
          style={{ 
            display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "12px", fontWeight: "700", borderRadius: "6px", cursor: "pointer",
            backgroundColor: activeTab === "sdk" ? "#7c3aed" : "transparent", color: activeTab === "sdk" ? "#ffffff" : "#374151", border: "none"
          }}
        >
          <Layers size={12} /> Automata SDK Code
        </button>
      </div>

      <div style={{ flex: 1, padding: 0, backgroundColor: "#111827", display: "flex", flexDirection: "column" }}>
        <textarea
          value={activeTab === "python" ? customPython : customSdk}
          onChange={(e) => {
            if (activeTab === "python") setCustomPython(e.target.value);
            else setCustomSdk(e.target.value);
          }}
          spellCheck="false"
          style={{
            flex: 1,
            width: "100%",
            margin: 0,
            padding: "16px",
            backgroundColor: "transparent",
            color: "#f8fafc",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "20px",
            border: "none",
            outline: "none",
            resize: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "auto"
          }}
        />
      </div>
    </div>
  );
}
