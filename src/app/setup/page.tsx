"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/lib/team-context';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import JoinWorkspaceModal from '@/components/JoinWorkspaceModal';

export default function SetupPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { myTeams } = useTeam();
  const router = useRouter();

  React.useEffect(() => {
    if (myTeams && myTeams.length > 0) {
      router.push('/world');
    }
  }, [myTeams, router]);

  return (
    <div className="min-h-screen w-screen bg-[#000000] flex items-center justify-center relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-gradient-radial from-blue-600/20 via-indigo-600/5 to-transparent blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-gradient-radial from-purple-600/20 via-fuchsia-600/5 to-transparent blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl px-6 text-center"
      >
        <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-8 rounded-2xl shadow-xl shadow-blue-500/20" />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Welcome to the Workspace</h1>
        <p className="text-lg text-white/50 mb-12">You don't belong to any workspaces yet. Join an existing team or create a new one to get started.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => setShowJoin(true)}
            className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left backdrop-blur-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LinkIcon size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Join Workspace</h3>
            <p className="text-sm text-white/50">Enter a 6-character code to instantly join your team's workspace.</p>
          </button>

          <button 
            onClick={() => setShowCreate(true)}
            className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left backdrop-blur-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Create Workspace</h3>
            <p className="text-sm text-white/50">Start a fresh workspace and invite your team members to collaborate.</p>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
        {showJoin && <JoinWorkspaceModal onClose={() => setShowJoin(false)} />}
      </AnimatePresence>
    </div>
  );
}
