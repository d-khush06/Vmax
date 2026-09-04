"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Folder, Calendar, Kanban, Monitor, Mic, Search, Map, Trash2, LogOut, Settings, Hash, Compass } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from '../../convex/_generated/api';
import { useTeam } from '@/lib/team-context';
import { useThemeStore } from '@/lib/theme-store';

interface SidebarProps {
  onOpenManageAccount: () => void;
  onOpenCreateWorkspace: () => void;
  onOpenJoinWorkspace: () => void;
}

export function Sidebar({ onOpenManageAccount, onOpenCreateWorkspace, onOpenJoinWorkspace }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { team, myTeams, switchTeam, user: convexUser, teammates, onlineUsers } = useTeam();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { vocab } = useThemeStore();
  
  const deleteTeamMutation = useMutation(api.teams.deleteTeam);
  const leaveTeamMutation = useMutation(api.teams.leaveTeam);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const voiceRoomId = team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice';

  const navItems = [
    { name: 'Dashboard', icon: Compass, href: '/world', color: '#3b82f6' },
    { name: 'Chat', icon: MessageSquare, href: '/chat/general', color: '#10b981' },
    { name: 'Voice', icon: Mic, href: `/voice/${voiceRoomId}`, color: '#f59e0b' },
    { name: 'Tasks', icon: Kanban, href: '/tasks', color: '#8b5cf6' },
    { name: 'Calendar', icon: Calendar, href: '/calendar', color: '#ec4899' },
    { name: 'Whiteboard', icon: Monitor, href: '/whiteboard', color: '#06b6d4' },
    { name: 'Files', icon: Folder, href: '/files', color: '#eab308' },
    { name: 'Automations', icon: Hash, href: '/automations', color: '#f43f5e' },
  ];

  return (
    <div className="w-[280px] h-full shrink-0 flex flex-col bg-white/[0.03] backdrop-blur-[40px] border-r border-white/10 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.5)] z-40 relative">
      
      {/* Workspace & Profile Header */}
      <div className="p-4 border-b border-white/10 relative">
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={clerkUser?.imageUrl || '/logo.png'} 
                className="w-10 h-10 rounded-xl border border-white/20 object-cover shadow-lg group-hover:scale-105 transition-transform" 
                alt="Profile"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#000000] rounded-full"></span>
            </div>
            <div className="text-left flex flex-col justify-center">
              <span className="text-sm font-bold text-white leading-tight">
                {team?.name || 'VMAX Workspace'}
              </span>
              <span className="text-xs text-white/50 leading-tight">
                {clerkUser?.fullName || 'Profile'}
              </span>
            </div>
          </div>
          <Settings size={16} className="text-white/30 group-hover:text-white transition-colors" />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isProfileDropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-4 right-4 top-[80px] mt-2 bg-[#151515]/95 backdrop-blur-xl border border-white/10 rounded-2xl z-[999] flex flex-col overflow-hidden shadow-2xl py-2"
            >
              {/* Online Section */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Online Now</div>
                <div className="flex -space-x-2">
                  {teammates?.filter(tm => onlineUsers.includes(tm.clerkId)).length === 0 && (
                    <div className="text-sm text-white/70 italic">Just you right now</div>
                  )}
                  {teammates?.filter(tm => onlineUsers.includes(tm.clerkId)).slice(0, 8).map((tm, i) => (
                    <div key={tm._id || tm.clerkId || i} className="relative group" title={tm.name || tm.full_name || "Teammate"}>
                      <img src={tm.avatar_url || tm.avatarUrl || '/logo.png'} className="w-8 h-8 rounded-full border-2 border-[#1c1c1e] transition-transform group-hover:scale-110 object-cover" />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1c1c1e] rounded-full"></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workspaces Section */}
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Workspaces</div>
                {myTeams?.map((t) => (
                  <div key={t._id} className="group relative w-full flex items-center justify-between hover:bg-white/10 transition-colors">
                    <button 
                      onClick={() => {
                        switchTeam(t._id);
                        setIsProfileDropdownOpen(false);
                        router.push('/world');
                      }}
                      className="flex-1 px-4 py-2 text-sm text-left text-white flex items-center justify-between"
                    >
                      {t.name}
                      {team?._id === t._id && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                    </button>
                    
                    <button 
                       onClick={async (e) => {
                         e.stopPropagation();
                         if (!clerkUser) return;
                         if (t.createdBy === clerkUser.id) {
                           if (confirm('Are you sure you want to permanently delete this workspace?')) {
                             await deleteTeamMutation({ teamId: t._id, clerkId: clerkUser.id });
                           }
                         } else {
                           if (confirm('Are you sure you want to leave this workspace?')) {
                             await leaveTeamMutation({ teamId: t._id, clerkId: clerkUser.id });
                           }
                         }
                       }}
                       className="px-3 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {t.createdBy === clerkUser?.id ? <Trash2 size={14} /> : <LogOut size={14} />}
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => { setIsProfileDropdownOpen(false); onOpenJoinWorkspace(); }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors text-indigo-400 font-medium"
                >
                  + Join Workspace
                </button>
                <button 
                  onClick={() => { setIsProfileDropdownOpen(false); onOpenCreateWorkspace(); }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors text-blue-400 font-medium border-b border-white/10 pb-3"
                >
                  + Create Workspace
                </button>
              </div>

              <button 
                onClick={() => { setIsProfileDropdownOpen(false); onOpenManageAccount(); }}
                className="w-full px-4 py-3 text-sm text-left hover:bg-white/10 transition-colors text-white font-medium"
              >
                Manage account
              </button>
              <button 
                onClick={() => signOut(() => router.push('/'))}
                className="w-full px-4 py-3 text-sm text-left hover:bg-red-500/10 transition-colors text-red-400 font-medium border-t border-white/10"
              >
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Command Menu Trigger */}
      <div className="p-4">
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
        >
          <div className="flex items-center gap-2 text-white/60 group-hover:text-white/90">
            <Search size={16} />
            <span className="text-sm font-medium">Search...</span>
          </div>
          <div className="flex gap-1 text-[10px] font-mono text-white/40">
            <span className="bg-white/10 px-1.5 py-0.5 rounded">⌘</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded">K</span>
          </div>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4 ml-2">Apps</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                isActive ? 'bg-white/10 text-white shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              
              <div 
                className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                style={{ 
                  backgroundColor: isActive ? `${item.color}20` : 'transparent',
                  color: isActive ? item.color : 'inherit'
                }}
              >
                <Icon size={18} />
              </div>
              <span className={`text-sm font-medium ${isActive ? 'tracking-wide' : ''}`}>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
