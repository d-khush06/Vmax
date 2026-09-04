import React from 'react';
import { MenuBarWrapper } from '@/components/MenuBarWrapper';
import { Dock } from '@/components/Dock';
import { LivePresence } from '@/components/LivePresence';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#000000] text-gray-200 overflow-hidden font-sans">
      {/* 1. Base Layer: Apple Mesh Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-1000">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-radial from-blue-600/40 via-indigo-600/10 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-radial from-purple-600/40 via-fuchsia-600/10 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[30%] w-[40vw] h-[40vw] rounded-full bg-gradient-radial from-cyan-500/40 via-blue-500/10 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      {/* App Foreground Layer */}
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        
        {/* Top Menu Bar */}
        <div className="pointer-events-auto w-full">
          <MenuBarWrapper />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative z-0 overflow-hidden pointer-events-auto p-4 md:p-8">
          <div className="w-full h-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col">
            {children}
          </div>
        </div>
        
        {/* Bottom Dock */}
        <Dock />
        <LivePresence teamId={teamId} />
      </div>
    </div>
  );
}
