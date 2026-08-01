"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Code, Terminal, Activity, CheckCircle2, Link } from "lucide-react";
import CodeExporter from "@/components/CodeExporter";
import DeveloperInsights from "@/components/DeveloperInsights";
import AgentSandbox from "@/components/AgentSandbox";
import WorkspaceSandbox from "@/components/WorkspaceSandbox";
import LoginScreen from "@/components/LoginScreen";
import TemplateSelector from "@/components/TemplateSelector";
import TemplateBrowser from "@/components/TemplateBrowser";
import { HeroSection } from "@/components/blocks/hero-section";
import { DeveloperTutorial } from "@/components/tutorial/DeveloperTutorial";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function SingleAgentSetup() {
  const [appState, setAppState] = useState("LANDING");
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [rawCodeConfig, setRawCodeConfig] = useState("");
  const [parsedConfig, setParsedConfig] = useState(null);
  const [tutorialCode, setTutorialCode] = useState(null);
  const [configError, setConfigError] = useState("");
  const [editorMode, setEditorMode] = useState("scratch");
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAgentId, setDeployedAgentId] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  const defaultScratchConfig = {
    name: "My Custom Agent",
    description: "A blank canvas agent",
    model: "gemini-2.5-pro",
    temperature: 0.3,
    instruction: "You are a helpful assistant.",
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("lyzr_auth_token");
    const savedUser = localStorage.getItem("lyzr_auth_user");
    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Don't auto-set appState to DASHBOARD here so the LANDING page is always shown first
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
    localStorage.setItem("lyzr_auth_token", token);
    localStorage.setItem("lyzr_auth_user", JSON.stringify(userData));
    setAppState("DASHBOARD");
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("lyzr_auth_token");
    localStorage.removeItem("lyzr_auth_user");
    setAppState("LOGIN");
  };

  const startFromScratch = () => {
    setRawCodeConfig(JSON.stringify(defaultScratchConfig, null, 2));
    setEditorMode("scratch");
    setAppState("EDITOR");
    setCurrentStep(1);
    setDeployedAgentId("");
  };

  const startFromTemplate = (templateConfig) => {
    setRawCodeConfig(JSON.stringify(templateConfig, null, 2));
    setEditorMode("template");
    setAppState("EDITOR");
    setCurrentStep(1);
    setDeployedAgentId("");
  };

  const openExistingAgent = (agentData) => {
    // Build config dynamically — only include fields that actually exist in Firestore
    const config = agentData.config || Object.fromEntries(
      Object.entries({
        name: agentData.agentName,
        model: agentData.model,
        instruction: agentData.instruction,
        temperature: agentData.temperature,
        description: agentData.description,
        ragUrl: agentData.ragUrl,
      }).filter(([_, v]) => v !== undefined && v !== null)
    );
    const fullConfig = { ...config, agentId: agentData.agentId };
    setRawCodeConfig(JSON.stringify(fullConfig, null, 2));
    setParsedConfig(fullConfig);
    setDeployedAgentId(agentData.agentId);
    setTutorialCode(null);
    setAppState("EDITOR");
    setCurrentStep(2);
  };

  useEffect(() => {
    if (!rawCodeConfig || appState !== "EDITOR" || currentStep === 2) return;
    try {
      const parsed = JSON.parse(rawCodeConfig);
      setParsedConfig(parsed);
      setConfigError("");
    } catch (e) {
      setConfigError("Invalid JSON configuration. Please check your syntax.");
    }
  }, [rawCodeConfig, appState, currentStep]);

  const deployAgent = async () => {
    if (configError || !parsedConfig || !user) return;
    
    setIsDeploying(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${baseUrl}/api/deploy-agent`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(parsedConfig)
      });
      
      const data = await response.json();
      if (data.success && data.agentId) {
        
        // Save to Firestore
        try {
          await addDoc(collection(db, "deployments"), {
            userId: user.email,
            agentId: data.agentId,
            config: parsedConfig,
            status: "Operational",
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Failed to save to Firestore:", dbError);
        }

        setDeployedAgentId(data.agentId);
        // Inject the agentId into parsedConfig so Sandbox/Exporter can use it
        setParsedConfig(prev => ({ ...prev, agentId: data.agentId }));
        setCurrentStep(2);
      } else {
        setConfigError(data.error || "Failed to deploy agent");
      }
    } catch (error) {
      setConfigError("Network error: Could not reach deployment server.");
    } finally {
      setIsDeploying(false);
    }
  };

  const steps = [
    { id: 1, title: "Configuration" },
    { id: 2, title: "Deployment" }
  ];

  if (appState === "LANDING") {
    return <HeroSection onStart={() => setAppState(authToken ? "DASHBOARD" : "LOGIN")} />;
  }

  if (appState === "LOGIN") return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  
  if (appState === "DASHBOARD") {
    return (
      <TemplateSelector 
        user={user}
        onSelectScratch={startFromScratch} 
        onSelectTemplate={startFromTemplate} 
        onSelectExistingAgent={openExistingAgent}
        onSelectWorkspace={(ws) => {
          setActiveWorkspace(ws);
          setAppState("WORKSPACE_SANDBOX");
        }}
        onBrowseTemplates={() => setAppState("TEMPLATE_BROWSER")}
        onLogout={handleLogout}
      />
    );
  }

  if (appState === "TEMPLATE_BROWSER") {
    return (
      <TemplateBrowser
        onSelectTemplate={(config) => startFromTemplate(config)}
        onBack={() => setAppState("DASHBOARD")}
      />
    );
  }

  if (appState === "WORKSPACE_SANDBOX") {
    return (
      <div className="bg-slate-50 min-h-screen font-sans flex justify-center p-8">
        <div className="w-full max-w-7xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAppState("DASHBOARD")}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold text-xs uppercase tracking-wide transition-colors"
            >
            ← Back to Dashboard
            </button>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Workspace: <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{activeWorkspace?.name || "Team"}</span>
            </div>
          </div>
          <WorkspaceSandbox workspace={activeWorkspace} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 h-screen font-sans flex flex-col p-6 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-5 flex-1 min-h-0">

        {/* Header Navigation */}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setAppState("DASHBOARD")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 font-bold text-xs uppercase tracking-wide transition-colors"
          >
          ← Continue
          </button>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Editing: <span className="text-violet-600 bg-violet-50 px-2 py-1 rounded-md">{parsedConfig?.name || "New Agent"}</span>
          </div>
        </div>

        {/* Stepper Progress */}
        <nav className="bg-white border border-gray-200 rounded-2xl p-2.5 flex justify-between shadow-sm flex-shrink-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2 flex-1 justify-center">
              <div className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-200 ${currentStep === step.id ? "bg-violet-50 border border-violet-100" : "border border-transparent"}`}>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${currentStep === step.id ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30" : "bg-gray-100 text-gray-400"}`}>
                  {step.id}
                </span>
                <span className={`text-sm font-bold ${currentStep === step.id ? "text-violet-700" : "text-gray-500"}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && <ChevronRight size={18} className="text-gray-300 mx-4" />}
            </div>
          ))}
        </nav>

        {/* Step Content */}
        <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {currentStep === 1 && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <DeveloperTutorial 
              mode={editorMode}
              templateConfig={parsedConfig}
              onCancel={() => setAppState("DASHBOARD")}
              onComplete={async (code, configValues) => {
                setTutorialCode(code);
                
                // Construct payload dynamically — only include fields that were set
                const payload = {
                    name: configValues?.agentName || "Tutorial Agent",
                    description: `Built via Automata SDK tutorial — ${configValues?.role || 'Agent'}`,
                    instruction: configValues?.persona || "Helpful assistant",
                    model: configValues?.modelName || "gpt-4o",
                    temperature: parseFloat(configValues?.temperature || "0.2"),
                    ...(configValues?.enableRag && configValues?.ragUrl ? { ragUrl: configValues.ragUrl } : {}),
                    ...(configValues?.enableRag && configValues?.vectorStoreProvider ? { vectorStoreProvider: configValues.vectorStoreProvider } : {}),
                    ...(configValues?.enableRag && configValues?.embeddingModel ? { embeddingModel: configValues.embeddingModel } : {}),
                    ...(configValues?.enableDatabase ? { 
                      enableDatabase: true, 
                      dbConnectionString: configValues.dbConnectionString 
                    } : {}),
                };

                setIsDeploying(true);
                try {
                  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
                  const response = await fetch(`${baseUrl}/api/deploy-agent`, {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${authToken}`
                    },
                    body: JSON.stringify(payload)
                  });
                  const data = await response.json();
                  const finalAgentId = data.success && data.agentId ? data.agentId : "deploy-failed";
                  
                  setDeployedAgentId(finalAgentId);
                  setParsedConfig(prev => ({ ...prev, agentId: finalAgentId, ...payload }));

                  // Save to Firestore — only include fields that exist
                  try {
                    const firestoreDoc = {
                      userId: user?.email || "anonymous",
                      agentId: finalAgentId,
                      agentName: payload.name,
                      model: payload.model,
                      instruction: payload.instruction,
                      source: "tutorial",
                      creationMode: editorMode,
                      templateCategory: parsedConfig?.category?.label || null,
                      status: finalAgentId !== "deploy-failed" ? "Operational" : "Failed",
                      createdAt: serverTimestamp(),
                      ...(payload.ragUrl ? { ragUrl: payload.ragUrl } : {}),
                      ...(payload.vectorStoreProvider ? { vectorStoreProvider: payload.vectorStoreProvider } : {}),
                      ...(payload.embeddingModel ? { embeddingModel: payload.embeddingModel } : {}),
                      ...(payload.enableDatabase ? { 
                        enableDatabase: payload.enableDatabase,
                        dbConnectionString: payload.dbConnectionString
                      } : {}),
                    };
                    await addDoc(collection(db, "deployments"), firestoreDoc);
                  } catch (dbError) {
                    console.error("Failed to save to Firestore:", dbError);
                  }

                } catch (e) {
                  setDeployedAgentId("deploy-failed");
                  setParsedConfig(prev => ({ ...prev, agentId: "deploy-failed", ...payload }));
                }
                
                setIsDeploying(false);
                setCurrentStep(2);
              }}
            />
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex-1 min-h-0 flex flex-col gap-5 p-6 bg-slate-50/30">
              {/* Success header */}
              <div className="flex items-center justify-between px-6 py-4 bg-white border border-emerald-100 shadow-sm rounded-xl shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Agent Operational</h2>
                    <p className="text-sm text-gray-500">Your agent is live in Lyzr Cloud</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Agent ID</span>
                  <span className="font-mono text-sm font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">{deployedAgentId}</span>
                </div>
              </div>

              {/* Two-pane split: Integration Code | Live Chat */}
              <div className="flex-1 min-h-0 flex gap-5">
                <div className="flex-1 min-w-0 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <CodeExporter config={parsedConfig || {}} tutorialCode={tutorialCode} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <AgentSandbox config={parsedConfig || {}} user={user} authToken={authToken} />
                </div>
              </div>

              {/* Deploy Action Row */}
              <div className="flex items-center justify-between px-6 py-4 bg-white border border-gray-200 rounded-xl shrink-0 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Ship your agent to Lyzr Cloud</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Use the snippet in CodeExporter or launch the live URL.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const baseUrl = process.env.NEXT_PUBLIC_SHARE_URL || window.location.origin;
                      const url = `${baseUrl}/share/agent/${deployedAgentId}`;
                      navigator.clipboard.writeText(url);
                      alert("Public Agent Link Copied!\n" + url);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-white text-emerald-700 border border-emerald-200 rounded-lg shadow-sm hover:bg-emerald-50 transition-colors"
                  >
                    <Link size={16} />
                    Share Public Link
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(deployedAgentId || "")}
                    className="px-5 py-2.5 text-sm font-bold bg-white text-gray-700 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                  >
                     Copy Agent ID
                  </button>
                  <button
                    onClick={() => window.open("https://studio.lyzr.ai", "_blank")}
                    className="px-5 py-2.5 text-sm font-bold bg-violet-600 text-white rounded-lg shadow-sm hover:bg-violet-700 hover:shadow-md transition-all"
                  >
                    Manage Deployments
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
