'use client';

import { useThemeStore } from '@/lib/theme-store';
import { RedstoneLab } from '@/components/RedstoneLab';

export default function AutomationsPage() {
  const { theme } = useThemeStore();

  return (
    <div className="h-full w-full flex flex-col bg-transparent font-sans p-6">
      <header className="mb-6 flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Automations
        </h1>
      </header>
      <div className="flex-1 relative bg-white/10 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <RedstoneLab />
      </div>
    </div>
  );
}
