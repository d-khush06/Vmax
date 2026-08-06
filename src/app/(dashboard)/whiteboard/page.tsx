"use client"

import React from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

export default function WhiteboardPage() {
  return (
    <div className="h-full w-full flex flex-col p-4 bg-white/[0.01] overflow-hidden">
      <header className="mb-4 px-2">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500">Collaborative Whiteboard</h2>
        <p className="text-gray-400 text-sm">Brainstorming session. Changes are saved locally for now.</p>
      </header>

      <div className="flex-1 overflow-hidden bg-black rounded-2xl border border-white/5 relative">
        <Tldraw persistenceKey="teamos-whiteboard" />
      </div>
    </div>
  );
}
