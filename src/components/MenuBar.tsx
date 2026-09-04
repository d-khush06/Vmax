'use client';

import React, { useState, useEffect } from 'react';
import { useTeam } from '@/lib/team-context';
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { WifiOff, Search, ChevronDown, Check, Settings, LogOut, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';

interface MenuBarProps {
  onOpenManageAccount: () => void;
  onOpenCreateWorkspace: () => void;
  onOpenJoinWorkspace: () => void;
}

export function MenuBar({ onOpenManageAccount, onOpenCreateWorkspace, onOpenJoinWorkspace }: MenuBarProps) {
  const { team, myTeams, switchTeam } = useTeam();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [time, setTime] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 w-full bg-white/10 backdrop-blur-3xl border-b border-white/20 px-4 flex items-center justify-between text-sm text-white/90 z-[90] relative shadow-sm font-medium">
      {/* Left items */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-bold tracking-wide cursor-pointer hover:text-white" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {team?.imageUrl ? (
            <img src={team.imageUrl} alt="Workspace" className="w-5 h-5 rounded object-cover -mt-0.5" />
          ) : (
            <span className="text-xl -mt-0.5"></span> 
          )}
          <span>{team?.name || 'Workspace'}</span>
          <ChevronDown size={14} className="opacity-50" />
        </div>
        
        {/* Workspace Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                className="absolute top-8 left-2 w-64 bg-black/95 backdrop-blur-3xl border border-white/15 rounded-xl shadow-2xl py-1 z-50"
              >
                <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Switch Workspace</div>
                {myTeams?.map(t => (
                  <button 
                    key={t._id}
                    onClick={() => {
                      switchTeam(t._id);
                      setDropdownOpen(false);
                      router.push('/world');
                    }}
                    className="w-full text-left px-4 py-2 flex items-center justify-between hover:bg-white/10 text-white/90 text-sm gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {t.imageUrl ? (
                        <img src={t.imageUrl} alt="" className="w-4 h-4 rounded object-cover" />
                      ) : (
                        <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[10px] font-bold">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{t.name}</span>
                    </div>
                    {team?._id === t._id && <Check size={14} className="text-blue-400" />}
                  </button>
                ))}
                
                <div className="h-px bg-white/10 my-1 mx-2" />
                
                {team && (
                  <button 
                    onClick={() => { setDropdownOpen(false); setShowSettings(true); }}
                    className="w-full text-left px-4 py-1.5 flex items-center gap-2 hover:bg-white/10 text-white/90 text-sm"
                  >
                    <Settings size={14} /> Workspace Settings
                  </button>
                )}

                <button 
                  onClick={() => { setDropdownOpen(false); onOpenCreateWorkspace(); }}
                  className="w-full text-left px-4 py-1.5 flex items-center gap-2 hover:bg-white/10 text-white/90 text-sm"
                >
                  <Plus size={14} /> Create Workspace
                </button>
                <button 
                  onClick={() => { setDropdownOpen(false); onOpenJoinWorkspace(); }}
                  className="w-full text-left px-4 py-1.5 flex items-center gap-2 hover:bg-white/10 text-white/90 text-sm"
                >
                  <Plus size={14} /> Join Workspace
                </button>
                
                <div className="h-px bg-white/10 my-1 mx-2" />
                <button 
                  onClick={() => { setDropdownOpen(false); onOpenManageAccount(); }}
                  className="w-full text-left px-4 py-1.5 flex items-center gap-2 hover:bg-white/10 text-white/90 text-sm"
                >
                  <Settings size={14} /> Manage Account
                </button>
                <button 
                  onClick={() => signOut(() => router.push('/'))}
                  className="w-full text-left px-4 py-1.5 flex items-center gap-2 hover:bg-red-500/20 text-red-400 text-sm"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-4">
        {!isOnline && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
            <WifiOff size={14} /> Offline
          </div>
        )}
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="flex items-center gap-1.5 text-white/50 hover:text-white/90"
        >
          <Search size={14} />
          <span className="text-xs mr-2">⌘K</span>
        </button>
        <div className="flex items-center gap-2">
          {clerkUser?.imageUrl && (
            <img src={clerkUser.imageUrl} alt="Profile" className="w-5 h-5 rounded-full border border-white/20" />
          )}
          <span>{clerkUser?.firstName || 'User'}</span>
        </div>
        <div className="font-semibold">{time}</div>
      </div>

      <WorkspaceSettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        team={team}
      />
    </div>
  );
}
