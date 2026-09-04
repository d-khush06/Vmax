"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, MessageSquare, Kanban, Calendar, Monitor, Folder, Hash, Mic, Plus, Users, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/lib/team-context';
import { useClerk } from '@clerk/nextjs';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const { team, myTeams, switchTeam } = useTeam();
  const { signOut } = useClerk();
  const voiceRoomId = team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice';

  // Toggle open state on Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const allCommands = [
    { type: 'Navigation', name: 'Dashboard', icon: Compass, action: () => router.push('/world') },
    { type: 'Navigation', name: 'Chat', icon: MessageSquare, action: () => router.push('/chat/general') },
    { type: 'Navigation', name: 'Voice Rooms', icon: Mic, action: () => router.push(`/voice/${voiceRoomId}`) },
    { type: 'Navigation', name: 'Tasks (Kanban)', icon: Kanban, action: () => router.push('/tasks') },
    { type: 'Navigation', name: 'Calendar', icon: Calendar, action: () => router.push('/calendar') },
    { type: 'Navigation', name: 'Whiteboard', icon: Monitor, action: () => router.push('/whiteboard') },
    { type: 'Navigation', name: 'Files', icon: Folder, action: () => router.push('/files') },
    { type: 'Navigation', name: 'Automations', icon: Hash, action: () => router.push('/automations') },
    
    // Add workspace switching commands dynamically
    ...(myTeams || []).map(t => ({
      type: 'Workspaces',
      name: `Switch to ${t.name}`,
      icon: Users,
      action: () => { switchTeam(t._id); router.push('/world'); }
    })),

    { type: 'Actions', name: 'Sign Out', icon: LogOut, action: () => signOut(() => router.push('/')) },
  ];

  const filteredCommands = allCommands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  // Keyboard navigation inside palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, filteredCommands, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-[#111111]/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-4 border-b border-white/10">
              <Search className="w-5 h-5 text-white/50 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-lg text-white placeholder-white/30 outline-none"
              />
              <div className="text-[10px] font-mono text-white/30 border border-white/10 rounded px-1.5 py-0.5 ml-2">ESC</div>
            </div>

            {/* Results List */}
            <div className="max-h-[350px] overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-white/50 text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, i) => (
                    <button
                      key={`${cmd.type}-${cmd.name}`}
                      onMouseEnter={() => setSelectedIndex(i)}
                      onClick={() => { cmd.action(); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                        i === selectedIndex ? 'bg-blue-500/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${i === selectedIndex ? 'bg-blue-500/30' : 'bg-white/5'}`}>
                          <cmd.icon size={16} className={i === selectedIndex ? 'text-blue-400' : 'text-white/50'} />
                        </div>
                        <span className="font-medium text-sm">{cmd.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{cmd.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/10 bg-white/[0.02] flex items-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1"><span className="border border-white/10 rounded px-1">↑↓</span> to navigate</span>
              <span className="flex items-center gap-1"><span className="border border-white/10 rounded px-1">↵</span> to select</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
