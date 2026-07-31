'use client';

import React from 'react';
import { InteractiveRobotSpline } from './interactive-3d-robot';
import { Workflow, Database, Rocket, LayoutTemplate, MessageCircle, GraduationCap, ArrowRight } from "lucide-react";

export function HeroSection({ onStart }) { 
  
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  const HOW_IT_WORKS = [
    {
      icon: <LayoutTemplate strokeWidth={1.5} className="w-8 h-8 text-violet-600" />,
      containerStyle: "bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100",
      title: "1. Choose Your Path",
      description: "Start from a blank canvas for total control, or jumpstart your project using one of our 10+ production-ready templates across various industries."
    },
    {
      icon: <Database strokeWidth={1.5} className="w-8 h-8 text-indigo-600" />,
      containerStyle: "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100",
      title: "2. Provide Knowledge",
      description: "Give your agent domain expertise using Native RAG. Just paste a URL or drop in your text documents, and the agent learns instantly."
    },
    {
      icon: <Rocket strokeWidth={1.5} className="w-8 h-8 text-purple-600" />,
      containerStyle: "bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100",
      title: "3. Test & Deploy",
      description: "Chat with your agent in the live Sandbox to perfect its persona, then deploy it directly to your website with a single copy-paste script tag."
    }
  ];

  const NAVIGATION_FEATURES = [
    {
      icon: <Workflow strokeWidth={1.5} className="w-6 h-6 text-emerald-600" />,
      containerStyle: "bg-emerald-50 border-emerald-100",
      title: "Interactive Agent Editor",
      description: "A dual-pane IDE that generates clean Lyzr Automata Python code in real-time as you tweak your agent's persona and model settings.",
      color: "border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-900/5"
    },
    {
      icon: <MessageCircle strokeWidth={1.5} className="w-6 h-6 text-amber-600" />,
      containerStyle: "bg-amber-50 border-amber-100",
      title: "Live Sandbox Chat",
      description: "Test your deployed agents immediately in a production-like chat interface to ensure their behavior and RAG knowledge is perfect.",
      color: "border-amber-100 hover:border-amber-300 hover:shadow-amber-900/5"
    },
    {
      icon: <GraduationCap strokeWidth={1.5} className="w-6 h-6 text-rose-600" />,
      containerStyle: "bg-rose-50 border-rose-100",
      title: "Global Mentor Support",
      description: "Stuck? The Lyzr Mentor is a floating assistant available on every screen, ready to guide you through complex platform configurations.",
      color: "border-rose-100 hover:border-rose-300 hover:shadow-rose-900/5"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden font-sans selection:bg-violet-200">
      
      {/* ── HERO SECTION ── */}
      <section className="relative w-screen h-[90vh] min-h-[700px]">
        {/* The 3D Robot Background */}
        <InteractiveRobotSpline
          scene={ROBOT_SCENE_URL}
          className="absolute inset-0 z-0" 
        />
        
        {/* Spline watermark hider */}
        <div className="absolute bottom-2 right-2 w-48 h-12 bg-white z-20 pointer-events-none rounded-tl-lg"></div>

        {/* Note: The bottom gradient 'sheet' mask was intentionally removed here based on user request */}

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-start justify-center pointer-events-none px-8 md:px-16 lg:px-32 bg-gradient-to-r from-white/95 via-white/60 to-transparent w-full md:w-[60%]">
          <div className="text-left text-gray-900 w-full max-w-2xl pointer-events-auto">

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
              Build AI Agents <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600">
                In Seconds.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-10 font-medium leading-relaxed max-w-xl">
              Design intelligent agents powered by native RAG, test them live in the sandbox, 
              and ship to production without writing a single line of infrastructure code.
            </p>

            <button 
              onClick={onStart}
              className="group relative px-8 py-4 bg-gray-900 text-white font-bold rounded-full text-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:bg-black transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 overflow-hidden"
            >
              <span className="relative z-10">Start Building for Free</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-32 px-8 md:px-16 lg:px-32 bg-gray-50 border-t border-gray-100 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">How the Platform Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">From concept to production-ready deployment in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className={`w-20 h-20 rounded-2xl shadow-sm border flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:shadow-md transition-all duration-300 ${step.containerStyle}`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NAVIGATION & FEATURES ── */}
      <section className="py-32 px-8 md:px-16 lg:px-32 bg-white relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Navigating the Workspace</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Everything you need to orchestrate complex AI workflows is built right in.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {NAVIGATION_FEATURES.map((feature, idx) => (
              <div key={idx} className={`p-8 rounded-3xl bg-white border shadow-sm transition-all duration-300 hover:scale-[1.02] ${feature.color}`}>
                <div className={`w-14 h-14 rounded-2xl shadow-sm border flex items-center justify-center mb-6 ${feature.containerStyle}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-24 text-center">
            <button 
              onClick={onStart}
              className="inline-flex items-center gap-3 px-8 py-4 bg-violet-600 text-white font-bold rounded-full text-lg shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.5)] transition-all duration-300 hover:-translate-y-1"
            >
              Enter the Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 text-center text-gray-500 border-t border-gray-100 bg-gray-50 text-sm font-medium">
        © {new Date().getFullYear()} Lyzr Automata. Empowering the next generation of AI Agents.
      </footer>
    </div> 
  );
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
