"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Users, Activity, CheckCircle2, Copy } from "lucide-react";
import MarkdownText from "@/components/ui/MarkdownText";

export default function WorkspaceSandbox({ workspace }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, executionLog]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setExecutionLog([]);
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("lyzr_auth_token");
      const response = await fetch("http://localhost:4000/api/run-workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          task: userMessage,
          agentIds: workspace.agents,
          workspaceName: workspace.name
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute workspace task");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let finalResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "agent_start") {
                setExecutionLog(prev => [...prev, { agent: parsed.agentId, status: 'running' }]);
              } else if (parsed.type === "agent_done") {
                setExecutionLog(prev => 
                  prev.map(log => log.agent === parsed.agentId ? { ...log, status: 'done', result: parsed.result } : log)
                );
              } else if (parsed.type === "final_result") {
                finalResult = parsed.result;
                setMessages(prev => [...prev, { role: "assistant", content: finalResult }]);
              } else if (parsed.type === "error") {
                setMessages(prev => [...prev, { role: "assistant", content: `Error: ${parsed.message}` }]);
              }
            } catch (err) {
              console.error("Error parsing stream data", err);
            }
          }
        }
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, an error occurred while executing the workspace pipeline." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] border-b border-[#e5e7eb]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center text-[#059669]">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111827]">{workspace.name} Workspace</h2>
            <p className="text-xs text-[#6b7280]">{workspace.agents.length} Agents Linked (Sequential Pipeline)</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#9ca3af] mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-2">Workspace Sandbox</h3>
            <p className="text-sm text-[#6b7280] max-w-sm leading-relaxed">
              Give a complex task to this workspace. The task will be passed sequentially to each agent in the team.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div 
                  className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-[#111827] text-white rounded-br-sm" 
                      : "bg-[#f8fafc] text-[#111827] border border-[#e5e7eb] rounded-bl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <MarkdownText text={msg.content} />
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex flex-col items-start gap-2 max-w-[85%]">
                <div className="px-4 py-3 rounded-2xl bg-[#f8fafc] text-[#111827] border border-[#e5e7eb] rounded-bl-sm w-full">
                  <div className="text-xs font-bold text-[#374151] mb-2 border-b border-[#e5e7eb] pb-2 uppercase tracking-wider">
                    Pipeline Execution
                  </div>
                  <div className="flex flex-col gap-2">
                    {workspace.agents.map((agentId, idx) => {
                      const log = executionLog.find(l => l.agent === agentId);
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {log?.status === 'done' ? (
                            <CheckCircle2 size={14} className="text-[#059669]" />
                          ) : log?.status === 'running' ? (
                            <Activity size={14} className="text-[#7c3aed] animate-pulse" />
                          ) : (
                            <div className="w-[14px] h-[14px] rounded-full border-2 border-[#e5e7eb]"></div>
                          )}
                          <span className={log?.status === 'running' ? "text-[#111827] font-semibold" : "text-[#6b7280]"}>
                            Agent {idx + 1} ({agentId.substring(0,6)}...)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 bg-white border-t border-[#e5e7eb]">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isProcessing}
            placeholder={isProcessing ? "Team is working..." : "Assign a task to the team..."}
            className="w-full pl-4 pr-12 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="absolute right-2 p-2 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#d1d5db] text-white rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
