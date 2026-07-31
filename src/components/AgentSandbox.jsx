"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, RefreshCw, Send, Loader2, Bot, User, Database, Link, Type, Check, X, FileUp } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function AgentSandbox({ config = {}, user, authToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const endOfMessagesRef = useRef(null);

  // RAG States
  const [ragId, setRagId] = useState(null);
  const [showRagPanel, setShowRagPanel] = useState(false);
  const [ragType, setRagType] = useState("url"); // "url" or "text" or "file"
  const [ragInput, setRagInput] = useState("");
  const [ragFile, setRagFile] = useState(null);
  const [isTrainingRag, setIsTrainingRag] = useState(false);

  // Firestore Document ID will be uniquely tied to User Email + Agent ID
  const sessionId = user?.email && config.agentId ? `${user.email}_${config.agentId}` : null;

  useEffect(() => {
    async function loadChatHistory() {
      if (!sessionId) {
        setMessages([
          { type: "system", text: `Connected to ${config.name || "Agent"}.` },
          { type: "agent", text: "Hello! How can I help you today?" }
        ]);
        return;
      }

      const chatRef = doc(db, "chatSessions", sessionId);
      const chatSnap = await getDoc(chatRef);

      if (chatSnap.exists()) {
        setMessages(chatSnap.data().messages || []);
      } else {
        const initialMessages = [
          { type: "system", text: `Connected to ${config.name || "Agent"}.` },
          { type: "agent", text: "Hello! How can I help you today?" }
        ];
        setMessages(initialMessages);
        await setDoc(chatRef, {
          userId: user.email,
          agentId: config.agentId,
          messages: initialMessages
        });
      }
    }

    loadChatHistory();
  }, [sessionId, config.agentId, config.name, user?.email]);

  const resetChat = async () => {
    const initialMessages = [
      { type: "system", text: `Connected to ${config.name || "Agent"}.` },
      { type: "agent", text: "Hello! How can I help you today?" }
    ];
    setMessages(initialMessages);
    
    if (sessionId) {
      try {
        const chatRef = doc(db, "chatSessions", sessionId);
        await updateDoc(chatRef, {
          messages: initialMessages
        });
      } catch (err) {
        console.error("Failed to reset chat in DB", err);
      }
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput("");
    setIsProcessing(true);

    const newUserMsg = { type: "user", text: userMessage };
    setMessages((prev) => [...prev, newUserMsg]);

    // Save user message to Firestore
    if (sessionId) {
      await updateDoc(doc(db, "chatSessions", sessionId), {
        messages: arrayUnion(newUserMsg)
      });
    }

    try {
      // Add empty agent message placeholder
      setMessages((prev) => [...prev, { type: "agent", text: "" }]);
      let streamedResponse = "";

      const response = await fetch("http://localhost:4000/api/stream-agent", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          config: config,
          query: userMessage,
          rag_id: ragId,
          sessionId: sessionId || null
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Unknown error occurred.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line
        
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
             const dataStr = line.slice(line.indexOf('data:') + 5).trim();
             if (dataStr === '[DONE]') continue;
             if (!dataStr) continue;
             
             try {
                const dataObj = JSON.parse(dataStr);
                const textChunk = dataObj.response || dataObj.choices?.[0]?.delta?.content || dataStr;
                streamedResponse += typeof textChunk === 'string' ? textChunk : JSON.stringify(textChunk);
             } catch (e) {
                // Treat as raw text or fallback
                streamedResponse += dataStr.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
             }
          } else if (line.trim().length > 0 && !line.includes(':')) {
             // In case Lyzr sends raw text chunks without data: prefix
             streamedResponse += line.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
          }
        }
        
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = streamedResponse;
          return newMessages;
        });
      }

      // Save final agent message to Firestore
      if (sessionId) {
        await updateDoc(doc(db, "chatSessions", sessionId), {
          messages: arrayUnion({ type: "agent", text: streamedResponse })
        });
      }
    } catch (error) {
      setMessages((prev) => [...prev, { type: "error", text: error.message }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = async () => {
    const defaultMessages = [
      { type: "system", text: "Chat history cleared." },
      { type: "agent", text: "Hello! How can I help you today?" }
    ];
    setMessages(defaultMessages);

    if (sessionId) {
      await updateDoc(doc(db, "chatSessions", sessionId), {
        messages: defaultMessages
      });
    }
  };

  const handleTrainKnowledge = async () => {
    if ((ragType !== 'file' && !ragInput.trim()) || (ragType === 'file' && !ragFile)) return;
    setIsTrainingRag(true);

    try {
      let body, headers;
      if (ragType === 'file') {
        body = new FormData();
        body.append('type', 'file');
        body.append('file', ragFile);
        body.append('vectorStoreProvider', config.vectorStoreProvider || 'pinecone');
        body.append('embeddingModel', config.embeddingModel || 'text-embedding-3-small');
        headers = { "Authorization": `Bearer ${authToken}` }; // browser handles multipart boundary
      } else {
        body = JSON.stringify({ 
          type: ragType, 
          content: ragInput,
          vectorStoreProvider: config.vectorStoreProvider || 'pinecone',
          embeddingModel: config.embeddingModel || 'text-embedding-3-small'
        });
        headers = { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        };
      }

      const response = await fetch("http://localhost:4000/api/upload-knowledge", {
        method: "POST",
        headers,
        body
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRagId(data.rag_id);
        setShowRagPanel(false);
        setRagInput("");
      } else {
        alert("Failed to train knowledge base: " + data.error);
      }
    } catch (err) {
      alert("Error uploading knowledge.");
    } finally {
      setIsTrainingRag(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", backgroundColor: "#f3e8ff", borderRadius: "10px", color: "#7c3aed" }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#111827", lineHeight: "1.2" }}>{config.name || "Agent Chat"}</h2>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#6b7280" }}>{config.model || "Lyzr AI"} • ID: {config.agentId || "Preview"}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setShowRagPanel(!showRagPanel)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid #e5e7eb", backgroundColor: ragId ? "#ecfdf5" : "#ffffff", color: ragId ? "#10b981" : "#4b5563", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "all 150ms" }}
          >
            <Database size={14} />
            {ragId ? "KB Attached" : "Add Knowledge"}
          </button>
          <button 
            onClick={resetChat}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid #e5e7eb", backgroundColor: "#ffffff", color: "#4b5563", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer", transition: "all 150ms" }}
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* RAG Setup Panel */}
      {showRagPanel && (
        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#111827" }}>Train Knowledge Base (Lyzr RAG)</h3>
            <button onClick={() => setShowRagPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={16}/></button>
          </div>
          
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              onClick={() => setRagType("url")}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", border: "none", cursor: "pointer", backgroundColor: ragType === "url" ? "#ede9fe" : "#f3f4f6", color: ragType === "url" ? "#7c3aed" : "#6b7280" }}
            >
              <Link size={14} /> URL
            </button>
            <button 
              onClick={() => setRagType("text")}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", border: "none", cursor: "pointer", backgroundColor: ragType === "text" ? "#ede9fe" : "#f3f4f6", color: ragType === "text" ? "#7c3aed" : "#6b7280" }}
            >
              <Type size={14} /> Raw Text
            </button>
            <button 
              onClick={() => setRagType("file")}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", border: "none", cursor: "pointer", backgroundColor: ragType === "file" ? "#ede9fe" : "#f3f4f6", color: ragType === "file" ? "#7c3aed" : "#6b7280" }}
            >
              <FileUp size={14} /> Upload File
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {ragType === "url" ? (
              <input 
                type="url" 
                placeholder="https://example.com/docs" 
                value={ragInput} onChange={(e) => setRagInput(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px" }}
              />
            ) : ragType === "text" ? (
              <textarea 
                placeholder="Paste knowledge text here..." 
                value={ragInput} onChange={(e) => setRagInput(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px", minHeight: "60px", resize: "vertical" }}
              />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px", backgroundColor: "#ffffff" }}>
                <input 
                  type="file" 
                  accept=".txt,.pdf"
                  onChange={(e) => setRagFile(e.target.files[0] || null)}
                  style={{ width: "100%" }}
                />
              </div>
            )}
            <button 
              onClick={handleTrainKnowledge}
              disabled={isTrainingRag || (ragType !== 'file' && !ragInput.trim()) || (ragType === 'file' && !ragFile)}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 16px", backgroundColor: isTrainingRag ? "#d1d5db" : "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: isTrainingRag ? "not-allowed" : "pointer" }}
            >
              {isTrainingRag ? <Loader2 size={14} className="lucide-spin" style={{ animation: "spin 2s linear infinite" }} /> : <Database size={14} />}
              Train
            </button>
          </div>
          
          {ragId && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#10b981", backgroundColor: "#ecfdf5", padding: "8px", borderRadius: "6px" }}>
              <Check size={14} /> RAG Knowledge Attached successfully! (ID: {ragId})
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div style={{ flex: 1, padding: "20px 16px", backgroundColor: "#ffffff", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.map((msg, idx) => {
          if (msg.type === "system") {
            return (
              <div key={idx} style={{ textAlign: "center", margin: "8px 0" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", backgroundColor: "#f9fafb", padding: "4px 8px", borderRadius: "12px" }}>
                  {msg.text}
                </span>
              </div>
            );
          }
          
          if (msg.type === "error") {
            return (
              <div key={idx} style={{ textAlign: "center", margin: "8px 0" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", backgroundColor: "#fef2f2", padding: "6px 10px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  Error: {msg.text}
                </span>
              </div>
            );
          }

          const isUser = msg.type === "user";
          return (
            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-end", alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "85%" }}>
              {!isUser && (
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", backgroundColor: "#f3e8ff", borderRadius: "50%", color: "#7c3aed" }}>
                  <Bot size={16} />
                </div>
              )}
              
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ 
                  padding: "12px 16px", fontSize: "13px", lineHeight: "1.5", color: isUser ? "#ffffff" : "#111827",
                  backgroundColor: isUser ? "#7c3aed" : "#f3f4f6", 
                  borderRadius: "16px",
                  borderBottomRightRadius: isUser ? "4px" : "16px",
                  borderBottomLeftRadius: !isUser ? "4px" : "16px",
                  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)"
                }}>
                  {msg.text}
                </div>
                {!isUser && msg.tokens && (
                  <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#6b7280", paddingLeft: "8px" }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#10b981" }}></div>
                    {msg.tokens.total_tokens || 0} tokens
                  </div>
                )}
              </div>

              {isUser && (
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", backgroundColor: "#e5e7eb", borderRadius: "50%", color: "#4b5563" }}>
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}
        
        {isProcessing && (
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", alignSelf: "flex-start", maxWidth: "85%" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", backgroundColor: "#f3e8ff", borderRadius: "50%", color: "#7c3aed" }}>
              <Bot size={16} />
            </div>
            <div style={{ padding: "12px 16px", backgroundColor: "#f3f4f6", borderRadius: "16px", borderBottomLeftRadius: "4px", color: "#6b7280", display: "flex", alignItems: "center", gap: "8px" }}>
              <Loader2 size={14} className="lucide-spin" style={{ animation: "spin 2s linear infinite" }} />
              <span style={{ fontSize: "12px", fontStyle: "italic" }}>Thinking...</span>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleQuery} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", borderTop: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your agent..."
          disabled={isProcessing}
          style={{ flex: 1, backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "24px", padding: "10px 16px", fontSize: "13px", color: "#111827", outline: "none", transition: "border 150ms" }}
          onFocus={(e) => { e.target.style.borderColor = "#ddd6fe"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; }}
        />
        <button 
          type="submit"
          disabled={isProcessing || !input.trim()}
          style={{ 
            display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px",
            color: "#ffffff", backgroundColor: (isProcessing || !input.trim()) ? "#d1d5db" : "#7c3aed", 
            borderRadius: "50%", border: "none", cursor: (isProcessing || !input.trim()) ? "not-allowed" : "pointer",
            transition: "all 150ms"
          }}
          onMouseOver={(e) => !isProcessing && input.trim() && (e.currentTarget.style.backgroundColor = "#6d28d9")}
          onMouseOut={(e) => !isProcessing && input.trim() && (e.currentTarget.style.backgroundColor = "#7c3aed")}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
