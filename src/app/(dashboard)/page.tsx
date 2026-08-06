import React from 'react';

export default function DashboardOverview() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center">
      <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
        <span className="text-3xl">🚀</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Welcome to Team OS</h2>
      <p className="text-gray-400 max-w-md">
        Your next-generation workspace is ready. Use the sidebar to navigate to Chat, Files, Calendar, or Kanban boards.
      </p>
    </div>
  );
}
