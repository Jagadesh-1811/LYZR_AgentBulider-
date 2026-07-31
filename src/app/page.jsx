"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Code, Terminal, Activity, CheckCircle2 } from "lucide-react";
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
      const response = await fetch("http://localhost:4000/api/deploy-agent", {
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
      <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif", display: "flex", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: "1024px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => setAppState("DASHBOARD")}
              style={{ background: "transparent", border: "none", color: "#374151", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", textTransform: "uppercase" }}
            >
            ← Back to Dashboard
            </button>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#374151", textTransform: "uppercase" }}>
              Workspace: <span style={{ color: "#059669" }}>{activeWorkspace?.name || "Team"}</span>
            </div>
          </div>
          <WorkspaceSandbox workspace={activeWorkspace} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", fontFamily: "Inter, sans-serif", display: "flex", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: "1024px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Header Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => setAppState("DASHBOARD")}
            style={{ background: "transparent", border: "none", color: "#374151", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", textTransform: "uppercase" }}
          >
          ← Continue
          </button>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#374151", textTransform: "uppercase" }}>
            Editing: <span style={{ color: "#7c3aed" }}>{parsedConfig?.name || "New Agent"}</span>
          </div>
        </div>

        {/* Stepper Progress */}
        <nav style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "10px", display: "flex", justifyContent: "space-between", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderRadius: "8px",
                  backgroundColor: currentStep === step.id ? "#f8fafc" : "transparent",
                  border: currentStep === step.id ? "1px solid #ddd6fe" : "1px solid transparent",
                }}
              >
                <span style={{ 
                  display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", 
                  fontSize: "10px", fontWeight: "700", 
                  backgroundColor: currentStep === step.id ? "#7c3aed" : "#f3f4f6", 
                  color: currentStep === step.id ? "#ffffff" : "#374151" 
                }}>
                  {step.id}
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: currentStep === step.id ? "#7c3aed" : "#374151" }}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && <ChevronRight size={16} color="#e5e7eb" style={{ margin: "0 8px" }} />}
            </div>
          ))}
        </nav>

        {/* Step Content */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
          {currentStep === 1 && (
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
                  const response = await fetch("http://localhost:4000/api/deploy-agent", {
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
          )}

          {currentStep === 2 && (
            <div style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f3f4f6", paddingBottom: "12px", marginBottom: "24px" }}>
                <CheckCircle2 size={24} color="#059669" />
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>
                  Agent Operational
                </h2>
                <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: "700", color: "#7c3aed", backgroundColor: "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: "1px solid #ddd6fe" }}>
                  ID: {deployedAgentId}
                </span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                <div style={{ height: "600px" }}>
                  <CodeExporter config={parsedConfig || {}} tutorialCode={tutorialCode} />
                </div>
                <div style={{ height: "600px" }}>
                  <AgentSandbox config={parsedConfig || {}} user={user} authToken={authToken} />
                </div>
              </div>

              {/* Deploy Action Row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>Ship your agent to Lyzr Cloud</span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>Agent ID: <code style={{ fontFamily: "monospace", color: "#7c3aed", backgroundColor: "#f3f0ff", padding: "2px 6px", borderRadius: "4px" }}>{deployedAgentId}</code></span>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(deployedAgentId || "");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", fontSize: "13px", fontWeight: "600", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#374151", borderRadius: "8px", cursor: "pointer" }}
                  >
                     Copy Agent ID
                  </button>
                  <button
                    onClick={() => window.open("https://studio.lyzr.ai", "_blank")}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 20px", fontSize: "13px", fontWeight: "700", backgroundColor: "#7c3aed", border: "none", color: "#ffffff", borderRadius: "8px", cursor: "pointer", boxShadow: "0 2px 8px rgba(124,58,237,0.3)" }}
                  >
                    Deploy to Website
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
