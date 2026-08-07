"use client";

import { useEffect, useState } from 'react';
import { useTeam } from '@/lib/team-context';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
  useLocalParticipant,
  DisconnectButton,
  useTrackToggle
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Mic, ArrowRight, Video, MonitorUp, PhoneOff, MicOff, VideoOff, Users } from 'lucide-react';

function MicToggle() {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.Microphone });
  return (
    <button 
      onClick={() => toggle()}
      className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${enabled ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400'}`}
    >
      {enabled ? <Mic size={24} /> : <MicOff size={24} />}
    </button>
  );
}

function CameraToggle() {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.Camera });
  return (
    <button 
      onClick={() => toggle()}
      className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${enabled ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400'}`}
    >
      {enabled ? <Video size={24} /> : <VideoOff size={24} />}
    </button>
  );
}

function ScreenShareToggle() {
  const { toggle, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });
  return (
    <button 
      onClick={() => toggle()}
      className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${enabled ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50 text-blue-400' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
    >
      <MonitorUp size={24} />
    </button>
  );
}

function CustomVoiceUI({ roomName }: { roomName: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c]">
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center border border-green-500/20">
            <Mic size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2">
              #{roomName}
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">Active</span>
            </h2>
            <p className="text-gray-400 text-xs">Real-time voice and video</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-6 relative">
        {tracks.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center text-gray-500">
             <div className="text-center">
               <Users size={48} className="mx-auto mb-4 opacity-20" />
               <p>Waiting for participants...</p>
             </div>
           </div>
        ) : (
          <div className="grid gap-4 w-full h-full" style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
            gridAutoRows: '1fr'
          }}>
            {tracks.map((track) => (
              <div key={track.participant.identity + track.source} className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black relative group transition-all hover:border-white/20">
                <ParticipantTile 
                  trackRef={track}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-24 border-t border-white/5 bg-white/[0.01] flex items-center justify-center gap-4 px-6 shrink-0">
        <MicToggle />
        <CameraToggle />
        <ScreenShareToggle />
        
        <DisconnectButton className="!w-auto !px-6 !h-14 !rounded-2xl !bg-red-500 hover:!bg-red-600 !border-0 !text-white flex items-center justify-center transition-all ml-4 gap-2 font-bold shadow-lg shadow-red-500/20">
          <PhoneOff size={20} />
          <span>Leave</span>
        </DisconnectButton>
      </div>
    </div>
  );
}

export default function VoiceRoomPage() {
  const [token, setToken] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const { team } = useTeam();
  const { user } = useUser();
  const router = useRouter();

  const roomName = team?.name ? `${team.name.toLowerCase().replace(/\s+/g, '-')}-voice` : 'general-voice';
  const username = user?.fullName || user?.firstName || 'User';
  const userId = user?.id || `anon_${Math.random()}`;

  useEffect(() => {
    if (!hasJoined || !team) return;

    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${roomName}&username=${encodeURIComponent(username)}&userId=${encodeURIComponent(userId)}`
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
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-[#0a0a0c] z-50">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mb-4"></div>
        <p>Connecting to secure voice server...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col z-50 overflow-hidden" data-lk-theme="default">
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column' }}
        onDisconnected={() => setHasJoined(false)}
      >
        <CustomVoiceUI roomName={roomName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
