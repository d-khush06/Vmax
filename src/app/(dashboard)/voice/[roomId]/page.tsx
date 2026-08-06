"use client";

import { useEffect, useState } from 'react';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Mic, ArrowRight } from 'lucide-react';

export default function VoiceRoomPage() {
  const [token, setToken] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const { team } = useTeam();
  const { user } = useUser();
  const router = useRouter();

  const roomName = team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice';
  const username = user?.fullName || user?.firstName || 'User';

  useEffect(() => {
    if (!hasJoined || !team) return;

    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${roomName}&username=${encodeURIComponent(username)}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [hasJoined, team, roomName, username]);

  if (!hasJoined) {
    return (
      <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center z-50">
        <div className="w-full max-w-sm bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-600/20 flex items-center justify-center mb-5 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
            <Mic size={28} className="text-green-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Ready to join?</h2>
          <p className="text-gray-400 mb-8">
            You are about to join the <span className="text-white font-medium">#{roomName}</span> channel.
          </p>

          <button
            onClick={() => setHasJoined(true)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all flex items-center justify-center gap-2 group"
          >
            Join Voice <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => router.push('/tasks')}
            className="mt-4 text-sm font-medium text-gray-500 hover:text-white transition-colors"
          >
            Cancel and return
          </button>
        </div>
      </div>
    );
  }

  if (token === "") {
    return <div className="absolute inset-0 flex items-center justify-center text-gray-400">Getting token...</div>;
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col z-50" data-lk-theme="default">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100dvh' }}
        onDisconnected={() => setHasJoined(false)}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
