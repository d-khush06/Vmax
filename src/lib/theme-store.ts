import { create } from 'zustand';

type Theme = 'classic' | 'voxel';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  // Dynamic vocabulary helpers based on active theme
  vocab: {
    workspace: string;
    roleOwner: string;
    roleAdmin: string;
    roleMember: string;
    files: string;
    notifications: string;
  };
}

const getVocab = (theme: Theme) => {
  if (theme === 'voxel') {
    return {
      workspace: 'World',
      roleOwner: 'Admin/OP',
      roleAdmin: 'Moderator',
      roleMember: 'Player',
      files: 'Chest',
      notifications: 'Achievement',
    };
  }
  return {
    workspace: 'Workspace',
    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleMember: 'Member',
    files: 'Files',
    notifications: 'Notifications',
  };
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'classic',
  setTheme: (theme) => {
    // Also apply a CSS class to the root HTML element for global styling
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('theme-classic', 'theme-voxel');
      root.classList.add(`theme-${theme}`);
    }
    set({ theme, vocab: getVocab(theme) });
  },
  vocab: getVocab('classic'),
}));
