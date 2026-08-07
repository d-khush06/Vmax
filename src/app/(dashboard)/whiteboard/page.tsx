"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import 'tldraw/tldraw.css';

import { useTeam } from '@/lib/team-context';
import { Share2, Download, MousePointer2 } from 'lucide-react';

const SyncedWhiteboard = dynamic(() => import('@/components/SyncedWhiteboard'), { ssr: false });

export default function WhiteboardPage() {
  const { team } = useTeam();

  return (
    <div className="h-full w-full flex flex-col p-6 relative overflow-hidden">
      {/* Ambient Glass Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#121212]">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <header className="mb-6 px-4 py-3 flex items-center justify-between relative z-10 bg-white/[0.01] backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <MousePointer2 size={16} className="text-teal-400" />
            </div>
            Team Whiteboard
          </h2>
          <p className="text-gray-500 text-xs mt-1 ml-11">Shared canvas for {team?.name || 'your workspace'}. <span className="text-teal-400 font-medium">Live Real-time</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
            <Download size={16} /> Export
          </button>
          <button className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white font-medium text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Share2 size={16} /> Share Session
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 group">
        <div className="absolute inset-0">
          {team ? (
            <SyncedWhiteboard teamId={team._id} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">Loading Whiteboard...</div>
          )}
        </div>
      </div>
    </div>
  );
}
