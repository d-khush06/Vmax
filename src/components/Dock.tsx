'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, MessageSquare, Mic, Kanban, Calendar, Monitor, Folder, Hash } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTeam } from '@/lib/team-context';

export function Dock() {
  const pathname = usePathname();
  const { team } = useTeam();
  
  const voiceRoomId = team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice';

  const navItems = [
    { name: 'World', icon: Compass, href: '/world', color: 'from-blue-400 to-blue-600' },
    { name: 'Chat', icon: MessageSquare, href: '/chat/general', color: 'from-emerald-400 to-emerald-600' },
    { name: 'Voice', icon: Mic, href: `/voice/${voiceRoomId}`, color: 'from-amber-400 to-amber-600' },
    { name: 'Tasks', icon: Kanban, href: '/tasks', color: 'from-purple-400 to-purple-600' },
    { name: 'Calendar', icon: Calendar, href: '/calendar', color: 'from-pink-400 to-pink-600' },
    { name: 'Whiteboard', icon: Monitor, href: '/whiteboard', color: 'from-cyan-400 to-cyan-600' },
    { name: 'Files', icon: Folder, href: '/files', color: 'from-yellow-400 to-yellow-600' },
    { name: 'Automations', icon: Hash, href: '/automations', color: 'from-rose-400 to-rose-600' },
  ];

  return (
    <div className="w-full flex justify-center pb-4 pt-2 z-50 pointer-events-none shrink-0">
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative group p-1.5 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.25] hover:-translate-y-2 origin-bottom active:scale-95"
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/10 rounded-xl shadow-inner" />
              )}
              
              <div className={`w-10 h-10 flex items-center justify-center rounded-[12px] bg-gradient-to-br ${item.color} shadow-md shadow-black/20 text-white group-active:brightness-90`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}

              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
