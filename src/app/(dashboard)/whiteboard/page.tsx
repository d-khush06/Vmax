"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import 'tldraw/tldraw.css';

import { useTeam } from '@/lib/team-context';
import { Share2, Download, MousePointer2 } from 'lucide-react';

const Tldraw = dynamic(() => import('tldraw').then(mod => mod.Tldraw), { ssr: false });

export default function WhiteboardPage() {
  const { team } = useTeam();

  return (
    <div className="h-full w-full flex flex-col p-6 bg-gradient-to-br from-[#030303] to-[#0a0a0c] overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-orange-500/5 blur-[130px] rounded-full pointer-events-none" />

      <header className="mb-6 px-2 flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-rose-500/20 flex items-center justify-center">
              <MousePointer2 size={20} className="text-rose-400" />
            </div>
            Team Whiteboard
          </h2>
          <p className="text-gray-400 text-sm mt-1 ml-13">Shared canvas for {team?.name || 'your workspace'}. <span className="text-rose-400 font-medium">Local mode</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg">
            <Download size={16} /> Export
          </button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-medium text-sm hover:from-rose-400 hover:to-purple-500 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
            <Share2 size={16} /> Share Session
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden bg-[#121212] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 group">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 shadow-[inset_0_0_100px_rgba(255,255,255,0.02)]" />
        <div className="absolute inset-0">
          <Tldraw 
            persistenceKey={`vmax-whiteboard-${team?._id || 'default'}`}
          />
        </div>
      </div>
    </div>
  );
}
