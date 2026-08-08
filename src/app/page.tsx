"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Sparkles, Zap, Shield, Globe, MessageSquare,
  Kanban, Mic, Calendar, X, Eye, EyeOff, Users, Star
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const FEATURES = [
  { icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10', title: 'Real-time Chat', desc: 'Instant messaging with channels, threads, and presence indicators.' },
  { icon: Kanban, color: 'text-green-400', bg: 'bg-green-500/10', title: 'Smart Tasks', desc: 'Drag-and-drop task boards that sync across your entire team instantly.' },
  { icon: Mic, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Voice Rooms', desc: 'Crystal clear voice channels with invite links and live presence.' },
  { icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Team Calendar', desc: 'Shared scheduling so every team member stays aligned on deadlines.' },
];

const STATS = [
  { value: '10x', label: 'Faster decisions' },
  { value: '∞', label: 'Real-time sync' },
  { value: '100%', label: 'Uptime SLA' },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  // Leftover modal logic removed.

  return (
    <div className="min-h-screen w-screen bg-[#0b120c] flex flex-col relative overflow-x-hidden text-gray-200" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Ambient background glows ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[90vw] h-[60vh] rounded-full bg-gradient-radial from-green-500/20 via-emerald-600/5 to-transparent blur-[100px]" />
        <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-green-900/15 blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-emerald-900/10 blur-[100px]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_30%,transparent_100%)]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="VMAX Logo" className="w-9 h-9 rounded-xl shadow-lg shadow-green-500/30 object-cover" />
          <span className="text-lg font-bold tracking-tight text-white">VMAX</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="#stats" className="text-sm text-gray-400 hover:text-white transition-colors">About</a>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link
              href="/tasks"
              className="text-sm font-bold px-6 py-2.5 rounded-xl bg-green-500 text-black shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:bg-green-400 transition-all"
            >
              Open Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold px-5 py-2.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 text-white backdrop-blur-md transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center text-center px-6 pt-16 pb-28 max-w-5xl mx-auto w-full">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-green-400 text-sm font-medium mb-8"
        >
          <Sparkles size={13} />
          <span>Next-gen team collaboration is here</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-[80px] font-black text-white tracking-[-0.03em] leading-[1.0] mb-7"
        >
          The OS for<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-500 to-emerald-500">
            High-Performance
          </span>{' '}
          <br className="hidden md:block" />Teams.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed"
        >
          VMAX merges real-time chat, task boards, voice rooms, and shared calendars into a single stunning workspace your team will actually love.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
        >
          {isSignedIn ? (
            <Link
              href="/setup"
              className="group flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#030303] font-bold text-base hover:bg-gray-100 transition-all shadow-lg"
            >
              Create a Workspace
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="group flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#030303] font-bold text-base hover:bg-gray-100 transition-all shadow-lg"
              >
                Create a Workspace
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] font-semibold text-base text-white transition-all"
              >
                <Users size={18} />
                Join Existing Team
              </Link>
            </>
          )}
        </motion.div>
      </main>

      {/* ── Stats ── */}
      <section id="stats" className="relative z-10 border-y border-white/5 bg-white/[0.01] py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-black text-white tracking-tight">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything your team needs</h2>
          <p className="text-gray-400 max-w-xl mx-auto">One platform. Zero friction. Total alignment.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="p-7 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 ${f.color} group-hover:scale-110 transition-transform`}>
                <f.icon size={22} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24 w-full">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/20 via-emerald-600/10 to-transparent border border-white/10 p-12 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
          </div>
          <Star size={28} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to level up your team?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join VMAX today and experience the future of remote team collaboration.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition-all shadow-lg shadow-green-500/25"
          >
            Start for free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
}
