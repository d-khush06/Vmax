"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTeam } from '@/lib/team-context';
import ManageAccountModal from '@/components/ManageAccountModal';
import { TradeWindow } from '@/components/TradeWindow';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import { MenuBar } from '@/components/MenuBar';
import { Dock } from '@/components/Dock';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import JoinWorkspaceModal from '@/components/JoinWorkspaceModal';
import { CommandPalette } from '@/components/CommandPalette';

export default function AuroraLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, team } = useTeam();
  const isOnline = useNetworkStatus();

  const [showManageAccount, setShowManageAccount] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showJoinWorkspace, setShowJoinWorkspace] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (loading || !isClient) {
    return <div className="h-screen w-screen bg-[#000000]" />;
  }

  // Dynamic Background Logic based on Pathname
  let ambientColors = {
    primary: 'from-blue-600/40 via-indigo-600/10',
    secondary: 'from-purple-600/40 via-fuchsia-600/10',
    tertiary: 'from-cyan-500/40 via-blue-500/10'
  };

  if (pathname.includes('/chat')) {
    ambientColors = { primary: 'from-sky-600/40 via-blue-600/10', secondary: 'from-emerald-600/30 via-teal-600/10', tertiary: 'from-blue-500/40 via-sky-500/10' };
  } else if (pathname.includes('/tasks')) {
    ambientColors = { primary: 'from-violet-600/40 via-purple-600/10', secondary: 'from-fuchsia-600/30 via-pink-600/10', tertiary: 'from-purple-500/40 via-violet-500/10' };
  } else if (pathname.includes('/voice')) {
    ambientColors = { primary: 'from-orange-600/40 via-amber-600/10', secondary: 'from-yellow-600/30 via-orange-600/10', tertiary: 'from-amber-500/40 via-orange-500/10' };
  }

  return (
    <div className="relative flex h-screen w-full bg-[#000000] text-gray-200 overflow-hidden font-sans">
      
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-red-600 text-white z-[100] flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase shadow-md">
          <WifiOff size={14} /> Offline Mode — Syncing Paused.
        </div>
      )}

      {/* 1. Base Layer: Apple Mesh Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000">
        <div className={`absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-radial ${ambientColors.primary} to-transparent blur-[120px] animate-pulse`} style={{ animationDuration: '8s' }} />
        <div className={`absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-radial ${ambientColors.secondary} to-transparent blur-[120px] animate-pulse`} style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className={`absolute top-[20%] right-[30%] w-[40vw] h-[40vw] rounded-full bg-gradient-radial ${ambientColors.tertiary} to-transparent blur-[100px] animate-pulse`} style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      {/* App Foreground Layer */}
      <div className={`relative z-10 w-full h-full flex flex-col pointer-events-none ${!isOnline ? 'pt-8' : ''}`}>
        
        {/* Top Menu Bar */}
        <div className="pointer-events-auto w-full">
          <MenuBar 
            onOpenManageAccount={() => setShowManageAccount(true)}
            onOpenCreateWorkspace={() => setShowCreateWorkspace(true)}
            onOpenJoinWorkspace={() => setShowJoinWorkspace(true)}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative z-0 overflow-hidden pointer-events-auto">
          <AnimatePresence>
            <motion.div 
              key={pathname}
              initial={{ opacity: 0, y: 5, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.995 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Bottom Dock */}
        <Dock />
      </div>

      <AnimatePresence>
        {showManageAccount && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 p-8">
            <ManageAccountModal onClose={() => setShowManageAccount(false)} />
          </div>
        )}
        {showCreateWorkspace && (
          <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />
        )}
        {showJoinWorkspace && (
          <JoinWorkspaceModal onClose={() => setShowJoinWorkspace(false)} />
        )}
      </AnimatePresence>
      <TradeWindow />
      <CommandPalette />
    </div>
  );
}
