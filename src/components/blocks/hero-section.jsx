'use client';

import React from 'react';
import { InteractiveRobotSpline } from './interactive-3d-robot';

export function HeroSection({ onStart }) { 
  
  const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">

      <InteractiveRobotSpline
        scene={ROBOT_SCENE_URL}
        className="absolute inset-0 z-0" 
      />

      {/* Cover the Spline watermark with a white overlay */}
      <div className="absolute bottom-2 right-2 w-48 h-12 bg-white z-20"></div>

      {/* Mask the dark floor/shadow from the Spline scene */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

      <div className="absolute inset-0 z-10 flex flex-col items-start justify-center pointer-events-none px-8 md:px-16 lg:px-32 bg-gradient-to-r from-white via-white/70 to-transparent">
        <div className="text-left text-gray-900 w-full max-w-2xl pointer-events-auto">
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Build & Deploy AI Agents with Lyzr
          </h1>
          
          <p className="text-lg md:text-xl text-gray-700 mb-10 font-light leading-relaxed">
            Design intelligent agents powered by native RAG, test them live in the sandbox, 
            and ship to production in seconds — no infrastructure required.
          </p>

          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-gray-900 text-white font-semibold rounded-full text-lg hover:scale-105 transition-all duration-300"
          >
            Get Started
            <span className="absolute inset-0 rounded-full border border-black/20 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500"></span>
          </button>
        </div>
      </div>
    </div> 
  );
}
