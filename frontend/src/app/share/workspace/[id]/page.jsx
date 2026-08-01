"use client";

import React, { useEffect, useState } from "react";
import WorkspaceSandbox from "@/components/WorkspaceSandbox";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export default function PublicWorkspacePage({ params }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const docRef = doc(db, "workspaces", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setWorkspace({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Workspace not found.");
        }
      } catch (err) {
        console.error("Failed to fetch workspace:", err);
        setError(`Failed to load workspace: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspace();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h2>
          <p className="text-gray-500">{error || "Workspace not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <WorkspaceSandbox workspace={workspace} isPublic={true} />
      </div>
    </div>
  );
}
