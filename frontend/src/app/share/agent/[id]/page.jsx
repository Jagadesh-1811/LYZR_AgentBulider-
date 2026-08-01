"use client";

import React, { useEffect, useState } from "react";
import AgentSandbox from "@/components/AgentSandbox";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function PublicAgentPage({ params }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAgent() {
      try {
        const docRef = doc(db, "agents", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const agentData = docSnap.data();
          setConfig({
            agentId: docSnap.id,
            name: agentData.name || "Public Agent",
            model: agentData.model || "Lyzr AI",
            ...agentData
          });
        } else {
          setError("Agent not found.");
        }
      } catch (err) {
        console.error("Failed to fetch agent:", err);
        setError(`Failed to load agent: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h2>
          <p className="text-gray-500">{error || "Agent not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <AgentSandbox config={config} isPublic={true} />
      </div>
    </div>
  );
}
