"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface TeamContextType {
  team: any | null;
  myTeams: any[];
  user: any | null;
  teammates: any[];
  onlineUsers: string[];
  loading: boolean;
  switchTeam: (teamId: string) => void;
}

const TeamContext = createContext<TeamContextType>({
  team: null,
  myTeams: [],
  user: null,
  teammates: [],
  onlineUsers: [],
  loading: true,
  switchTeam: () => {}
});

export const useTeam = () => useContext(TeamContext);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // Initialize activeTeamId from localStorage on mount
  useEffect(() => {
    const savedTeamId = localStorage.getItem('vmax_active_team');
    if (savedTeamId) {
      setActiveTeamId(savedTeamId);
    }
  }, []);

  const myTeams = useQuery(api.teams.getMyTeams, { clerkId: user?.id || "" });
  
  // Determine the active team
  let myTeam = null;
  if (myTeams && myTeams.length > 0) {
    myTeam = myTeams.find((t: any) => t._id === activeTeamId) || myTeams[0];
  }
  
  // Sync the determined active team back to localStorage if it's the default fallback
  useEffect(() => {
    if (myTeam && myTeam._id !== activeTeamId) {
      setActiveTeamId(myTeam._id);
      localStorage.setItem('vmax_active_team', myTeam._id);
    }
  }, [myTeam, activeTeamId]);

  const switchTeam = (teamId: string) => {
    setActiveTeamId(teamId);
    localStorage.setItem('vmax_active_team', teamId);
  };
  
  // Conditionally query teammates only if we have a team
  const teammates = useQuery(api.teams.getTeammates, myTeam ? { teamId: myTeam._id } : "skip");

  // Mocking presence for now until fully implemented in Convex
  // Real Convex presence involves mutations and a heartbeat pattern
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Do not redirect on these public/auth pages
    if (pathname === '/' || pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/setup')) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (myTeams !== undefined && myTeams.length === 0) {
      router.push('/setup');
      return;
    }

    // Set online users to everyone in team for now (Mock)
    if (teammates) {
      setOnlineUsers(teammates.map((t: any) => t.id));
    }
  }, [isLoaded, user, myTeams, teammates, pathname, router]);

  return (
    <TeamContext.Provider value={{ 
      team: myTeam || null, 
      myTeams: myTeams || [],
      user: user || null, 
      teammates: teammates || [], 
      onlineUsers, 
      loading: !isLoaded || myTeams === undefined,
      switchTeam
    }}>
      {children}
    </TeamContext.Provider>
  );
}
