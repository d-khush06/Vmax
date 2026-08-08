import React from 'react';
import Link from 'next/link';
import { TerminalSquare, ShieldAlert, Cpu, Activity, Network, Key, SquareTerminal } from 'lucide-react';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-[#00FF41] font-mono selection:bg-[#00FF41] selection:text-black overflow-hidden">
      
      {/* ── GLOBAL TELEMETRY HEADER ── */}
      <header className="h-12 border-b-2 border-[#00FF41] bg-[#0A0A0A] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-r-2 border-[#00FF41]/30 pr-6">
            <TerminalSquare className="text-[#00FF41] animate-pulse" size={20} strokeWidth={1.5} />
            <h1 className="text-xl font-bold tracking-widest uppercase">VMAX // OS</h1>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-[#00FFFF]">
            <ShieldAlert size={14} />
            <span className="tracking-widest">ENCRYPTED_LINK_ESTABLISHED</span>
          </div>
        </div>

        {/* System Vitals */}
        <div className="flex items-center gap-6 text-[11px] uppercase tracking-widest text-[#00FF41]/80">
          <div className="flex items-center gap-2">
            <Cpu size={14} /> SYS_LD: <span className="text-[#00FFFF]">1.4%</span>
          </div>
          <div className="flex items-center gap-2">
            <Network size={14} /> PING: <span className="text-[#00FFFF]">12ms</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} /> NODE: <span className="text-[#00FFFF]">US-EAST</span>
          </div>
        </div>
      </header>

      {/* ── MAIN TERMINAL VIEWPORT ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── LEFT DOCKED PANEL (NAVIGATION) ── */}
        <aside className="w-72 border-r-2 border-[#00FF41] bg-[#0A0A0A] flex flex-col justify-between shrink-0">
          <div className="p-4">
            <div className="flex items-center gap-2 text-[#00FFFF] border-b border-[#00FFFF]/30 pb-2 mb-4">
              <SquareTerminal size={14} />
              <h2 className="text-sm font-bold tracking-widest">DIR: /WORKSPACE/{teamId.substring(0, 8)}</h2>
            </div>

            <nav className="flex flex-col gap-1 mt-2">
              <Link 
                href={`/workspace/${teamId}`} 
                className="group flex items-center justify-between px-3 py-2 border border-transparent hover:border-[#00FF41] hover:bg-[#00FF41]/10 transition-colors rounded-none"
              >
                <span className="text-sm tracking-wide group-hover:text-[#00FFFF] transition-colors">./terminal_chat</span>
                <span className="text-[10px] text-[#00FF41]/50 group-hover:text-[#00FFFF]/80">[TCP/IP]</span>
              </Link>
              
              <Link 
                href={`/workspace/${teamId}/voice`} 
                className="group flex items-center justify-between px-3 py-2 border border-transparent hover:border-[#00FF41] hover:bg-[#00FF41]/10 transition-colors rounded-none"
              >
                <span className="text-sm tracking-wide group-hover:text-[#00FFFF] transition-colors">./secure_comms</span>
                <span className="text-[10px] text-[#00FF41]/50 group-hover:text-[#00FFFF]/80">[UDP/RTC]</span>
              </Link>
              
              <Link 
                href={`/workspace/${teamId}/whiteboard`} 
                className="group flex items-center justify-between px-3 py-2 border border-transparent hover:border-[#00FF41] hover:bg-[#00FF41]/10 transition-colors rounded-none"
              >
                <span className="text-sm tracking-wide group-hover:text-[#00FFFF] transition-colors">./matrix_board</span>
                <span className="text-[10px] text-[#00FF41]/50 group-hover:text-[#00FFFF]/80">[YJS/SYNC]</span>
              </Link>
            </nav>
          </div>

          {/* User Auth Telemetry Bottom Bar */}
          <div className="p-4 border-t-2 border-[#00FF41]/30 bg-[#000000]">
            <div className="flex items-start gap-3">
              <Key className="text-[#00FFFF] mt-1 shrink-0" size={16} />
              <div className="flex flex-col">
                <span className="text-[10px] text-[#00FF41]/70 uppercase tracking-widest">Access Token</span>
                <span className="text-xs font-bold text-[#00FF41] truncate w-48">VALID_JWT_SESSION_ACTIVE</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── EXECUTABLE WINDOW (CHILDREN) ── */}
        <main className="flex-1 bg-[#000000] relative p-6 overflow-hidden">
          {/* Subtle grid background to enhance terminal feel */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          
          <div className="w-full h-full relative z-10 border border-[#00FF41]/50 bg-[#050505] shadow-[0_0_30px_rgba(0,255,65,0.05)] overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
