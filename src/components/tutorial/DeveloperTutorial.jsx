import React, { useState } from 'react';
import { ProjectSetup } from './ProjectSetup';
import { TaskOverview } from './TaskOverview';
import { MissionEditor } from './MissionEditor';
import { RagIntro } from './RagIntro';
import { RagSetup } from './RagSetup';
import { CodeSummary } from './CodeSummary';

const SCREENS  = ['setup', 'overview', 'editor', 'ragintro', 'rag', 'summary'];
const LABELS   = ['1 Setup', '2 Overview', '3 Editor', '4 RAG Intro', '5 RAG Setup', '6 Done'];

export function DeveloperTutorial({ mode, templateConfig, onComplete, onCancel }) {
  const [currentScreen, setCurrentScreen] = useState('setup');
  const [finalCode, setFinalCode]         = useState('');
  const [finalConfig, setFinalConfig]     = useState(null);
  const [editorConfig, setEditorConfig]   = useState(null);

  const currentIdx = SCREENS.indexOf(currentScreen);

  return (
    <div className="flex flex-col w-full min-h-screen bg-white text-[#374151] font-sans">

      {/* ── Tutorial Header ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 p-6 border-b border-[#e5e7eb] bg-white">
        <div className="flex flex-col text-center">
          <h1 className="text-xl font-bold">
            {mode === 'scratch' ? 'Start from Scratch' : `Template: ${templateConfig?.name || 'Agent'}`}
          </h1>
          <p className="text-[#9494a6] text-xs font-mono mt-1">
            Lyzr Automata SDK Interactive Tutorial
          </p>
        </div>

        {/* Step progress pills */}
        <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
          {SCREENS.map((screen, idx) => {
            const isActive = currentScreen === screen;
            const isDone   = currentIdx > idx;
            return (
              <button
                key={screen}
                onClick={() => setCurrentScreen(screen)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: isActive ? '#7c3aed' : isDone ? '#059669' : '#f3f4f6',
                  color: (isActive || isDone) ? '#ffffff' : '#6b7280',
                }}
              >
                {LABELS[idx]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Screen ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <div className="w-full max-w-6xl">

          {currentScreen === 'setup' && (
            <ProjectSetup mode={mode} onNext={() => setCurrentScreen('overview')} />
          )}

          {currentScreen === 'overview' && (
            <TaskOverview mode={mode} onNext={() => setCurrentScreen('editor')} />
          )}

          {currentScreen === 'editor' && (
            <MissionEditor
              mode={mode}
              templateConfig={templateConfig}
              onComplete={(code, config) => {
                setEditorConfig(config);
                setCurrentScreen('ragintro');
              }}
            />
          )}

          {currentScreen === 'ragintro' && (
            <RagIntro onNext={() => setCurrentScreen('rag')} />
          )}

          {currentScreen === 'rag' && (
            <RagSetup
              codeValues={editorConfig}
              onComplete={(code, fullConfig) => {
                setFinalCode(code);
                setFinalConfig(fullConfig);
                setCurrentScreen('summary');
              }}
            />
          )}

          {currentScreen === 'summary' && (
            <CodeSummary
              code={finalCode}
              onFinish={() => onComplete(finalCode, finalConfig)}
            />
          )}

        </div>
      </div>
    </div>
  );
}
