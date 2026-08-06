"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Folder, Calendar, Kanban, Monitor, Mic, Search, Bell, ChevronLeft, ChevronRight, Users, X, ChevronDown, Plus, LogOut, Check, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { dark } from "@clerk/themes";
import { api } from '../../../convex/_generated/api';
import { useTeam } from '@/lib/team-context';
import ManageAccountModal from '@/components/ManageAccountModal';

export default function AuroraLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { team, myTeams, switchTeam, user, teammates, onlineUsers, loading } = useTeam();

  const dockApps = [
    { name: 'Chat', icon: MessageSquare, href: '/chat/general' },
    { name: 'Voice', icon: Mic, href: '/voice/general-voice' },
    { name: 'Files', icon: Folder, href: '/files' },
    { name: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'Tasks', icon: Kanban, href: '/tasks' },
    { name: 'Whiteboard', icon: Monitor, href: '/whiteboard' },
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showManageAccount, setShowManageAccount] = useState(false);
  const { signOut } = useClerk();
  
  const leaveTeamMutation = useMutation(api.teams.leaveTeam);

  if (loading) {
    return <div className="h-screen w-screen bg-[#030303]" />;
  }

  const handleSignOut = async () => {
    // Handled by Clerk in the TeamContext or by routing
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    if (confirm(`Are you sure you want to leave ${team.name}?`)) {
      try {
        await leaveTeamMutation({ teamId: team._id, clerkId: user?.id });
        setIsWorkspaceDropdownOpen(false);
        // Page will automatically reload or context will push to /setup if 0 teams left
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="relative flex h-screen w-full bg-[#030303] text-gray-100 overflow-hidden font-sans">
      
      {/* 1. Ambient Celestial Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[60vw] h-[40vw] rounded-[100%] bg-gradient-to-b from-[#ff8a00]/30 via-[#e52e71]/10 to-transparent blur-[100px]" />
        <div className="absolute top-[10%] left-[20%] w-[20vw] h-[20vw] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute top-[10%] right-[20%] w-[20vw] h-[20vw] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* App Container */}
      <div className="relative z-10 w-full h-full flex overflow-hidden pointer-events-auto bg-[#0c0c0e]/90 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          
          {/* Subtle inner top glow for the app container */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-500/10 via-purple-500/5 to-transparent pointer-events-none" />

          {/* Mobile Sidebar Backdrop */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />
            )}
          </AnimatePresence>

          {/* 2. Minimalist Left Sidebar */}
          <motion.aside 
            initial={false}
            animate={{ width: isSidebarOpen ? 240 : 72, x: isMobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -240 : 0) }}
            className={`absolute md:relative z-50 md:z-30 h-full flex flex-col bg-[#0a0a0c]/95 md:bg-transparent border-r border-white/5 transition-all duration-300 ease-in-out flex-shrink-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          >
            <div className="h-16 flex items-center px-3 shrink-0 relative">
              <button 
                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                className={`w-full h-10 flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center'} rounded-xl hover:bg-white/5 transition-colors cursor-pointer outline-none group`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 text-white font-bold text-[10px]">
                     {team?.name?.substring(0, 2).toUpperCase() || 'VM'}
                  </div>
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-bold text-sm tracking-wide whitespace-nowrap overflow-hidden text-gray-200 group-hover:text-white transition-colors"
                      >
                        {team?.name || 'Workspace'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                {isSidebarOpen && (
                   <ChevronDown size={14} className={`text-gray-500 transition-transform ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              <AnimatePresence>
                {isWorkspaceDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsWorkspaceDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-16 left-3 w-64 bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspaces</div>
                        
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {myTeams?.map((t: any) => (
                            <button
                              key={t._id}
                              onClick={() => { switchTeam(t._id); setIsWorkspaceDropdownOpen(false); }}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shrink-0 text-gray-300 font-bold text-[10px]">
                                   {t.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className={`text-sm truncate ${team?._id === t._id ? 'text-white font-medium' : 'text-gray-400'}`}>
                                  {t.name}
                                </span>
                              </div>
                              {team?._id === t._id && <Check size={14} className="text-orange-500 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-2 border-t border-white/5 space-y-1">
                        <button
                          onClick={() => { router.push('/setup?action=add'); setIsWorkspaceDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white text-sm"
                        >
                          <Plus size={16} /> Create / Join Workspace
                        </button>
                        <button
                          onClick={handleLeaveTeam}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 text-sm"
                        >
                          <LogOut size={16} /> Leave Workspace
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="px-4 py-2 mt-4">
               <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-2"
                    >
                      WORKSPACE
                    </motion.span>
                  )}
               </AnimatePresence>
            </div>

            <div className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto hide-scrollbar">
              {dockApps.map((app) => {
                const isActive = pathname?.includes(app.href);
                return (
                  <Link key={app.name} href={app.href}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                      <app.icon size={18} className="shrink-0" />
                      <AnimatePresence>
                        {isSidebarOpen && (
                          <motion.div 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap flex-1"
                          >
                            <span className="font-medium text-sm">{app.name}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-white/5">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-full flex items-center justify-center py-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
              >
                {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </motion.aside>

          {/* 3. Main Content Area */}
          <div className="flex-1 flex flex-col relative z-20 overflow-hidden">
            {/* Top Header */}
            <header className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 border-b border-white/5">
              <div className="flex-1 flex items-center gap-3 md:gap-4">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <Menu size={20} />
                </button>
                <div className="relative group w-full max-w-md hidden sm:block">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                  <input type="text" placeholder="Search across workspace..." className="w-full bg-white/[0.03] border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all placeholder-gray-600 shadow-inner" />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMembersOpen(!isMembersOpen)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors relative ${isMembersOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
                >
                  <Users size={16} />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                </button>
                <div className="flex items-center gap-2 pl-3 border-l border-white/10 relative">
                    <button 
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden hover:border-orange-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <img src={user?.imageUrl || `https://i.pravatar.cc/150?u=${user?.id}`} className="w-full h-full object-cover" />
                    </button>

                    <AnimatePresence>
                      {isProfileDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-3 w-64 bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
                        >
                          <div className="p-4 border-b border-white/5 flex items-center gap-3">
                            <img src={user?.imageUrl || `https://i.pravatar.cc/150?u=${user?.id}`} className="w-10 h-10 rounded-full border border-white/10" />
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-white truncate">{user?.fullName || user?.firstName}</p>
                              <p className="text-xs text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                          </div>
                          <div className="p-2 space-y-1">
                            <button 
                              onClick={() => { setIsProfileDropdownOpen(false); setShowManageAccount(true); }}
                              className="w-full text-left px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                            >
                              Manage account
                            </button>
                            <button 
                              onClick={() => signOut(() => router.push('/login'))}
                              className="w-full text-left px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </div>
            </header>

            {/* Custom Manage Account Modal */}
            <AnimatePresence>
              {showManageAccount && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 p-8">
                  <ManageAccountModal onClose={() => setShowManageAccount(false)} />
                </div>
              )}
            </AnimatePresence>

            {/* Main Workspace */}
            <main className="flex-1 overflow-hidden z-0 relative flex">
               <div className="flex-1 relative">{children}</div>

               {/* Right Members Sidebar */}
               <AnimatePresence>
                 {isMembersOpen && (
                   <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-l border-white/5 bg-[#0a0a0c]/95 md:bg-[#0a0a0c]/80 backdrop-blur-xl h-full flex flex-col shrink-0 overflow-hidden absolute right-0 top-0 bottom-0 z-40 lg:relative lg:z-auto"
                   >
                     <div className="p-4 border-b border-white/5">
                        <h3 className="font-semibold text-white">Team Members</h3>
                        <p className="text-xs text-gray-500 mt-1">Code: <span className="font-mono text-purple-400 select-all">{team?.join_code}</span></p>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Online - {onlineUsers.length}</p>
                          <div className="space-y-3">
                            {teammates.filter(tm => onlineUsers.includes(tm.id)).map(tm => (
                              <div key={tm.id} className="flex items-center gap-3">
                                <div className="relative">
                                  <img src={tm.avatar_url || `https://i.pravatar.cc/150?u=${tm.id}`} className="w-8 h-8 rounded-full border border-white/10" />
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0a0a0c] rounded-full"></span>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-200 font-medium">{tm.full_name || 'Member'}</p>
                                  <p className="text-[10px] text-gray-500 capitalize">{tm.role}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Offline</p>
                          <div className="space-y-3">
                            {teammates.filter(tm => !onlineUsers.includes(tm.id)).map(tm => (
                              <div key={tm.id} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="relative">
                                  <img src={tm.avatar_url || `https://i.pravatar.cc/150?u=${tm.id}`} className="w-8 h-8 rounded-full border border-white/10 grayscale" />
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-500 border-2 border-[#0a0a0c] rounded-full"></span>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-200 font-medium">{tm.full_name || 'Member'}</p>
                                  <p className="text-[10px] text-gray-500 capitalize">{tm.role}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </main>
          </div>
          
      </div>

    </div>
  );
}
