"use client";

import { useState } from "react";
import { Copy, Check, Terminal, FileCode, Code, Globe, FileJson, Layers } from "lucide-react";

export default function CodeExporter({ config, tutorialCode }) {
  const [activeTab, setActiveTab] = useState(tutorialCode ? "sdk" : "python");
  const [copied, setCopied] = useState(false);

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

  const sdkCode = `from lyzr_automata.ai_models.openai import OpenAIModel
from lyzr_automata import Agent, Task
from lyzr_automata.pipelines.linear_sync_pipeline import LinearSyncPipeline
import os

# 1. Set your OpenAI API Key
os.environ["OPENAI_API_KEY"] = "sk-your-openai-api-key"

# 2. Initialize Model
model = OpenAIModel(
    api_key=os.environ["OPENAI_API_KEY"],
    parameters={
        "model": "${config?.model || "gpt-4o"}",
        "temperature": ${config?.temperature || 0.3}
    }
)

# 3. Create Lyzr Automata Agent
agent = Agent(
    prompt="""${config?.instruction || "You are a helpful assistant."}""",
    role="${config?.name || "Assistant"}"
)

# 4. Create a Task for the Agent
task = Task(
    name="Respond to User Query",
    agent=agent,
    model=model,
    instructions="Respond to the user's query: 'Hello, agent!'"
)

# 5. Run the Pipeline
pipeline = LinearSyncPipeline(
    name="Chat Pipeline",
    completion_message="Task Completed",
    tasks=[task]
)

if __name__ == "__main__":
    result = pipeline.run()
    print(result)`;

  const displaySdkCode = tutorialCode || sdkCode;

  const getCode = () => {
    switch(activeTab) {
      case "python": return pythonCode;
      case "sdk": return displaySdkCode;
      default: return "";
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#374151" }}>
          <FileCode size={14} color="#7c3aed" />
          <span>Integration Code</span>
        </div>
        <button
          onClick={copyToClipboard}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: "700", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151", borderRadius: "6px", cursor: "pointer" }}
        >
          {copied ? (
            <>
              <Check size={12} color="#059669" />
              <span style={{ color: "#059669" }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      <div style={{ display: "flex", backgroundColor: "#f8fafc", padding: "8px 16px", gap: "8px", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>
        <button
          onClick={() => setActiveTab("python")}
          style={{ 
            display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "12px", fontWeight: "700", borderRadius: "6px", cursor: "pointer",
            backgroundColor: activeTab === "python" ? "#7c3aed" : "transparent", color: activeTab === "python" ? "#ffffff" : "#374151", border: "none"
          }}
        >
          <Code size={12} /> Python
        </button>
        <button
          onClick={() => setActiveTab("sdk")}
          style={{ 
            display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", fontSize: "12px", fontWeight: "700", borderRadius: "6px", cursor: "pointer",
            backgroundColor: activeTab === "sdk" ? "#7c3aed" : "transparent", color: activeTab === "sdk" ? "#ffffff" : "#374151", border: "none"
          }}
        >
          <Layers size={12} /> Lyzr SDK
        </button>
      </div>

      <div style={{ flex: 1, padding: "16px", backgroundColor: "#111827", overflowY: "auto", fontSize: "12px", lineHeight: "20px", color: "#f8fafc" }}>
        <pre style={{ margin: 0, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <code>
            {activeTab === "python" && pythonCode}
            {activeTab === "sdk" && displaySdkCode}
          </code>
        </pre>
      </div>
    </div>
  );
}
