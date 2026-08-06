"use client"

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Users, Plus, ArrowRight, Copy, CheckCircle2 } from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function SetupPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddAction = searchParams.get('action') === 'add';
  
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'success'>('select');
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [generatedJoinCode, setGeneratedJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // We should query myTeams instead of myTeam here to check existence, but checking myTeam is also fine
  const myTeams = useQuery(api.teams.getMyTeams, { clerkId: user?.id });
  const createTeam = useMutation(api.teams.create);
  const joinTeam = useMutation(api.teams.join);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/login');
      return;
    }
    
    // If they already have a team, we aren't explicitly holding them on success screen, 
    // and they haven't explicitly requested to add a new workspace via ?action=add
    if (myTeams && myTeams.length > 0 && mode !== 'success' && !isAddAction) {
      router.push('/kanban');
    }
  }, [isLoaded, user, myTeams, router, mode, isAddAction]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setActionLoading(true);
    setError(null);

    try {
      const result = await createTeam({ 
        name: teamName,
        clerkId: user?.id,
        clerkName: user?.fullName || '',
        clerkEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        clerkAvatar: user?.imageUrl || ''
      });
      setGeneratedJoinCode(result.joinCode);
      setMode('success');
    } catch (err: any) {
      setError(err.message || 'Failed to create team.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionLoading(true);
    setError(null);

    try {
      await joinTeam({ 
        joinCode: joinCode.trim().toUpperCase(),
        clerkId: user?.id,
        clerkName: user?.fullName || '',
        clerkEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        clerkAvatar: user?.imageUrl || ''
      });
      router.push('/kanban');
    } catch (err: any) {
      setError(err.message || 'Failed to join team.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedJoinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded || (myTeams === undefined && mode !== 'success')) {
    return (
      <div className="min-h-screen w-screen bg-[#030303] flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#030303] flex items-center justify-center relative overflow-hidden text-gray-200 font-sans">
      
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-gradient-to-b from-orange-500/10 via-purple-500/5 to-transparent pointer-events-none blur-[100px] mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="w-full max-w-lg p-8 lg:p-10 bg-[#0a0a0c]/90 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-[0_0_100px_rgba(249,115,22,0.05)] relative z-10 transition-all duration-500">
        
        {mode === 'select' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
                V
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Your Workspace</h1>
            <p className="text-center text-gray-400 text-sm mb-10 leading-relaxed">
              Create a new team environment or join an existing one using an invite code.
            </p>

            <div className="space-y-4">
              <button 
                onClick={() => setMode('create')}
                className="w-full p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/30 transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Plus size={28} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-200 text-lg">Create New Team</h3>
                  <p className="text-sm text-gray-500 mt-1">Start a fresh workspace</p>
                </div>
                <ArrowRight size={20} className="text-gray-600 group-hover:text-orange-400 group-hover:-translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => setMode('join')}
                className="w-full p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Users size={28} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-200 text-lg">Join Existing Team</h3>
                  <p className="text-sm text-gray-500 mt-1">I have an invite code</p>
                </div>
                <ArrowRight size={20} className="text-gray-600 group-hover:text-purple-400 group-hover:-translate-x-1 transition-all" />
              </button>
            </div>
            
            <button 
                onClick={() => {
                  if (isAddAction) {
                    router.push('/kanban');
                  } else {
                    signOut();
                    router.push('/login');
                  }
                }}
                className="mt-10 text-sm text-gray-500 hover:text-gray-300 w-full text-center transition-colors"
              >
                {isAddAction ? 'Cancel and return to Dashboard' : `Sign out of ${user?.emailAddresses?.[0]?.emailAddress || "your account"}`}
              </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <button onClick={() => { setMode('select'); setError(null); }} className="text-sm text-gray-500 hover:text-gray-300 mb-8 flex items-center gap-2 transition-colors">
               &larr; Back to select
             </button>
             
             <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                <Plus size={24} />
             </div>

             <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Name your team</h2>
             <p className="text-gray-400 mb-8">Give your new workspace a recognizable name.</p>

             {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{error}</div>}

             <form onSubmit={handleCreateTeam} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                  <input 
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all text-white placeholder-gray-600"
                    autoFocus
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={actionLoading || !teamName.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/20"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Workspace'}
                </button>
             </form>
          </div>
        )}

        {mode === 'success' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center">
             
             <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-6">
                <CheckCircle2 size={40} />
             </div>

             <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Workspace Created!</h2>
             <p className="text-gray-400 mb-8 max-w-[280px]">
               Your team is ready. Invite members by sharing this join code with them.
             </p>

             <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 relative group">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invite Code</div>
                <div className="text-3xl font-mono font-bold text-white tracking-widest">{generatedJoinCode}</div>
                
                <button 
                  onClick={copyToClipboard}
                  className="absolute top-1/2 -translate-y-1/2 right-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-300"
                >
                  {copied ? <CheckCircle2 size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
             </div>

             <button 
                onClick={() => router.push('/kanban')}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-4 rounded-xl transition-all shadow-lg"
             >
                Continue to Dashboard &rarr;
             </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
             <button onClick={() => { setMode('select'); setError(null); }} className="text-sm text-gray-500 hover:text-gray-300 mb-8 flex items-center gap-2 transition-colors">
               &larr; Back to select
             </button>
             
             <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
                <Users size={24} />
             </div>

             <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Join a team</h2>
             <p className="text-gray-400 mb-8">Enter the 10-character invite code provided by your team owner.</p>

             {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{error}</div>}

             <form onSubmit={handleJoinTeam} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Invite Code</label>
                  <input 
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="VMAX-XXXXX"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder-gray-600 font-mono tracking-widest"
                    autoFocus
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={actionLoading || !joinCode.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/20"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Workspace'}
                </button>
             </form>
          </div>
        )}

      </div>
    </div>
  );
}
