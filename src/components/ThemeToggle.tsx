'use client';

import { useThemeStore } from '@/lib/theme-store';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const updateTheme = useMutation(api.users.updateTheme);
  const { user } = useUser();
  const dbTheme = useQuery(api.users.getTheme, user ? { clerkId: user.id } : "skip");

  useEffect(() => {
    if (dbTheme && dbTheme !== theme) {
      setTheme(dbTheme as any);
    }
  }, [dbTheme]);

  const handleToggle = async () => {
    const newTheme = theme === 'classic' ? 'voxel' : 'classic';
    setTheme(newTheme);
    
    if (user) {
      try {
        await updateTheme({ clerkId: user.id, theme: newTheme });
      } catch (err) {
        console.error("Failed to update theme in backend:", err);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="w-full text-left px-4 py-2 text-sm font-medium text-[var(--quartz)] hover:text-white hover:bg-[var(--slate-raised)] transition-colors"
      title="Toggle Theme"
    >
      {theme === 'voxel' ? 'Switch to Classic Mode' : 'Switch to Voxel Mode'}
    </button>
  );
}
