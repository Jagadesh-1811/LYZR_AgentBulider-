"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Users, Activity, CheckCircle2, Copy, Check, Terminal, Code2, PencilLine, RotateCcw } from "lucide-react";
import MarkdownText from "@/components/ui/MarkdownText";

/* ------------------------------------------------------------------ */
/*  Helpers for the DEV CONSOLE                                        */
/* ------------------------------------------------------------------ */

const fmtTime = () => {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, "0")}`;
};

const preview = (s, max = 110) => {
  if (!s) return "";
  const one = String(s).replace(/\s+/g, " ").trim();
  return one.length > max ? `${one.slice(0, max)}…` : one;
};

const tokensOf = (tokens) =>
  tokens?.total_tokens ?? (typeof tokens === "number" ? tokens : "?");

/**
 * Builds the pipeline code for this workspace run.
 * Returns an array of { text, cls } lines that feed the editable
 * PIPELINE CODE textarea (and the copy-to-clipboard / chat summary).
 */
function buildCodeLines(workspace, task, executionLog, finalResult) {
  const agents = workspace?.agents || [];
  const esc = (s) => JSON.stringify(String(s ?? ""));
  const lines = [];
  const code = (text) => lines.push({ text, cls: "" });
  const dim = (text) => lines.push({ text, cls: "text-[#6b7280]" });
  const green = (text) => lines.push({ text, cls: "text-[#059669]" });
  const amber = (text) => lines.push({ text, cls: "text-[#b45309]" });

  dim(`# ──────────────────────────────────────────────────────────────`);
  dim(`#  PIPELINE   ·   ${workspace?.name || "Untitled Workspace"}`);
  dim(`#  ${agents.length} agent(s) · sequential orchestrator · Lyzr Cloud v3`);
  dim(`#  Exact mirror of the backend pipeline (Express + axios → Lyzr REST).`);
  dim(`#  DYNAMIC values — not hardcoded (edit the CONFIG block below):`);
  dim(`#    AGENT_IDS    → auto-filled from this workspace`);
  dim(`#    TASK         → auto-filled from your chat message`);
  dim(`#    LYZR_API_KEY → read from your machine's env`);
  dim(`#    session_id   → generated fresh on every run`);
  dim(`# ──────────────────────────────────────────────────────────────`);
  code(``);
  code(`import os`);
  code(`import time`);
  code(`import requests`);
  code(``);
  code(`# ── CONFIG · dynamic, auto-filled from the workspace ───────────`);
  code(`LYZR_API_KEY = os.getenv("LYZR_API_KEY")  # ← your Lyzr Studio API key`);
  code(`BASE_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"`);
  code(`USER_ID = "default_user"`);
  code(`# Agent IDs below come from the workspace you selected.`);
  code(`# Edit the list to add / remove agents — the loop adapts automatically.`);
  code(`AGENT_IDS = ${JSON.stringify(agents)}`);
  code(`TASK = ${task ? esc(task) : 'input("Enter task for the team: ").strip()'}`);
  code(``);
  code(`session_id = f"workspace_{int(time.time() * 1000)}"  # unique per run`);
  code(``);
  code(`context = TASK`);
  code(`results = []`);
  code(`tokens = []`);
  code(``);

  // Sequential pipeline — a dynamic loop that adapts to any number of agents.
  code(`# ── Sequential pipeline · one pass per agent in AGENT_IDS ──────`);
  code(`for i, agent_id in enumerate(AGENT_IDS):`);
  code(`    if i == 0:`);
  code(`        message = context  # raw task goes to the first agent`);
  code(`    else:`);
  code(`        message = f"Continue working on the following task with this context from the previous agent:\\n\\n{context}"`);
  code(`    payload = {`);
  code(`        "user_id": USER_ID,`);
  code(`        "agent_id": agent_id,`);
  code(`        "session_id": session_id,`);
  code(`        "message": message,`);
  code(`    }`);
  code(`    headers = {"x-api-key": LYZR_API_KEY, "Content-Type": "application/json"}`);
  code(``);
  code(`    print(f"[Agent {i + 1}] POST {BASE_URL}")`);
  code(`    response = requests.post(BASE_URL, json=payload, headers=headers)`);
  code(`    response.raise_for_status()`);
  code(`    data = response.json()`);
  code(`    context = data["response"]`);
  code(`    usage = data.get("usage") or {`);
  code(`        "prompt_tokens": len(message) // 4,`);
  code(`        "completion_tokens": len(context) // 4,`);
  code(`        "total_tokens": (len(message) + len(context)) // 4,`);
  code(`    }`);
  code(`    total = usage.get("total_tokens") or usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0)`);
  code(`    results.append(context)`);
  code(`    tokens.append(total)`);
  code(`    print(f"[Agent {i + 1}] ✓ {len(context)} chars out · {total} tokens")`);
  code(``);
  code(`print("")`);
  code(`print("=== FINAL RESULT ===")`);
  code(`print(context)`);
  code(`print(f"TOTAL · {sum(tokens)} tokens across {len(AGENT_IDS)} agent(s)")`);
  code(``);

  // What actually happened this run — appended as comments so the code stays dynamic.
  if (agents.length === 0) {
    dim(`# ⚠ No agents linked to this workspace yet.`);
    dim(`#   Add agents in Studio and re-open this workspace to generate the pipeline.`);
  } else if ((executionLog || []).some((l) => l.status === "running")) {
    amber(`# ● Pipeline is executing right now…`);
  } else {
    const doneLogs = (executionLog || []).filter((l) => l.status === "done");
    if (doneLogs.length > 0) {
      green(`# ── RUN RESULTS · ${doneLogs.length}/${agents.length} agent(s) completed ──`);
      doneLogs.forEach((log) => {
        green(`#   ✓ Agent ${(log.index ?? 0) + 1} (${log.agent}) · ${log.durationMs ?? "?"}ms · ${tokensOf(log.tokens)} tokens`);
        green(`#     output → ${preview(log.result)}`);
      });
      if (finalResult) {
        green(`#   ✓ Pipeline finished · final result passed back to the orchestrator`);
        green(`#     final output → ${preview(finalResult)}`);
      }
    }
  }

  return lines;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WorkspaceSandbox({ workspace = { name: "Team", agents: [] } }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionLog, setExecutionLog] = useState([]); // per-agent status + result
  const [traceEvents, setTraceEvents] = useState([]);    // ordered internal events
  const [lastTask, setLastTask] = useState(null);
  const [finalResult, setFinalResult] = useState("");
  const [activeTab, setActiveTab] = useState("code");    // "trace" | "code"
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editedCode, setEditedCode] = useState("");      // user-editable pipeline code

  const messagesEndRef = useRef(null);
  const traceEndRef = useRef(null);
  const logRef = useRef([]); // mirror of executionLog for building the exact code in chat
  const taskRef = useRef(null); // mirror of lastTask to avoid stale closures in the stream handler
  const codeDirty = useRef(false); // once the user edits, stop auto-syncing until Reset

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, executionLog]);

  useEffect(() => {
    traceEndRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [traceEvents]);

  const pushEvent = (entry) => setTraceEvents((prev) => [...prev, entry]);

  const handleStreamEvent = (data) => {
    if (data.type === "pipeline_start") {
      pushEvent({
        time: fmtTime(), kind: "pipeline_start",
        label: "PIPELINE START", cls: "text-[#7c3aed]",
        summary: `task=${preview(data.task, 42)} · agents=${data.agentCount} · session=${data.sessionId}`,
        details: JSON.stringify(data, null, 2),
      });
    } else if (data.type === "agent_start") {
      pushEvent({
        time: fmtTime(), kind: "agent_start",
        label: `AGENT ${(data.index ?? 0) + 1} START`, cls: "text-[#b45309]",
        summary: `${data.agentId} · POST /v3/inference/chat/`,
        details: JSON.stringify({ agentId: data.agentId, index: data.index, message: data.message }, null, 2),
      });
      const entry = { agent: data.agentId, index: data.index ?? 0, status: "running", message: data.message };
      setExecutionLog((prev) => [...prev, entry]);
      logRef.current = [...logRef.current, entry];
    } else if (data.type === "agent_done") {
      pushEvent({
        time: fmtTime(), kind: "agent_done",
        label: `AGENT ${(data.index ?? 0) + 1} DONE`, cls: "text-[#059669]",
        summary: `${data.agentId} · ${data.durationMs ?? "?"}ms · ${tokensOf(data.tokens)} tokens · ${String(data.result || "").length} chars out`,
        details: JSON.stringify({ agentId: data.agentId, index: data.index, durationMs: data.durationMs, tokens: data.tokens, result: data.result }, null, 2),
      });
      setExecutionLog((prev) =>
        prev.map((log) =>
          log.index === (data.index ?? 0)
            ? { ...log, status: "done", result: data.result, durationMs: data.durationMs, tokens: data.tokens }
            : log
        )
      );
      logRef.current = logRef.current.map((log) =>
        log.index === (data.index ?? 0)
          ? { ...log, status: "done", result: data.result, durationMs: data.durationMs, tokens: data.tokens }
          : log
      );
    } else if (data.type === "final_result") {
      setFinalResult(data.result);
      pushEvent({
        time: fmtTime(), kind: "final_result",
        label: "FINAL RESULT", cls: "text-[#1d4ed8]",
        summary: `${data.agentIds?.length || "?"} agents → orchestrator · total ${data.totalDurationMs}ms`,
        details: JSON.stringify({ result: data.result }, null, 2),
      });

      // Append the EXACT pipeline code that executed (identical to the Dev Console)
      // into the chat summary so the user sees the real Lyzr code after the run.
      const exactCode = buildCodeLines(workspace, taskRef.current, logRef.current, data.result)
        .map((l) => l.text)
        .join("\n")
        .replace(/```+/g, "`"); // guard: never let a fence-opening line escape the code block
      const runLogs = logRef.current;
      const tokenLines = runLogs
        .map((l) => {
          const t = l.tokens?.total_tokens ?? "?";
          const ms = l.durationMs != null ? `${(l.durationMs / 1000).toFixed(1)}s` : "?";
          return `- **Agent ${(l.index ?? 0) + 1}** (${String(l.agent).slice(0, 8)}…) · ${ms} · ${t} tokens`;
        })
        .join("\n");
      const totalTokens = runLogs.reduce((sum, l) => sum + (l.tokens?.total_tokens ?? 0), 0);
      const totalSecs = data.totalDurationMs != null ? `${(data.totalDurationMs / 1000).toFixed(1)}s` : "?";
      const runSummary =
        `\n\n**⚡ Run summary**\n${tokenLines}\n- **Total:** ${totalTokens} tokens · ${totalSecs}\n`;
      const summaryContent =
        `${data.result}\n\n---\n${runSummary}\n---\n\n### ⚙️ Exact pipeline code executed\n\n\`\`\`python\n${exactCode}\n\`\`\``;
      setMessages((prev) => [...prev, { role: "assistant", content: summaryContent }]);
    } else if (data.type === "error") {
      pushEvent({
        time: fmtTime(), kind: "error",
        label: "ERROR", cls: "text-[#dc2626]",
        summary: data.message || "Unknown error",
        details: JSON.stringify(data, null, 2),
      });
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setExecutionLog([]);
    setTraceEvents([]);
    setExpandedEvent(null);
    setFinalResult("");
    setLastTask(userMessage);
    logRef.current = [];
    taskRef.current = userMessage;
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
              handleStreamEvent(parsed); // also appends the final chat summary w/ exact code
              if (parsed.type === "error") {
                setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${parsed.message}` }]);
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

  const codeLines = buildCodeLines(workspace, lastTask, executionLog, finalResult);
  const codeText = codeLines.map((l) => l.text).join("\n");

  // Keep the editable buffer in sync with the generated code until the user edits it.
  useEffect(() => {
    if (!codeDirty.current) setEditedCode(codeText);
  }, [codeText]);

  const traceText = traceEvents
    .map((ev) => `[${ev.time}] ${ev.label}  ${ev.summary}`)
    .join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === "code" ? editedCode : traceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#f8fafc] border-b border-[#e5e7eb] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#059669]/10 border border-[#059669]/20 flex items-center justify-center text-[#059669]">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111827]">{workspace.name} Workspace</h2>
            <p className="text-xs text-[#6b7280]">
              {(workspace.agents || []).length} Agents Linked (Sequential Pipeline)
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#7c3aed] bg-white border border-[#ddd6fe] rounded-md px-2.5 py-1.5 uppercase">
          <Terminal size={11} />
          Dev Console
        </span>
      </div>

      {/* Split body: chat | dev console */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: Chat */}
        <div className="flex flex-col w-[56%] min-w-0 border-r border-[#e5e7eb]">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#9ca3af] mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-[#111827] mb-2">Workspace Sandbox</h3>
                <p className="text-sm text-[#6b7280] max-w-sm leading-relaxed">
                  Give a complex task to this workspace. The task will be passed sequentially to each agent
                  in the team — and every internal step is streamed to the Dev Console on the right.
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
                        {(workspace.agents || []).map((agentId, idx) => {
                          const log = executionLog.find((l) => l.agent === agentId);
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {log?.status === "done" ? (
                                <CheckCircle2 size={14} className="text-[#059669]" />
                              ) : log?.status === "running" ? (
                                <Activity size={14} className="text-[#7c3aed] animate-pulse" />
                              ) : (
                                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#e5e7eb]"></div>
                              )}
                              <span className={log?.status === "running" ? "text-[#111827] font-semibold" : "text-[#6b7280]"}>
                                Agent {idx + 1} ({agentId.substring(0, 6)}...)
                              </span>
                              {log?.status === "done" && log.durationMs != null && (
                                <span className="text-[10px] text-[#9ca3af] font-mono">{log.durationMs}ms</span>
                              )}
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

        {/* RIGHT: Dev Console */}
        <div className="flex flex-col w-[44%] min-w-0 bg-white">
          {/* Console header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8fafc] border-b border-[#e5e7eb] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Terminal size={12} className="text-[#7c3aed]" />
              <span className="text-[10px] font-bold tracking-widest text-[#6b7280]">DEV CONSOLE</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isProcessing ? "bg-[#059669] animate-pulse" : "bg-[#d1d5db]"
                }`}
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("trace")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                  activeTab === "trace" ? "bg-[#ede9fe] text-[#7c3aed]" : "text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                TRACE
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                  activeTab === "code" ? "bg-[#ede9fe] text-[#7c3aed]" : "text-[#6b7280] hover:text-[#111827]"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Code2 size={11} />
                  PIPELINE CODE
                </span>
              </button>
              <button
                onClick={handleCopy}
                className="ml-1 flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827] transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={11} className="text-[#059669]" /> : <Copy size={11} />}
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>

          {/* Console body */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white">
            {activeTab === "trace" ? (
              traceEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
                  <Terminal size={22} className="text-[#d1d5db] mb-3" />
                  <p className="text-[11px] text-[#6b7280] leading-relaxed max-w-[220px]">
                    No execution trace yet. Assign a task to the team and watch every internal
                    step stream in here — payloads, durations, tokens and outputs.
                  </p>
                </div>
              ) : (
                <div className="font-mono">
                  {traceEvents.map((ev, idx) => (
                    <div
                      key={idx}
                      onClick={() => setExpandedEvent(expandedEvent === idx ? null : idx)}
                      className="border-b border-[#f3f4f6] cursor-pointer hover:bg-[#f8fafc] transition-colors"
                    >
                      <div className="flex items-start gap-3 px-4 py-2.5 text-[11px] leading-snug">
                        <span className="text-[#6b7280] whitespace-nowrap">{ev.time}</span>
                        <span className={`font-bold whitespace-nowrap ${ev.cls}`}>{ev.label}</span>
                        <span className="text-[#4b5563] truncate">{ev.summary}</span>
                      </div>
                      {expandedEvent === idx && (
                        <div className="px-4 pb-3">
                          <pre className="text-[10px] leading-relaxed text-[#374151] whitespace-pre-wrap bg-[#f8fafc] border border-[#e5e7eb] rounded-md p-3 max-h-48 overflow-y-auto font-mono">
                            {ev.details}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={traceEndRef} />
                </div>
              )
            ) : (
              <div className="h-full flex flex-col p-4 gap-2">
                <div className="flex items-center justify-between text-[10px] text-[#6b7280] flex-shrink-0">
                  <span className="font-mono">
                    {editedCode ? editedCode.split("\n").length : 0} lines · generated dynamically from your workspace
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[#059669] font-bold">
                      <PencilLine size={11} /> Editable
                    </span>
                    <button
                      onClick={() => { setEditedCode(codeText); codeDirty.current = false; }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] font-bold transition-colors"
                      title="Restore the generated code"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>
                </div>
                <textarea
                  value={editedCode}
                  onChange={(e) => { setEditedCode(e.target.value); codeDirty.current = true; }}
                  spellCheck={false}
                  className="flex-1 min-h-0 w-full resize-none overflow-auto bg-white text-[#111827] font-mono text-[11px] leading-[1.7] border border-[#e5e7eb] rounded-md p-3 outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
