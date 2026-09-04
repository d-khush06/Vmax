"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, MessageSquare, Kanban, Mic, Calendar, 
  Wifi, Search, Battery, Plus, Users, Terminal
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const FEATURES = [
  { icon: MessageSquare, title: 'Chat', color: 'from-blue-400 to-blue-600' },
  { icon: Kanban, title: 'Tasks', color: 'from-purple-400 to-purple-600' },
  { icon: Mic, title: 'Voice', color: 'from-amber-400 to-amber-600' },
  { icon: Calendar, title: 'Calendar', color: 'from-pink-400 to-pink-600' },
  { icon: Terminal, title: 'Automations', color: 'from-emerald-400 to-emerald-600' },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative bg-black font-sans text-gray-200 selection:bg-blue-500/30">
      
      {/* ── Subtle Professional Dark Background ── */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />



      {/* ── Desktop Area (Hero Window) ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full w-[95vw] max-w-[1400px] h-[92vh] min-h-[700px] bg-[#1c1c1e]/80 backdrop-blur-3xl rounded-xl border border-white/15 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(255,255,255,0.05)_inset] overflow-hidden flex flex-col"
        >
          {/* Window Title Bar */}
          <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 relative">
            <div className="flex items-center gap-2 absolute left-4">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:bg-[#ff5f56]/80" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer hover:bg-[#ffbd2e]/80" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer hover:bg-[#27c93f]/80" />
            </div>
            <div className="w-full text-center text-xs font-semibold text-white/50 tracking-wide">
              VMAX - Welcome
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 p-8 sm:p-12 flex flex-col md:flex-row items-center relative overflow-hidden gap-12">
            {/* Inner subtle glow */}
            <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-blue-500/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-purple-500/10 blur-[80px] pointer-events-none" />
            
            {/* Left Column: Text & CTA */}
            <div className="flex-1 flex flex-col items-start text-left z-10 w-full">
              <div className="flex items-center gap-4 mb-6">
                <img src="/logo.png" alt="VMAX" className="w-14 h-14 rounded-2xl shadow-2xl object-cover border border-white/10" />
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-blue-400 backdrop-blur-md">
                  VMAX OS Beta
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
                The OS for <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  High-Performance
                </span> <br /> Teams.
              </h1>
              
              <p className="text-sm sm:text-base text-gray-400 max-w-md mb-8 leading-relaxed">
                Experience a unified workspace combining real-time chat, task boards, voice rooms, and shared calendars, all within a beautiful, native-feeling environment.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {isSignedIn ? (
                  <Link
                    href="/world"
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 text-sm"
                  >
                    Enter Workspace <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#007AFF] text-white font-semibold hover:bg-[#0066D6] transition-all shadow-[0_0_20px_rgba(0,122,255,0.3)] flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus size={16} /> Sign Up
                    </Link>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Users size={16} /> Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Moving Feature Animations */}
            <div className="hidden md:flex flex-1 relative h-full w-full items-center justify-center z-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] overflow-hidden">
              <motion.div
                animate={{ y: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                className="flex flex-col gap-6 absolute top-0 pt-10"
              >
                {/* We render two sets of widgets to create an infinite seamless scroll */}
                {[0, 1].map((set) => (
                  <React.Fragment key={set}>
                    {/* Chat Widget */}
                    <div className="w-80 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col relative left-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">JD</div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white">Engineering Team</span>
                          <span className="text-[10px] text-green-400">3 online</span>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="w-[80%] p-2 rounded-xl rounded-tl-sm bg-white/5 text-[11px] text-gray-300">
                          Deployed the new core architecture to staging.
                        </div>
                        <div className="w-[70%] p-2 rounded-xl rounded-tr-sm bg-blue-500/20 text-[11px] text-blue-200 self-end">
                          Looks incredibly fast! 🚀
                        </div>
                      </div>
                    </div>

                    {/* Task Board Widget */}
                    <div className="w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col relative -left-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-white flex items-center gap-2"><Kanban size={14} className="text-purple-400"/> Sprint Backlog</span>
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"><Plus size={12} className="text-white"/></div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="w-full p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-2">
                          <span className="text-[11px] font-medium text-white">Implement macOS UI Metaphor</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400">In Progress</span>
                          </div>
                        </div>
                        <div className="w-full p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col gap-2">
                          <span className="text-[11px] font-medium text-gray-400">Fix Auth Routing Bug</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400">Done</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Voice Room Widget */}
                    <div className="w-72 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 shadow-2xl flex flex-col relative left-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-white flex items-center gap-2"><Mic size={14} className="text-indigo-400"/> Daily Standup</span>
                        <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                        </div>
                      </div>
                      <div className="flex items-center gap-[-10px] overflow-hidden px-2">
                        <div className="w-10 h-10 rounded-full border-2 border-[#1c1c1e] bg-blue-500 flex items-center justify-center text-xs font-bold z-30 ring-2 ring-indigo-500/50">AL</div>
                        <div className="w-10 h-10 rounded-full border-2 border-[#1c1c1e] bg-purple-500 flex items-center justify-center text-xs font-bold z-20 -ml-3">JD</div>
                        <div className="w-10 h-10 rounded-full border-2 border-[#1c1c1e] bg-amber-500 flex items-center justify-center text-xs font-bold z-10 -ml-3">MR</div>
                      </div>
                    </div>

                    {/* Calendar Widget */}
                    <div className="w-80 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col relative -left-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-white flex items-center gap-2"><Calendar size={14} className="text-pink-400"/> Upcoming</span>
                        <span className="text-[10px] text-gray-400">Today</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="w-full flex items-center gap-3">
                          <div className="w-1 bg-pink-500 h-8 rounded-full" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-white">Design Sync</span>
                            <span className="text-[10px] text-gray-400">2:00 PM - 3:00 PM</span>
                          </div>
                        </div>
                        <div className="w-full flex items-center gap-3">
                          <div className="w-1 bg-emerald-500 h-8 rounded-full" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-white">All Hands Meeting</span>
                            <span className="text-[10px] text-gray-400">4:30 PM - 5:30 PM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

      </main>



    </div>
  );
}
