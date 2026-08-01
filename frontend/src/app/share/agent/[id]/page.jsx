import React from "react";
import AgentSandbox from "@/components/AgentSandbox";

export default function PublicAgentPage({ params }) {
  const { id } = params;

  // The agent configuration is not stored in our DB, so we construct a basic one with just the ID.
  const config = {
    agentId: id,
    name: "Public Agent",
    model: "Lyzr AI"
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <AgentSandbox config={config} isPublic={true} />
      </div>
    </div>
  );
}
