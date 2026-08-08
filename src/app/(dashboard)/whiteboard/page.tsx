"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import 'tldraw/tldraw.css';
import { motion } from 'framer-motion';

import { useTeam } from '@/lib/team-context';
import { Share2, Download, MousePointer2, Loader2 } from 'lucide-react';

const SyncedWhiteboard = dynamic(() => import('@/components/SyncedWhiteboard'), { ssr: false });

export default function WhiteboardPage() {
  const { team } = useTeam();

  return (
    <div className="h-full w-full flex flex-col p-6 relative overflow-hidden bg-[#0b120c]">
      {/* Dynamic Ambient Background Elements matching Chat */}
      <div className="absolute top-0 right-1/4 w-[40vw] h-[40vw] bg-green-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[40vw] h-[40vw] bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-6 px-5 py-4 flex items-center justify-between relative z-10 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 flex items-center justify-center shadow-inner">
              <MousePointer2 size={18} className="text-green-400" />
            </div>
            Team Canvas
          </h2>
          <p className="text-gray-500 text-[13px] mt-1 ml-12 font-medium tracking-wide">
            Shared workspace for {team?.name || 'your team'}. <span className="text-green-400/80 italic ml-1">Synced in real-time</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium text-[13px] hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 hover:shadow-lg active:scale-95">
            <Download size={16} /> Export
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white font-medium text-[13px] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-105 active:scale-95">
            <Share2 size={16} /> Share Session
          </button>
        </div>
      </motion.header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative z-10 group ring-1 ring-white/5"
      >
        <div className="absolute inset-0">
          {team ? (
            <SyncedWhiteboard teamId={team._id} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
               <Loader2 size={32} className="animate-spin text-green-500/50" />
               <p className="text-sm font-medium tracking-wide">Connecting to workspace...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
